import { createClient } from "@/lib/supabase/server"
import Leaderboard from "@/components/Leaderboard"
import { getTodayDateStr, getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"

export default async function TeacherLeaderboardPage() {
  const supabase = await createClient()
  const today = getTodayDateStr()
  const weekInfo = getWeekAndMonthInfo(today)
  const month = weekInfo.month
  const year = weekInfo.year
  const weekStartStr = formatDateStr(weekInfo.weekStart)
  const [weekly, monthly] = await Promise.all([
    supabase.from("weekly_summaries").select("*, profiles(full_name)").eq("week_start", weekStartStr).order("total_points", { ascending: false }),
    supabase.from("monthly_summaries").select("*, profiles(full_name)").eq("month", month).eq("year", year).order("total_points", { ascending: false }),
  ])
  return (
    <div>
      <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, marginBottom: "1.5rem" }}>🏆 الليدربورد</h1>
      <Leaderboard weekly={weekly.data ?? []} monthly={monthly.data ?? []} />
    </div>
  )
}
