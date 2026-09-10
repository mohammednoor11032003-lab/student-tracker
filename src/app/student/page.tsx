import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentPortal from "@/components/student/StudentPortal"
import { getWeekAndMonthInfo, formatDateStr, getTodayDateStr } from "@/lib/date-utils"
import { getStudentPlan } from "@/lib/student-plan"
import { getStudentStarBadges } from "@/lib/badge-utils"
import { isBountyTask, parseBountyTask } from "@/lib/bounty-utils"
import { getStudentHeroState } from "@/lib/hero-utils"
import { getActiveManualConsolidation } from "@/lib/manual-consolidation"

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function StudentDashboard({ searchParams }: PageProps) {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user
  if (!user) {
    redirect("/login")
  }

  const { tab } = await searchParams
  const initialTab = tab === "tasks" || tab === "leaderboard" || tab === "hero" || tab === "arena" ? tab : "plan"

  const today = getTodayDateStr()
  const weekInfo = getWeekAndMonthInfo(today)
  const weekStartStr = formatDateStr(weekInfo.weekStart)
  const weekEndStr = formatDateStr(weekInfo.weekEnd)

  const month = weekInfo.month
  const year = weekInfo.year

  // Check active manual consolidation for today
  const activeManualConsolidation = await getActiveManualConsolidation(user.id, today)

  // 1. Fetch current assignments for today
  let { data: assignments } = await supabase
    .from("daily_assignments")
    .select("*, tasks(*)")
    .eq("student_id", user.id)
    .eq("assigned_date", today)
    .order("completed", { ascending: true })

  // 2. If no assignments exist for today, automatically create them for the student (only if not under manual consolidation)
  if ((!assignments || assignments.length === 0) && !activeManualConsolidation) {
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("id, name, description")
      .neq("name", "المهمة البديلة")
      .neq("name", "المهمة الأسبوعية المفاجئة")
    const routineTasks = (allTasks || []).filter(t => !isBountyTask(t))
    if (routineTasks.length > 0) {
      const toInsert = routineTasks.map(t => ({
        student_id: user.id,
        task_id: t.id,
        assigned_date: today,
        completed: false,
      }))
      await supabase.from("daily_assignments").upsert(toInsert, { onConflict: "student_id,task_id,assigned_date", ignoreDuplicates: true })
      
      const { data: freshAssignments } = await supabase
        .from("daily_assignments")
        .select("*, tasks(*)")
        .eq("student_id", user.id)
        .eq("assigned_date", today)
        .order("completed", { ascending: true })
      
      assignments = freshAssignments
    }
  }

  const [profileRes, weeklyRes, weekAssignmentsRes, studentPlan, leaderboardWeeklyRes, leaderboardMonthlyRes, starBadges, allTasksRes, heroState] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("weekly_summaries").select("total_points").eq("student_id", user.id).eq("week_start", weekStartStr).single(),
    supabase.from("daily_assignments").select("completed, tasks(points)").eq("student_id", user.id).gte("assigned_date", weekStartStr).lte("assigned_date", weekEndStr).eq("completed", true),
    getStudentPlan(user.id),
    supabase.from("weekly_summaries").select("*, profiles(full_name)").eq("week_start", weekStartStr).order("total_points", { ascending: false }),
    supabase.from("monthly_summaries").select("*, profiles(full_name)").eq("month", month).eq("year", year).order("total_points", { ascending: false }),
    getStudentStarBadges(supabase, user.id),
    supabase.from("tasks").select("*"),
    getStudentHeroState(user.id),
  ])

  // Extract optional bounty challenges
  const bounties = (allTasksRes.data || []).filter(isBountyTask).map(parseBountyTask)

  // Fetch completed bounties for this student in current week
  const { data: completedBounties } = await supabase
    .from("daily_assignments")
    .select("task_id")
    .eq("student_id", user.id)
    .gte("assigned_date", weekStartStr)
    .lte("assigned_date", weekEndStr)
    .eq("completed", true)
  const completedBountyTaskIds = (completedBounties || []).map(b => b.task_id)

  // Compute live weekly points from actual completed tasks of this week as primary truth
  const liveWeeklyPoints = weekAssignmentsRes.data && weekAssignmentsRes.data.length > 0
    ? weekAssignmentsRes.data.reduce((sum, a) => sum + ((a.tasks as unknown as { points?: number })?.points ?? 0), 0)
    : (weeklyRes.data?.total_points ?? 0)

  return (
    <StudentPortal
      studentId={user.id}
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
      bounties={bounties}
      completedBountyTaskIds={completedBountyTaskIds}
      initialGems={heroState.gems_balance}
      initialInventory={heroState.inventory}
      initialManualConsolidation={activeManualConsolidation}
    />
  )
}