import { NextRequest, NextResponse } from "next/server"
import { getStudentPlan, updateStudentPlan } from "@/lib/student-plan"
import { getDailyPlanDetails } from "@/lib/plan-utils"
import { getTodayDateStr } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const dateStr = searchParams.get("date") || getTodayDateStr()

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const plan = await getStudentPlan(studentId)
    const details = getDailyPlanDetails(plan, dateStr)

    return NextResponse.json({ plan, details })
  } catch (err) {
    console.error("GET /api/student-plan error:", err)
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, updates, dateStr } = body

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const updatedPlan = await updateStudentPlan(studentId, updates || {})
    const effectiveDate = dateStr || getTodayDateStr()
    const details = getDailyPlanDetails(updatedPlan, effectiveDate)

    return NextResponse.json({ plan: updatedPlan, details })
  } catch (err) {
    console.error("POST /api/student-plan error:", err)
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
  }
}
