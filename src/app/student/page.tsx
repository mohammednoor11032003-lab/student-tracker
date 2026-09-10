import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentPortal from "@/components/student/StudentPortal"
import { getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"
import { getStudentPlan } from "@/lib/student-plan"
import { getStudentStarBadges } from "@/lib/badge-utils"

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function StudentDashboard({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect("/login")
  }

  const { tab } = await searchParams
  const initialTab = tab === "tasks" || tab === "leaderboard" ? tab : "plan"

  const today = new Date().toISOString().split("T")[0]
  const weekInfo = getWeekAndMonthInfo(today)
  const weekStartStr = formatDateStr(weekInfo.weekStart)
  const weekEndStr = formatDateStr(weekInfo.weekEnd)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // 1. Fetch current assignments for today
  let { data: assignments } = await supabase
    .from("daily_assignments")
    .select("*, tasks(*)")
    .eq("student_id", session.user.id)
    .eq("assigned_date", today)
    .order("completed", { ascending: true })

  // 2. If no assignments exist for today, automatically create them for the student!
  if (!assignments || assignments.length === 0) {
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("id, name")
      .neq("name", "المهمة البديلة")
      .neq("name", "المهمة الأسبوعية المفاجئة")
    if (allTasks && allTasks.length > 0) {
      const toInsert = allTasks.map(t => ({
        student_id: session.user.id,
        task_id: t.id,
        assigned_date: today,
        completed: false,
      }))
      await supabase.from("daily_assignments").upsert(toInsert, { onConflict: "student_id,task_id,assigned_date", ignoreDuplicates: true })
      
      const { data: freshAssignments } = await supabase
        .from("daily_assignments")
        .select("*, tasks(*)")
        .eq("student_id", session.user.id)
        .eq("assigned_date", today)
        .order("completed", { ascending: true })
      
      assignments = freshAssignments
    }
  }

  const [profileRes, weeklyRes, weekAssignmentsRes, studentPlan, leaderboardWeeklyRes, leaderboardMonthlyRes, starBadges] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", session.user.id).single(),
    supabase.from("weekly_summaries").select("total_points").eq("student_id", session.user.id).eq("week_start", weekStartStr).single(),
    supabase.from("daily_assignments").select("completed, tasks(points)").eq("student_id", session.user.id).gte("assigned_date", weekStartStr).lte("assigned_date", weekEndStr).eq("completed", true),
    getStudentPlan(session.user.id),
    supabase.from("weekly_summaries").select("*, profiles(full_name)").eq("week_start", weekStartStr).order("total_points", { ascending: false }),
    supabase.from("monthly_summaries").select("*, profiles(full_name)").eq("month", month).eq("year", year).order("total_points", { ascending: false }),
    getStudentStarBadges(supabase, session.user.id),
  ])

  // Compute live weekly points from actual completed tasks of this week as primary truth
  const liveWeeklyPoints = weekAssignmentsRes.data && weekAssignmentsRes.data.length > 0
    ? weekAssignmentsRes.data.reduce((sum, a) => sum + ((a.tasks as unknown as { points?: number })?.points ?? 0), 0)
    : (weeklyRes.data?.total_points ?? 0)

  return (
    <StudentPortal
      studentId={session.user.id}
      studentName={profileRes.data?.full_name ?? ""}
      todayStr={today}
      initialPlan={studentPlan}
      assignments={assignments ?? []}
      weeklyPoints={liveWeeklyPoints}
      leaderboardWeekly={leaderboardWeeklyRes.data ?? []}
      leaderboardMonthly={leaderboardMonthlyRes.data ?? []}
      initialTab={initialTab}
      isStarOfWeek={starBadges.isStarOfWeek}
      isStarOfMonth={starBadges.isStarOfMonth}
    />
  )
}