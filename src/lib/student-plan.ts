import { createClient } from "@supabase/supabase-js"
import { StudentPlan, DEFAULT_PLAN } from "./plan-utils"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getStudentPlan(studentId: string): Promise<StudentPlan> {
  const supabase = getAdminClient()
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

    return {
      current_page: profile?.current_page ?? meta.current_page ?? DEFAULT_PLAN.current_page,
      page_part: (profile?.page_part ?? meta.page_part ?? DEFAULT_PLAN.page_part) as "top" | "bottom",
      current_review_hizb: profile?.current_review_hizb ?? meta.current_review_hizb ?? DEFAULT_PLAN.current_review_hizb,
      memorized_ajza: memorizedAjza,
      current_review_index: isNaN(reviewIndex) ? 0 : Math.max(0, reviewIndex),
      is_in_consolidation: Boolean(profile?.is_in_consolidation ?? meta.is_in_consolidation ?? false),
      consolidation_day: Number(profile?.consolidation_day ?? meta.consolidation_day ?? 0),
      consolidation_juz: Number(profile?.consolidation_juz ?? meta.consolidation_juz ?? 0),
      plan_start_date: profile?.plan_start_date ?? meta.plan_start_date ?? DEFAULT_PLAN.plan_start_date,
      plan_end_date: profile?.plan_end_date ?? meta.plan_end_date ?? DEFAULT_PLAN.plan_end_date,
      plan_active: profile?.plan_active ?? meta.plan_active ?? DEFAULT_PLAN.plan_active,
    }
  } catch (err) {
    console.error("Error fetching student plan:", err)
    return DEFAULT_PLAN
  }
}

export async function updateStudentPlan(studentId: string, updates: Partial<StudentPlan>): Promise<StudentPlan> {
  const supabase = getAdminClient()
  try {
    const current = await getStudentPlan(studentId)
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
    }

    // 1. Update Auth user_metadata
    await supabase.auth.admin.updateUserById(studentId, {
      user_metadata: {
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
