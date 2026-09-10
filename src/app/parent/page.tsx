import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Leaderboard from "@/components/Leaderboard"
import { getTodayDateStr, getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect("/login")
  }
  const { data: parentProfile } = await supabase.from("profiles").select("*").eq("id", session!.user.id).single()
  const studentId = parentProfile?.student_id
  const today = getTodayDateStr()
  const weekInfo = getWeekAndMonthInfo(today)
  const month = weekInfo.month
  const year = weekInfo.year
  const weekStartStr = formatDateStr(weekInfo.weekStart)
  const [studentRes, assignmentsRes, weeklyRes, monthlyRes, lbWeekly, lbMonthly] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", studentId).single(),
    supabase.from("daily_assignments").select("*, tasks(*)").eq("student_id", studentId).eq("assigned_date", today),
    supabase.from("weekly_summaries").select("total_points, tasks_completed").eq("student_id", studentId).eq("week_start", weekStartStr).single(),
    supabase.from("monthly_summaries").select("total_points, tasks_completed").eq("student_id", studentId).eq("month", month).eq("year", year).single(),
    supabase.from("weekly_summaries").select("*, profiles(full_name)").eq("week_start", weekStartStr).order("total_points", { ascending: false }),
    supabase.from("monthly_summaries").select("*, profiles(full_name)").eq("month", month).eq("year", year).order("total_points", { ascending: false }),
  ])
  const assignments = assignmentsRes.data ?? []
  const completed = assignments.filter((a: { completed: boolean }) => a.completed)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "white", margin: 0 }}>متابعة {studentRes.data?.full_name ?? "ابنك"} 👦</h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {[
          { val: weeklyRes.data?.total_points ?? 0, label: "نقاط الأسبوع ⭐" },
          { val: monthlyRes.data?.total_points ?? 0, label: "نقاط الشهر 📆" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#7c3aed" }}>{s.val}</div>
            <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
        <h2 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>📋 مهام اليوم ({completed.length}/{assignments.length})</h2>
        {!assignments.length ? <p style={{ color: "#9ca3af", textAlign: "center" }}>لا مهام اليوم</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {assignments.map((a: { id: string; completed: boolean; tasks: { emoji: string; name: string; points: number } | null }) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: a.completed ? "#f0fdf4" : "#f9fafb", borderRadius: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{a.completed ? "✅" : "⏳"}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{a.tasks?.name}</span>
                <span style={{ color: "#d97706", fontWeight: 700, fontSize: "0.9rem" }}>+{a.tasks?.points}⭐</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 style={{ color: "white", fontWeight: 900, fontSize: "1.5rem", marginBottom: "1rem" }}>🏆 الليدربورد</h2>
        <Leaderboard weekly={lbWeekly.data ?? []} monthly={lbMonthly.data ?? []} />
      </div>
    </div>
  )
}
