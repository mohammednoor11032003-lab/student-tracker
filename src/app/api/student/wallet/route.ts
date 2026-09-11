import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getTodayDateStr, getWeekAndMonthInfo, formatDateStr } from "@/lib/date-utils"
import { getStudentHeroState } from "@/lib/hero-utils"
import { getStudentBankSummary } from "@/lib/bank-server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    if (!studentId) {
      return NextResponse.json({ success: false, error: "studentId is required" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const today = getTodayDateStr()
    const weekInfo = getWeekAndMonthInfo(today)
    const weekStartStr = formatDateStr(weekInfo.weekStart)

    const [weeklyRes, heroState, bankSummary] = await Promise.all([
      supabase
        .from("weekly_summaries")
        .select("total_points")
        .eq("student_id", studentId)
        .eq("week_start", weekStartStr)
        .single(),
      getStudentHeroState(studentId),
      getStudentBankSummary(studentId),
    ])

    return NextResponse.json({
      success: true,
      weeklyPoints: weeklyRes.data?.total_points ?? 0,
      gems: heroState.gems_balance ?? 0,
      dinars: bankSummary.current_balance ?? 0,
    })
  } catch (err: any) {
    console.error("Error fetching student wallet resources:", err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
