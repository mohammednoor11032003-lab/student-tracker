import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TeacherChallenges from "@/components/teacher/TeacherChallenges"
import { isBountyTask, parseBountyTask, getWeeklyBounties } from "@/lib/bounty-utils"
import { getTodayDateStr, getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"

export default async function TeacherChallengesPage() {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user
  if (!user) {
    redirect("/login")
  }

  // Fetch all tasks from database
  const { data: allTasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })

  const bountyTasks = (allTasks || []).filter(isBountyTask).map(parseBountyTask)

  // Determine current active week start
  const todayStr = getTodayDateStr()
  const weekInfo = getWeekAndMonthInfo(todayStr)
  const currentWeekStartStr = formatDateStr(weekInfo.weekStart)

  // Compute the 3 active bounties for this week
  const activeWeeklyBounties = getWeeklyBounties(currentWeekStartStr, bountyTasks)
  const activeWeeklyBountyIds = activeWeeklyBounties.map(b => b.id)

  return (
    <TeacherChallenges
      teacherId={user.id}
      initialChallenges={bountyTasks}
      activeWeeklyBountyIds={activeWeeklyBountyIds}
    />
  )
}
