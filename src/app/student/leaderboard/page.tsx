import { createClient } from "@/lib/supabase/server"
import Leaderboard from "@/components/Leaderboard"
export default async function StudentLeaderboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const month = now.getMonth() + 1; const year = now.getFullYear()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const weekStartStr = weekStart.toISOString().split("T")[0]
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
