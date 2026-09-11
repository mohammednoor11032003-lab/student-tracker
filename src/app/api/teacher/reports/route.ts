import { NextRequest, NextResponse } from "next/server"
import { generateAllStudentsDailyReports } from "@/lib/whatsapp-reports-generator"
import { getTodayDateStr } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")

    // Default to yesterday if not provided
    let targetDate = date
    if (!targetDate) {
      const today = getTodayDateStr()
      const [y, m, d] = today.split("-").map(Number)
      const dt = new Date(y, m - 1, d)
      dt.setDate(dt.getDate() - 1)
      const yyyy = dt.getFullYear()
      const mm = String(dt.getMonth() + 1).padStart(2, "0")
      const dd = String(dt.getDate()).padStart(2, "0")
      targetDate = `${yyyy}-${mm}-${dd}`
    }

    const reports = await generateAllStudentsDailyReports(targetDate)

    return NextResponse.json({
      success: true,
      date: targetDate,
      reports,
    })
  } catch (err: any) {
    console.error("GET /api/teacher/reports error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
