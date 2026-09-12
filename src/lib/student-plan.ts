import { createClient } from "@supabase/supabase-js"
import { StudentPlan, DEFAULT_PLAN, calculateNextPlanState } from "./plan-utils"
import { getTodayDateStr } from "./date-utils"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getStudentPlan(studentId: string, forDate?: string): Promise<StudentPlan> {
  const supabase = getAdminClient()
  const todayStr = forDate || getTodayDateStr()
  try {
    // 1. Try checking profiles table first
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single()

    // 2. Also check auth user_metadata
    const { data: authData } = await supabase.auth.admin.getUserById(studentId)
    const meta = authData?.user?.user_metadata || {}

    // Parse memorized_ajza
    let memorizedAjza: number[] = [1]
    if (Array.isArray(profile?.memorized_ajza)) {
      memorizedAjza = profile.memorized_ajza
    } else if (Array.isArray(meta.memorized_ajza)) {
      memorizedAjza = meta.memorized_ajza
    } else if (typeof profile?.current_review_hizb === "number" || typeof meta.current_review_hizb === "number") {
      // Fallback: deduce Juz from hizb
      const h = Number(profile?.current_review_hizb ?? meta.current_review_hizb)
      const j = Math.max(1, Math.min(30, Math.ceil(h / 2)))
      memorizedAjza = [j]
    }

    const reviewIndex = Number(profile?.current_review_index ?? meta.current_review_index ?? 0)

    let currentPage = profile?.current_page ?? meta.current_page ?? DEFAULT_PLAN.current_page
    let pagePart: "top" | "bottom" = (profile?.page_part === "bottom" || meta.page_part === "bottom") ? "bottom" : "top"
    let reviewHizb = profile?.current_review_hizb ?? meta.current_review_hizb ?? DEFAULT_PLAN.current_review_hizb
    let reviewIndexVal = isNaN(reviewIndex) ? 0 : Math.max(0, reviewIndex)
    let isInConsolidation = Boolean(profile?.is_in_consolidation ?? meta.is_in_consolidation ?? false)
    let consolidationDay = Number(profile?.consolidation_day ?? meta.consolidation_day ?? 0)
    let consolidationJuz = Number(profile?.consolidation_juz ?? meta.consolidation_juz ?? 0)

    let planDate: string = meta.plan_date || todayStr
    let lastCompletedDate: string | null = meta.last_lesson_completed_date || null
    let dailySnapshots: Record<string, any> = { ...(meta.daily_plan_snapshots || {}) }

    // Check if new day has arrived (midnight rollover)
    if (todayStr > planDate) {
      let didCompleteOnPlanDate = (lastCompletedDate === planDate)

      if (!didCompleteOnPlanDate) {
        // Fallback check daily_assignments table for planDate
        const { data: lessonRows } = await supabase
          .from("daily_assignments")
          .select("completed, tasks!inner(name)")
          .eq("student_id", studentId)
          .eq("assigned_date", planDate)
          .like("tasks.name", "%الدرس%")
          .eq("completed", true)
          .limit(1)

        if (lessonRows && lessonRows.length > 0) {
          didCompleteOnPlanDate = true
        }
      }

      // Check if student was under manual consolidation on planDate
      let isManualActiveOnPlanDate = false
      try {
        const { getActiveManualConsolidation } = await import("@/lib/manual-consolidation")
        const activeManual = await getActiveManualConsolidation(studentId, planDate)
        if (activeManual) isManualActiveOnPlanDate = true
      } catch {}

      // Preserve snapshot for the previous planDate
      if (!dailySnapshots[planDate]) {
        dailySnapshots[planDate] = {
          page: currentPage,
          part: pagePart,
          hizb: reviewHizb,
          is_in_consolidation: isInConsolidation,
          consolidation_day: consolidationDay,
          consolidation_juz: consolidationJuz,
        }
      }

      // If the lesson was completed on planDate, advance pointer to the next part!
      if (didCompleteOnPlanDate && !isManualActiveOnPlanDate) {
        const tempPlan: StudentPlan = {
          current_page: currentPage,
          page_part: pagePart,
          current_review_hizb: reviewHizb,
          memorized_ajza: memorizedAjza,
          current_review_index: reviewIndexVal,
          is_in_consolidation: isInConsolidation,
          consolidation_day: consolidationDay,
          consolidation_juz: consolidationJuz,
        }
        const nextState = calculateNextPlanState(tempPlan, "الدرس", true)
        currentPage = nextState.current_page
        pagePart = nextState.page_part
        isInConsolidation = Boolean(nextState.is_in_consolidation)
        consolidationDay = nextState.consolidation_day || 0
        consolidationJuz = nextState.consolidation_juz || 0
      }

      planDate = todayStr

      // Snapshot today's active starting plan
      dailySnapshots[todayStr] = {
        page: currentPage,
        part: pagePart,
        hizb: reviewHizb,
        is_in_consolidation: isInConsolidation,
        consolidation_day: consolidationDay,
        consolidation_juz: consolidationJuz,
      }

      // Persist rollover state to Auth user_metadata
      await supabase.auth.admin.updateUserById(studentId, {
        user_metadata: {
          ...meta,
          current_page: currentPage,
          page_part: pagePart,
          current_review_hizb: reviewHizb,
          memorized_ajza: memorizedAjza,
          current_review_index: reviewIndexVal,
          is_in_consolidation: isInConsolidation,
          consolidation_day: consolidationDay,
          consolidation_juz: consolidationJuz,
          plan_date: planDate,
          daily_plan_snapshots: dailySnapshots,
        },
      })

      // Also persist to profiles table if columns exist
      try {
        await supabase
          .from("profiles")
          .update({
            current_page: currentPage,
            page_part: pagePart,
            current_review_hizb: reviewHizb,
            memorized_ajza: memorizedAjza,
            current_review_index: reviewIndexVal,
            is_in_consolidation: isInConsolidation,
            consolidation_day: consolidationDay,
            consolidation_juz: consolidationJuz,
          })
          .eq("id", studentId)
      } catch {}
    } else {
      // Ensure today's snapshot exists
      if (!dailySnapshots[todayStr]) {
        dailySnapshots[todayStr] = {
          page: currentPage,
          part: pagePart,
          hizb: reviewHizb,
          is_in_consolidation: isInConsolidation,
          consolidation_day: consolidationDay,
          consolidation_juz: consolidationJuz,
        }
        await supabase.auth.admin.updateUserById(studentId, {
          user_metadata: {
            ...meta,
            plan_date: planDate,
            daily_plan_snapshots: dailySnapshots,
          },
        })
      }
    }

    return {
      current_page: currentPage,
      page_part: pagePart,
      current_review_hizb: reviewHizb,
      memorized_ajza: memorizedAjza,
      current_review_index: reviewIndexVal,
      is_in_consolidation: isInConsolidation,
      consolidation_day: consolidationDay,
      consolidation_juz: consolidationJuz,
      plan_start_date: profile?.plan_start_date ?? meta.plan_start_date ?? DEFAULT_PLAN.plan_start_date,
      plan_end_date: profile?.plan_end_date ?? meta.plan_end_date ?? DEFAULT_PLAN.plan_end_date,
      plan_active: profile?.plan_active ?? meta.plan_active ?? DEFAULT_PLAN.plan_active,
      plan_date: planDate,
      last_lesson_completed_date: lastCompletedDate,
      daily_plan_snapshots: dailySnapshots,
    }
  } catch (err) {
    console.error("Error fetching student plan:", err)
    return DEFAULT_PLAN
  }
}

export async function markStudentLessonCompleted(studentId: string, dateStr: string, completed: boolean): Promise<void> {
  const supabase = getAdminClient()
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(studentId)
    const meta = authData?.user?.user_metadata || {}
    const dailySnapshots = { ...(meta.daily_plan_snapshots || {}) }

    // Ensure snapshot for dateStr is recorded if not present
    if (!dailySnapshots[dateStr]) {
      dailySnapshots[dateStr] = {
        page: meta.current_page ?? DEFAULT_PLAN.current_page,
        part: meta.page_part ?? DEFAULT_PLAN.page_part,
        hizb: meta.current_review_hizb ?? DEFAULT_PLAN.current_review_hizb,
        is_in_consolidation: meta.is_in_consolidation ?? false,
        consolidation_day: meta.consolidation_day ?? 0,
        consolidation_juz: meta.consolidation_juz ?? 0,
      }
    }

    let lastCompletedDate: string | null = meta.last_lesson_completed_date || null
    if (completed) {
      lastCompletedDate = dateStr
    } else if (lastCompletedDate === dateStr) {
      lastCompletedDate = null
    }

    await supabase.auth.admin.updateUserById(studentId, {
      user_metadata: {
        ...meta,
        last_lesson_completed_date: lastCompletedDate,
        daily_plan_snapshots: dailySnapshots,
      },
    })
  } catch (err) {
    console.error("Error marking student lesson completed:", err)
  }
}

export async function updateStudentPlan(studentId: string, updates: Partial<StudentPlan>): Promise<StudentPlan> {
  const supabase = getAdminClient()
  try {
    const current = await getStudentPlan(studentId)
    const todayStr = getTodayDateStr()
    const merged: StudentPlan = {
      ...current,
      ...updates,
      current_page: updates.current_page !== undefined ? Math.max(1, Math.min(604, updates.current_page)) : current.current_page,
      current_review_hizb: updates.current_review_hizb !== undefined ? Math.max(1, Math.min(60, updates.current_review_hizb)) : current.current_review_hizb,
      page_part: updates.page_part === "bottom" ? "bottom" : "top",
      memorized_ajza: Array.isArray(updates.memorized_ajza)
        ? (updates.memorized_ajza.length > 0 ? updates.memorized_ajza : [1])
        : current.memorized_ajza,
      current_review_index: updates.current_review_index !== undefined ? Math.max(0, updates.current_review_index) : current.current_review_index,
      is_in_consolidation: updates.is_in_consolidation !== undefined ? Boolean(updates.is_in_consolidation) : current.is_in_consolidation,
      consolidation_day: updates.consolidation_day !== undefined ? Number(updates.consolidation_day) : current.consolidation_day,
      consolidation_juz: updates.consolidation_juz !== undefined ? Number(updates.consolidation_juz) : current.consolidation_juz,
      plan_date: updates.plan_date || current.plan_date || todayStr,
      last_lesson_completed_date: updates.last_lesson_completed_date !== undefined ? updates.last_lesson_completed_date : current.last_lesson_completed_date,
    }

    // Update today's snapshot to match the teacher's explicit update
    const dailySnapshots = {
      ...(current.daily_plan_snapshots || {}),
      ...(updates.daily_plan_snapshots || {}),
      [todayStr]: {
        page: merged.current_page,
        part: merged.page_part,
        hizb: merged.current_review_hizb,
        is_in_consolidation: merged.is_in_consolidation,
        consolidation_day: merged.consolidation_day,
        consolidation_juz: merged.consolidation_juz,
      },
    }
    merged.daily_plan_snapshots = dailySnapshots

    // 1. Update Auth user_metadata
    const { data: authData } = await supabase.auth.admin.getUserById(studentId)
    const existingMeta = authData?.user?.user_metadata || {}

    await supabase.auth.admin.updateUserById(studentId, {
      user_metadata: {
        ...existingMeta,
        current_page: merged.current_page,
        page_part: merged.page_part,
        current_review_hizb: merged.current_review_hizb,
        memorized_ajza: merged.memorized_ajza,
        current_review_index: merged.current_review_index,
        is_in_consolidation: merged.is_in_consolidation,
        consolidation_day: merged.consolidation_day,
        consolidation_juz: merged.consolidation_juz,
        plan_start_date: merged.plan_start_date,
        plan_end_date: merged.plan_end_date,
        plan_active: merged.plan_active,
        plan_date: merged.plan_date,
        last_lesson_completed_date: merged.last_lesson_completed_date,
        daily_plan_snapshots: merged.daily_plan_snapshots,
      },
    })

    // 2. Try updating profiles table (will succeed if columns were added via SQL)
    try {
      await supabase
        .from("profiles")
        .update({
          current_page: merged.current_page,
          page_part: merged.page_part,
          current_review_hizb: merged.current_review_hizb,
          memorized_ajza: merged.memorized_ajza,
          current_review_index: merged.current_review_index,
          is_in_consolidation: merged.is_in_consolidation,
          consolidation_day: merged.consolidation_day,
          consolidation_juz: merged.consolidation_juz,
          plan_start_date: merged.plan_start_date,
          plan_active: merged.plan_active,
        })
        .eq("id", studentId)
    } catch {
      // Ignore if columns do not exist in profiles yet
    }

    return merged
  } catch (err) {
    console.error("Error updating student plan:", err)
    throw err
  }
}

/**
 * Bulk fetches plans for all students in 2 parallel requests (profiles + listUsers)
 * completely eliminating N+1 queries (18 queries -> 2 queries).
 */
export async function getAllStudentsPlans(studentIds?: string[]): Promise<Map<string, StudentPlan>> {
  const supabase = getAdminClient()
  const plansMap = new Map<string, StudentPlan>()

  try {
    let profilesQuery = supabase.from("profiles").select("*").eq("role", "student")
    if (studentIds && studentIds.length > 0) {
      profilesQuery = profilesQuery.in("id", studentIds)
    }

    const [profilesRes, authRes] = await Promise.all([
      profilesQuery,
      supabase.auth.admin.listUsers(),
    ])

    const authMetaMap = new Map<string, any>()
    for (const u of authRes.data?.users || []) {
      authMetaMap.set(u.id, u.user_metadata || {})
    }

    const profiles = profilesRes.data || []
    for (const profile of profiles) {
      const meta = authMetaMap.get(profile.id) || {}

      let memorizedAjza: number[] = [1]
      if (Array.isArray(profile.memorized_ajza)) {
        memorizedAjza = profile.memorized_ajza
      } else if (Array.isArray(meta.memorized_ajza)) {
        memorizedAjza = meta.memorized_ajza
      } else if (typeof profile.current_review_hizb === "number" || typeof meta.current_review_hizb === "number") {
        const h = Number(profile.current_review_hizb ?? meta.current_review_hizb)
        const j = Math.max(1, Math.min(30, Math.ceil(h / 2)))
        memorizedAjza = [j]
      }

      const reviewIndex = Number(profile.current_review_index ?? meta.current_review_index ?? 0)

      const plan: StudentPlan = {
        current_page: profile.current_page ?? meta.current_page ?? DEFAULT_PLAN.current_page,
        page_part: (profile.page_part ?? meta.page_part ?? DEFAULT_PLAN.page_part) as "top" | "bottom",
        current_review_hizb: profile.current_review_hizb ?? meta.current_review_hizb ?? DEFAULT_PLAN.current_review_hizb,
        memorized_ajza: memorizedAjza,
        current_review_index: isNaN(reviewIndex) ? 0 : Math.max(0, reviewIndex),
        is_in_consolidation: Boolean(profile.is_in_consolidation ?? meta.is_in_consolidation ?? false),
        consolidation_day: Number(profile.consolidation_day ?? meta.consolidation_day ?? 0),
        consolidation_juz: Number(profile.consolidation_juz ?? meta.consolidation_juz ?? 0),
        plan_start_date: profile?.plan_start_date ?? meta.plan_start_date ?? DEFAULT_PLAN.plan_start_date,
        plan_end_date: profile?.plan_end_date ?? meta.plan_end_date ?? DEFAULT_PLAN.plan_end_date,
        plan_active: profile?.plan_active ?? meta.plan_active ?? DEFAULT_PLAN.plan_active,
        plan_date: meta.plan_date,
        last_lesson_completed_date: meta.last_lesson_completed_date || null,
        daily_plan_snapshots: meta.daily_plan_snapshots || {},
      }

      plansMap.set(profile.id, plan)
    }
  } catch (err) {
    console.error("Error bulk fetching student plans:", err)
  }

  return plansMap
}

