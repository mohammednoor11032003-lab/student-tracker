import { createClient } from "@/lib/supabase/server"
import StudentTasks from "@/components/student/StudentTasks"
export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const today = new Date().toISOString().split("T")[0]
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const weekStartStr = weekStart.toISOString().split("T")[0]
  const [assignmentsRes, profileRes, weeklyRes] = await Promise.all([
    supabase.from("daily_assignments").select("*, tasks(*)").eq("student_id", session!.user.id).eq("assigned_date", today).order("completed", { ascending: true }),
    supabase.from("profiles").select("full_name").eq("id", session!.user.id).single(),
    supabase.from("weekly_summaries").select("total_points").eq("student_id", session!.user.id).eq("week_start", weekStartStr).single(),
  ])
  return (
    <StudentTasks
      assignments={assignmentsRes.data ?? []}
      studentId={session!.user.id}
      studentName={profileRes.data?.full_name ?? ""}
      weeklyPoints={weeklyRes.data?.total_points ?? 0}
    />
  )
}
