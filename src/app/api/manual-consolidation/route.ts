import { NextRequest, NextResponse } from "next/server"
import {
  getActiveManualConsolidation,
  getStudentManualConsolidations,
  saveManualConsolidation,
  cancelManualConsolidation,
} from "@/lib/manual-consolidation"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const dateStr = searchParams.get("date")

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    if (dateStr) {
      const active = await getActiveManualConsolidation(studentId, dateStr)
      return NextResponse.json({ success: true, active })
    }

    const consolidations = await getStudentManualConsolidations(studentId)
    return NextResponse.json({ success: true, consolidations })
  } catch (err: any) {
    console.error("GET /api/manual-consolidation error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, studentId, id, start_date, end_date, pages_description, repetitions_count } = body

    if (action === "cancel") {
      if (!id) {
        return NextResponse.json({ error: "id is required for cancellation" }, { status: 400 })
      }
      await cancelManualConsolidation(id)
      return NextResponse.json({ success: true, message: "تم إلغاء نظام التثبيت اليدوي بنجاح" })
    }

    // Save or update
    if (!studentId || !start_date || !end_date || !pages_description) {
      return NextResponse.json(
        { error: "جميع الحقول (الطالب، تاريخ البدء، تاريخ الانتهاء، المقدار) مطلوبة" },
        { status: 400 }
      )
    }

    const saved = await saveManualConsolidation({
      id,
      student_id: studentId,
      start_date,
      end_date,
      pages_description,
      repetitions_count: Number(repetitions_count) || 5,
      is_active: true,
    })

    return NextResponse.json({ success: true, consolidation: saved })
  } catch (err: any) {
    console.error("POST /api/manual-consolidation error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
