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

/**
 * Maps a raw row from student_plans table into the StudentPlan TypeScript interface.
 */
function rowToStudentPlan(row: any): StudentPlan {
  const memorizedAjza = Array.isArray(row.memorized_ajza) && row.memorized_ajza.length > 0
    ? row.memorized_ajza
    : [1]
  const reviewIndex = Number(row.current_review_index ?? 0)

  return {
    current_page: row.current_page ?? DEFAULT_PLAN.current_page,
    page_part: row.page_part === "bottom" ? "bottom" : "top",
    current_review_hizb: row.current_review_hizb ?? DEFAULT_PLAN.current_review_hizb,
    memorized_ajza: memorizedAjza,
    current_review_index: isNaN(reviewIndex) ? 0 : Math.max(0, reviewIndex),
    is_in_consolidation: Boolean(row.is_in_consolidation),
    consolidation_day: Number(row.consolidation_day ?? 0),
    consolidation_juz: Number(row.consolidation_juz ?? 0),
    plan_start_date: row.plan_start_date || DEFAULT_PLAN.plan_start_date,
    plan_end_date: row.plan_end_date || DEFAULT_PLAN.plan_end_date,
    plan_active: row.plan_active !== undefined ? Boolean(row.plan_active) : true,
    plan_date: row.plan_date || null,
    last_lesson_completed_date: row.last_lesson_completed_date || null,
    last_review_completed_date: row.last_review_completed_date || null,
    daily_plan_snapshots: row.daily_plan_snapshots || {},
  }
}

export async function getStudentPlan(studentId: string, forDate?: string): Promise<StudentPlan> {
  const supabase = getAdminClient()
  const todayStr = forDate || getTodayDateStr()
  try {
    // 1. Primary Source of Truth: query dedicated student_plans table
    const { data: planRow, error: planErr } = await supabase
      .from("student_plans")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle()

    let record = planRow

    // Graceful Fallback: If no record in student_plans yet (e.g. newly registered user), check auth metadata and seed
    if (!record) {
      const { data: authData } = await supabase.auth.admin.getUserById(studentId)
      const meta = authData?.user?.user_metadata || {}

      let memorizedAjza: number[] = [1]
      if (Array.isArray(meta.memorized_ajza) && meta.memorized_ajza.length > 0) {
        memorizedAjza = meta.memorized_ajza
      } else if (typeof meta.current_review_hizb === "number") {
        const h = Number(meta.current_review_hizb)
        memorizedAjza = [Math.max(1, Math.min(30, Math.ceil(h / 2)))]
      }

      const newRow = {
        student_id: studentId,
        current_page: meta.current_page ?? DEFAULT_PLAN.current_page,
        page_part: meta.page_part === "bottom" ? "bottom" : "top",
        current_review_hizb: meta.current_review_hizb ?? DEFAULT_PLAN.current_review_hizb,
        memorized_ajza: memorizedAjza,
        current_review_index: Math.max(0, Number(meta.current_review_index || 0)),
        is_in_consolidation: Boolean(meta.is_in_consolidation),
        consolidation_day: Number(meta.consolidation_day || 0),
        consolidation_juz: Number(meta.consolidation_juz || 0),
        plan_start_date: meta.plan_start_date || DEFAULT_PLAN.plan_start_date,
        plan_end_date: meta.plan_end_date || DEFAULT_PLAN.plan_end_date,
        plan_active: meta.plan_active !== undefined ? Boolean(meta.plan_active) : true,
        plan_date: meta.plan_date || todayStr,
        last_lesson_completed_date: meta.last_lesson_completed_date || null,
        last_review_completed_date: meta.last_review_completed_date || null,
        daily_plan_snapshots: meta.daily_plan_snapshots || {},
      }

      const { data: inserted } = await supabase
        .from("student_plans")
        .insert(newRow)
        .select("*")
        .single()

      record = inserted || newRow
    }

    const currentPlan = rowToStudentPlan(record)
    let currentPage = currentPlan.current_page
    let pagePart = currentPlan.page_part
    let reviewHizb = currentPlan.current_review_hizb
    let memorizedAjza = currentPlan.memorized_ajza
    let reviewIndexVal = currentPlan.current_review_index
    let isInConsolidation = currentPlan.is_in_consolidation
    let consolidationDay = currentPlan.consolidation_day
    let consolidationJuz = currentPlan.consolidation_juz
    let planDate = currentPlan.plan_date
    let lastCompletedDate = currentPlan.last_lesson_completed_date
    let lastReviewCompletedDate = currentPlan.last_review_completed_date
    let dailySnapshots: Record<string, any> = { ...(currentPlan.daily_plan_snapshots || {}) }

    if (!planDate) planDate = todayStr

    // Check if new day has arrived (midnight rollover)
    if (todayStr > planDate) {
      const iterDate = new Date(planDate + "T12:00:00Z")
      const todayDate = new Date(todayStr + "T12:00:00Z")

      while (iterDate < todayDate) {
        const y = iterDate.getUTCFullYear()
        const m = String(iterDate.getUTCMonth() + 1).padStart(2, "0")
        const d = String(iterDate.getUTCDate()).padStart(2, "0")
        const curDateStr = `${y}-${m}-${d}`

        // 1. Did student complete lesson on curDateStr?
        let didCompleteLesson = (lastCompletedDate === curDateStr)
        if (!didCompleteLesson) {
          const { data: lessonRows } = await supabase
            .from("daily_assignments")
            .select("completed, tasks!inner(name)")
            .eq("student_id", studentId)
            .eq("assigned_date", curDateStr)
            .like("tasks.name", "%الدرس%")
            .eq("completed", true)
            .limit(1)
          if (lessonRows && lessonRows.length > 0) {
            didCompleteLesson = true
          }
        }

        // 2. Did student complete review on curDateStr?
        let didCompleteReview = (lastReviewCompletedDate === curDateStr)
        if (!didCompleteReview) {
          const { data: reviewRows } = await supabase
            .from("daily_assignments")
            .select("completed, tasks!inner(name)")
            .eq("student_id", studentId)
            .eq("assigned_date", curDateStr)
            .like("tasks.name", "%المراجعة%")
            .eq("completed", true)
            .limit(1)
          if (reviewRows && reviewRows.length > 0) {
            didCompleteReview = true
          }
        }

        // Check manual consolidation on curDateStr
        let isManualActiveOnCurDate = false
        try {
          const { getActiveManualConsolidation } = await import("@/lib/manual-consolidation")
          const activeManual = await getActiveManualConsolidation(studentId, curDateStr)
          if (activeManual) isManualActiveOnCurDate = true
        } catch {}

        // Preserve snapshot for curDateStr if not present
        if (!dailySnapshots[curDateStr]) {
          dailySnapshots[curDateStr] = {
            page: currentPage,
            part: pagePart,
            hizb: reviewHizb,
            review_index: reviewIndexVal,
            is_in_consolidation: isInConsolidation,
            consolidation_day: consolidationDay,
            consolidation_juz: consolidationJuz,
          }
        }

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

        // Advance lesson if completed on curDateStr
        if (didCompleteLesson && !isManualActiveOnCurDate) {
          const nextLessonState = calculateNextPlanState(tempPlan, "الدرس", true)
          currentPage = nextLessonState.current_page
          pagePart = nextLessonState.page_part
          isInConsolidation = Boolean(nextLessonState.is_in_consolidation)
          consolidationDay = nextLessonState.consolidation_day || 0
          consolidationJuz = nextLessonState.consolidation_juz || 0
          tempPlan.current_page = currentPage
          tempPlan.page_part = pagePart
          tempPlan.is_in_consolidation = isInConsolidation
          tempPlan.consolidation_day = consolidationDay
          tempPlan.consolidation_juz = consolidationJuz
        }

        // Advance review if completed on curDateStr
        if (didCompleteReview) {
          const nextReviewState = calculateNextPlanState(tempPlan, "المراجعة", true)
          reviewIndexVal = nextReviewState.current_review_index
          reviewHizb = nextReviewState.current_review_hizb || reviewHizb
        }

        iterDate.setUTCDate(iterDate.getUTCDate() + 1)
      }

      planDate = todayStr

      // Snapshot today's active starting plan
      dailySnapshots[todayStr] = {
        page: currentPage,
        part: pagePart,
        hizb: reviewHizb,
        review_index: reviewIndexVal,
        is_in_consolidation: isInConsolidation,
        consolidation_day: consolidationDay,
        consolidation_juz: consolidationJuz,
      }

      // Persist rollover directly to student_plans (100% Single Source of Truth)
      await supabase
        .from("student_plans")
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
    } else {
      // Ensure today's snapshot exists
      if (!dailySnapshots[todayStr]) {
        dailySnapshots[todayStr] = {
          page: currentPage,
          part: pagePart,
          hizb: reviewHizb,
          review_index: reviewIndexVal,
          is_in_consolidation: isInConsolidation,
          consolidation_day: consolidationDay,
          consolidation_juz: consolidationJuz,
        }
        await supabase
          .from("student_plans")
          .update({
            plan_date: planDate,
            daily_plan_snapshots: dailySnapshots,
            updated_at: new Date().toISOString(),
          })
          .eq("student_id", studentId)
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
      plan_start_date: currentPlan.plan_start_date,
      plan_end_date: currentPlan.plan_end_date,
      plan_active: currentPlan.plan_active,
      plan_date: planDate,
      last_lesson_completed_date: lastCompletedDate,
      last_review_completed_date: lastReviewCompletedDate,
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
    const current = await getStudentPlan(studentId)
    const dailySnapshots = { ...(current.daily_plan_snapshots || {}) }

    if (!dailySnapshots[dateStr]) {
      dailySnapshots[dateStr] = {
        page: current.current_page,
        part: current.page_part,
        hizb: current.current_review_hizb,
        review_index: current.current_review_index,
        is_in_consolidation: current.is_in_consolidation,
        consolidation_day: current.consolidation_day,
        consolidation_juz: current.consolidation_juz,
      }
    }

    let lastCompletedDate: string | null = current.last_lesson_completed_date || null
    if (completed) {
      lastCompletedDate = dateStr
    } else if (lastCompletedDate === dateStr) {
      lastCompletedDate = null
    }

    await supabase
      .from("student_plans")
      .update({
        last_lesson_completed_date: lastCompletedDate,
        daily_plan_snapshots: dailySnapshots,
        updated_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
  } catch (err) {
    console.error("Error marking student lesson completed:", err)
  }
}

export async function markStudentReviewCompleted(studentId: string, dateStr: string, completed: boolean): Promise<void> {
  const supabase = getAdminClient()
  try {
    const current = await getStudentPlan(studentId)
    const dailySnapshots = { ...(current.daily_plan_snapshots || {}) }

    if (!dailySnapshots[dateStr]) {
      dailySnapshots[dateStr] = {
        page: current.current_page,
        part: current.page_part,
        hizb: current.current_review_hizb,
        review_index: current.current_review_index,
        is_in_consolidation: current.is_in_consolidation,
        consolidation_day: current.consolidation_day,
        consolidation_juz: current.consolidation_juz,
      }
    }

    let lastReviewCompletedDate: string | null = current.last_review_completed_date || null
    if (completed) {
      lastReviewCompletedDate = dateStr
    } else if (lastReviewCompletedDate === dateStr) {
      lastReviewCompletedDate = null
    }

    await supabase
      .from("student_plans")
      .update({
        last_review_completed_date: lastReviewCompletedDate,
        daily_plan_snapshots: dailySnapshots,
        updated_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
  } catch (err) {
    console.error("Error marking student review completed:", err)
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
      last_review_completed_date: updates.last_review_completed_date !== undefined ? updates.last_review_completed_date : current.last_review_completed_date,
    }

    // Sync review index and hizb if one was updated explicitly
    const { getReviewCycle } = await import("@/lib/plan-utils")
    const cycle = getReviewCycle(merged.memorized_ajza)
    if (updates.current_review_hizb !== undefined && updates.current_review_index === undefined) {
      const foundIdx = cycle.findIndex(c => c.hizb === updates.current_review_hizb)
      if (foundIdx !== -1) {
        merged.current_review_index = foundIdx
      }
    } else if (updates.current_review_index !== undefined && updates.current_review_hizb === undefined) {
      const safeIdx = merged.current_review_index % cycle.length
      if (cycle[safeIdx]) {
        merged.current_review_hizb = cycle[safeIdx].hizb
      }
    }

    // Update today's snapshot to match the teacher's explicit update as new baseline
    const dailySnapshots = {
      ...(current.daily_plan_snapshots || {}),
      ...(updates.daily_plan_snapshots || {}),
      [todayStr]: {
        page: merged.current_page,
        part: merged.page_part,
        hizb: merged.current_review_hizb,
        review_index: merged.current_review_index,
        is_in_consolidation: merged.is_in_consolidation,
        consolidation_day: merged.consolidation_day,
        consolidation_juz: merged.consolidation_juz,
      },
    }
    merged.daily_plan_snapshots = dailySnapshots

    // Update student_plans table (100% Single Source of Truth)
    const { error: upsertErr } = await supabase
      .from("student_plans")
      .upsert(
        {
          student_id: studentId,
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
          last_review_completed_date: merged.last_review_completed_date,
          daily_plan_snapshots: merged.daily_plan_snapshots,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" }
      )

    if (upsertErr) {
      console.error("Error upserting student_plans:", upsertErr)
      throw upsertErr
    }

    return merged
  } catch (err) {
    console.error("Error updating student plan:", err)
    throw err
  }
}

/**
 * Bulk fetches plans for all students directly from student_plans table with a single query,
 * completely eliminating N+1 queries and avoiding auth.listUsers().
 */
export async function getAllStudentsPlans(studentIds?: string[]): Promise<Map<string, StudentPlan>> {
  const supabase = getAdminClient()
  const plansMap = new Map<string, StudentPlan>()

  try {
    let query = supabase.from("student_plans").select("*")
    if (studentIds && studentIds.length > 0) {
      query = query.in("student_id", studentIds)
    }

    const { data: rows, error } = await query
    if (error) {
      console.error("Error fetching all student plans:", error)
      return plansMap
    }

    for (const row of rows || []) {
      plansMap.set(row.student_id, rowToStudentPlan(row))
    }

    // If specific studentIds were requested but not found in student_plans, fallback gracefully
    if (studentIds && studentIds.length > 0) {
      for (const id of studentIds) {
        if (!plansMap.has(id)) {
          const plan = await getStudentPlan(id)
          plansMap.set(id, plan)
        }
      }
    }
  } catch (err) {
    console.error("Error bulk fetching student plans:", err)
  }

  return plansMap
}
