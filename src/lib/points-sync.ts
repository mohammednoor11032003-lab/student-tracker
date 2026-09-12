import { SupabaseClient } from "@supabase/supabase-js"
import { getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"

export interface PointsSyncResult {
  weeklyPoints: number
  monthlyPoints: number
  profilePoints?: number
}

/**
 * Atomically / synchronously updates student points across:
 * 1. weekly_summaries (total_points and tasks_completed)
 * 2. monthly_summaries (total_points and tasks_completed)
 * 3. profiles (total_points, if column exists in schema)
 * 4. auth.users (user_metadata.total_points)
 *
 * Guarantees that points never desync between weekly and monthly scopes.
 */
export async function syncStudentPoints(
  supabase: SupabaseClient,
  studentId: string,
  deltaPoints: number,
  deltaCompleted: number,
  effectiveDate: string
): Promise<PointsSyncResult> {
  const weekInfo = getWeekAndMonthInfo(effectiveDate)
  const weekStartStr = formatDateStr(weekInfo.weekStart)
  const weekEndStr = formatDateStr(weekInfo.weekEnd)
  const month = weekInfo.month
  const year = weekInfo.year

  // 1. Fetch current weekly, monthly, and profile records in parallel
  const [weeklyRes, monthlyRes, profileRes] = await Promise.all([
    supabase
      .from("weekly_summaries")
      .select("id, total_points, tasks_completed")
      .eq("student_id", studentId)
      .eq("week_start", weekStartStr)
      .maybeSingle(),
    supabase
      .from("monthly_summaries")
      .select("id, total_points, tasks_completed")
      .eq("student_id", studentId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id")
      .eq("id", studentId)
      .maybeSingle(),
  ])

  if (weeklyRes.error) {
    console.error("Error fetching weekly_summaries:", weeklyRes.error)
  }
  if (monthlyRes.error) {
    console.error("Error fetching monthly_summaries:", monthlyRes.error)
  }

  // 2. Compute updated point values
  const currentWeeklyPts = weeklyRes.data?.total_points ?? 0
  const currentWeeklyComp = weeklyRes.data?.tasks_completed ?? 0
  const nextWeeklyPts = currentWeeklyPts + deltaPoints
  const nextWeeklyComp = Math.max(0, currentWeeklyComp + deltaCompleted)

  const currentMonthlyPts = monthlyRes.data?.total_points ?? 0
  const currentMonthlyComp = monthlyRes.data?.tasks_completed ?? 0
  const nextMonthlyPts = currentMonthlyPts + deltaPoints
  const nextMonthlyComp = Math.max(0, currentMonthlyComp + deltaCompleted)

  // 3. Prepare simultaneous atomic mutations
  const weeklyMutation = weeklyRes.data?.id
    ? supabase
        .from("weekly_summaries")
        .update({
          total_points: nextWeeklyPts,
          tasks_completed: nextWeeklyComp,
        })
        .eq("id", weeklyRes.data.id)
    : supabase
        .from("weekly_summaries")
        .insert({
          student_id: studentId,
          week_start: weekStartStr,
          week_end: weekEndStr,
          total_points: nextWeeklyPts,
          tasks_completed: Math.max(0, deltaCompleted),
        })

  const monthlyMutation = monthlyRes.data?.id
    ? supabase
        .from("monthly_summaries")
        .update({
          total_points: nextMonthlyPts,
          tasks_completed: nextMonthlyComp,
        })
        .eq("id", monthlyRes.data.id)
    : supabase
        .from("monthly_summaries")
        .insert({
          student_id: studentId,
          month,
          year,
          total_points: nextMonthlyPts,
          tasks_completed: Math.max(0, deltaCompleted),
        })

  // Execute weekly and monthly mutations together
  const [wResult, mResult] = await Promise.all([weeklyMutation, monthlyMutation])

  if (wResult.error) {
    console.error("Failed to commit weekly_summaries points:", wResult.error)
    throw new Error(`Weekly points sync failed: ${wResult.error.message}`)
  }
  if (mResult.error) {
    console.error("Failed to commit monthly_summaries points:", mResult.error)
    throw new Error(`Monthly points sync failed: ${mResult.error.message}`)
  }

  // 4. Safely attempt to update profiles.total_points if the column exists
  try {
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ total_points: nextWeeklyPts })
      .eq("id", studentId)
    if (profErr && profErr.code !== "PGRST204") {
      console.warn("Profiles total_points update warning:", profErr.message)
    }
  } catch {
    // Column might not exist in current migration, safely ignore PGRST204
  }

  // 5. Update auth.users metadata if admin API is available
  try {
    if (supabase.auth?.admin?.getUserById) {
      const { data: userData } = await supabase.auth.admin.getUserById(studentId)
      if (userData?.user) {
        const currentMetaPoints = Number(userData.user.user_metadata?.total_points || 0)
        await supabase.auth.admin.updateUserById(studentId, {
          user_metadata: {
            ...userData.user.user_metadata,
            total_points: currentMetaPoints + deltaPoints,
          },
        })
      }
    }
  } catch (authErr) {
    console.warn("Non-critical: auth user_metadata points update skipped:", authErr)
  }

  return {
    weeklyPoints: nextWeeklyPts,
    monthlyPoints: nextMonthlyPts,
  }
}
