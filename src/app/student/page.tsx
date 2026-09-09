import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentTasks from "@/components/student/StudentTasks"
import { getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"
import { getStudentPlan } from "@/lib/student-plan"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect("/login")
  }
  const today = new Date().toISOString().split("T")[0]
  const weekInfo = getWeekAndMonthInfo(today)
  const weekStartStr = formatDateStr(weekInfo.weekStart)
  const weekEndStr = formatDateStr(weekInfo.weekEnd)

  // 1. Fetch current assignments for today
  let { data: assignments } = await supabase
    .from("daily_assignments")
    .select("*, tasks(*)")
    .eq("student_id", session!.user.id)
    .eq("assigned_date", today)
    .order("completed", { ascending: true })

  // 2. If no assignments exist for today, automatically create them for the student!
  if (!assignments || assignments.length === 0) {
    const { data: allTasks } = await supabase.from("tasks").select("id, name").neq("name", "المهمة البديلة")
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

  const [profileRes, weeklyRes, weekAssignmentsRes, studentPlan] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", session!.user.id).single(),
    supabase.from("weekly_summaries").select("total_points").eq("student_id", session!.user.id).eq("week_start", weekStartStr).single(),
    supabase.from("daily_assignments").select("completed, tasks(points)").eq("student_id", session!.user.id).gte("assigned_date", weekStartStr).lte("assigned_date", weekEndStr).eq("completed", true),
    getStudentPlan(session!.user.id),
  ])

  // Compute live weekly points from actual completed tasks of this week as primary truth
  const liveWeeklyPoints = weekAssignmentsRes.data && weekAssignmentsRes.data.length > 0
    ? weekAssignmentsRes.data.reduce((sum, a) => sum + ((a.tasks as unknown as { points?: number })?.points ?? 0), 0)
    : (weeklyRes.data?.total_points ?? 0)

  return (
    <StudentTasks
      assignments={assignments ?? []}
      studentId={session!.user.id}
      studentName={profileRes.data?.full_name ?? ""}
      weeklyPoints={liveWeeklyPoints}
      initialPlan={studentPlan}
    />
  )
}