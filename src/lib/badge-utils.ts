import { SupabaseClient } from "@supabase/supabase-js"
import { getWeekAndMonthInfo, formatDateStr, getTodayDateStr } from "@/lib/date-utils"

export interface StudentStarBadges {
  isStarOfWeek: boolean
  isStarOfMonth: boolean
}

/**
 * Checks if a student is within the Top 3 (rank 1, 2, or 3, including ties) with total_points > 0.
 */
function isStudentInTop3(
  entries: { student_id: string; total_points: number | null }[] | null,
  studentId: string
): boolean {
  if (!entries || entries.length === 0) return false
  const positive = entries.filter(e => (e.total_points ?? 0) > 0)
  if (positive.length === 0) return false

  const studentEntry = positive.find(e => e.student_id === studentId)
  if (!studentEntry || (studentEntry.total_points ?? 0) <= 0) return false

  // Threshold is the points of the 3rd entry (or last available entry if fewer than 3)
  const thresholdIndex = Math.min(2, positive.length - 1)
  const thresholdPoints = positive[thresholdIndex].total_points ?? 0

  return (studentEntry.total_points ?? 0) >= thresholdPoints
}

/**
 * Fetches star badges for a student:
 * - Star of the Week: Top 3 in the previous calendar week's weekly_summaries.
 * - Star of the Month: Top 3 in the previous calendar month's monthly_summaries.
 */
export async function getStudentStarBadges(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentStarBadges> {
  try {
    const today = getTodayDateStr()
    const weekInfo = getWeekAndMonthInfo(today)
    const weekStartStr = formatDateStr(weekInfo.weekStart)

    // Calculate previous week start (7 days before current week's start)
    const prevWeekDate = new Date(weekInfo.weekStart)
    prevWeekDate.setDate(prevWeekDate.getDate() - 7)
    const prevWeekStartStr = formatDateStr(prevWeekDate)

    // Calculate previous month and year based on current weekInfo
    const currentMonth = weekInfo.month
    const currentYear = weekInfo.year
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

    // 1. Fetch previous week summaries
    let { data: prevWeekData } = await supabase
      .from("weekly_summaries")
      .select("student_id, total_points, week_start")
      .eq("week_start", prevWeekStartStr)
      .gt("total_points", 0)
      .order("total_points", { ascending: false })

    // Fallback if no records found for exact prevWeekStartStr: pick the latest completed week before this week
    if (!prevWeekData || prevWeekData.length === 0) {
      const { data: latestPriorWeek } = await supabase
        .from("weekly_summaries")
        .select("week_start")
        .lt("week_start", weekStartStr)
        .gt("total_points", 0)
        .order("week_start", { ascending: false })
        .limit(1)

      if (latestPriorWeek && latestPriorWeek.length > 0) {
        const fallbackWeek = latestPriorWeek[0].week_start
        const { data: fallbackData } = await supabase
          .from("weekly_summaries")
          .select("student_id, total_points, week_start")
          .eq("week_start", fallbackWeek)
          .gt("total_points", 0)
          .order("total_points", { ascending: false })
        prevWeekData = fallbackData
      }
    }

    // 2. Fetch previous month summaries
    let { data: prevMonthData } = await supabase
      .from("monthly_summaries")
      .select("student_id, total_points, month, year")
      .eq("month", prevMonth)
      .eq("year", prevMonthYear)
      .gt("total_points", 0)
      .order("total_points", { ascending: false })

    // Fallback if no records found for exact prevMonth: pick the latest completed month before current
    if (!prevMonthData || prevMonthData.length === 0) {
      const { data: latestPriorMonth } = await supabase
        .from("monthly_summaries")
        .select("month, year")
        .or(`year.lt.${currentYear},and(year.eq.${currentYear},month.lt.${currentMonth})`)
        .gt("total_points", 0)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(1)

      if (latestPriorMonth && latestPriorMonth.length > 0) {
        const { data: fallbackMonthData } = await supabase
          .from("monthly_summaries")
          .select("student_id, total_points, month, year")
          .eq("month", latestPriorMonth[0].month)
          .eq("year", latestPriorMonth[0].year)
          .gt("total_points", 0)
          .order("total_points", { ascending: false })
        prevMonthData = fallbackMonthData
      }
    }

    const isStarOfWeek = isStudentInTop3(prevWeekData, studentId)
    const isStarOfMonth = isStudentInTop3(prevMonthData, studentId)

    return { isStarOfWeek, isStarOfMonth }
  } catch (err) {
    console.error("Error computing student star badges:", err)
    return { isStarOfWeek: false, isStarOfMonth: false }
  }
}
