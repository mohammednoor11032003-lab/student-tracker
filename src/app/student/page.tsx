import { createClient } from "@/lib/supabase/server"
import StudentTasks from "@/components/student/StudentTasks"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const today = new Date().toISOString().split("T")[0]
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const weekStartStr = weekStart.toISOString().split("T")[0]

  // 1. Fetch current assignments for today
  let { data: assignments } = await supabase
    .from("daily_assignments")
    .select("*, tasks(*)")
    .eq("student_id", session!.user.id)
    .eq("assigned_date", today)
    .order("completed", { ascending: true })

  // 2. If no assignments exist for today, automatically create them for the student!
  if (!assignments || assignments.length === 0) {
    const { data: allTasks } = await supabase.from("tasks").select("id")
    if (allTasks && allTasks.length > 0) {
      const toInsert = allTasks.map(t => ({
        student_id: session!.user.id,
        task_id: t.id,
        assigned_date: today,
        completed: false
      }))
      await supabase.from("daily_assignments").upsert(toInsert, { onConflict: "student_id,task_id,assigned_date", ignoreDuplicates: true })
      
      const { data: freshAssignments } = await supabase
        .from("daily_assignments")
        .select("*, tasks(*)")
        .eq("student_id", session!.user.id)
        .eq("assigned_date", today)
        .order("completed", { ascending: true })
      
      assignments = freshAssignments
    }
  }

  const [profileRes, weeklyRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", session!.user.id).single(),
    supabase.from("weekly_summaries").select("total_points").eq("student_id", session!.user.id).eq("week_start", weekStartStr).single(),
  ])

  return (
    <StudentTasks
      assignments={assignments ?? []}
      studentId={session!.user.id}
      studentName={profileRes.data?.full_name ?? ""}
      weeklyPoints={weeklyRes.data?.total_points ?? 0}
    />
  )
}