import { NextRequest, NextResponse } from "next/server"
import { ensureDailyAssignmentsForAllStudents } from "@/lib/task-generator-server"
import { getTodayDateStr } from "@/lib/date-utils"

export async function POST(req: NextRequest) {
  try {
    let dateStr = getTodayDateStr()
    try {
      const body = await req.json()
      if (body && body.date) {
        dateStr = body.date
      }
    } catch {
      // Empty or non-JSON body is valid, defaults to today
    }

    const result = await ensureDailyAssignmentsForAllStudents(dateStr)

    return NextResponse.json({
      success: true,
      message: `تم فحص وتوليد مهام يوم ${result.date} بنجاح لجميع الطلاب (${result.studentsCount} طلاب)!`,
      result,
    })
  } catch (err: any) {
    console.error("Error in teacher task generation API:", err)
    return NextResponse.json(
      {
        success: false,
        error: err.message || "فشل في توليد المهام اليومية",
      },
      { status: 500 }
    )
  }
}
