import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentNav from "@/components/student/StudentNav"
import { getStudentStarBadges } from "@/lib/badge-utils"
import { getTodayDateStr, getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"
import { getStudentHeroState } from "@/lib/hero-utils"
import { getStudentBankSummary } from "@/lib/bank-server"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
  if (!profile || profile.role !== "student") {
    redirect("/")
  }

  const today = getTodayDateStr()
  const weekInfo = getWeekAndMonthInfo(today)
  const weekStartStr = formatDateStr(weekInfo.weekStart)

  const [starBadges, weeklyRes, heroState, bankSummary] = await Promise.all([
    getStudentStarBadges(supabase, user.id),
    supabase
      .from("weekly_summaries")
      .select("total_points")
      .eq("student_id", user.id)
      .eq("week_start", weekStartStr)
      .single(),
    getStudentHeroState(user.id),
    getStudentBankSummary(user.id),
  ])

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      <StudentNav
        studentId={user.id}
        studentName={profile.full_name || "طالب"}
        isStarOfWeek={starBadges.isStarOfWeek}
        isStarOfMonth={starBadges.isStarOfMonth}
        initialWeeklyPoints={weeklyRes.data?.total_points ?? 0}
        initialGems={heroState.gems_balance ?? 0}
        initialDinars={bankSummary.current_balance ?? 0}
      />
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "1.5rem 1rem" }}>{children}</main>
    </div>
  )
}
