import { NextRequest, NextResponse } from "next/server"
import {
  getAllStudentParentPhones,
  updateStudentParentPhone,
  updateBulkStudentParentPhones,
  validateParentPhone,
} from "@/lib/student-phone-server"

// 1. GET: Fetch all student parent phones
export async function GET() {
  try {
    const phones = await getAllStudentParentPhones()
    return NextResponse.json({ success: true, phones })
  } catch (err: any) {
    console.error("GET /api/teacher/students/phones error:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch student phones" }, { status: 500 })
  }
}

// 2. POST: Update single student phone OR bulk update all phones
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Case A: Bulk update { phones: { [studentId]: phone } }
    if (body.phones && typeof body.phones === "object") {
      const result = await updateBulkStudentParentPhones(body.phones)
      const allPhones = await getAllStudentParentPhones()
      return NextResponse.json({
        success: result.success,
        updatedCount: result.updatedCount,
        errors: result.errors,
        phones: allPhones,
      })
    }

    // Case B: Single update { studentId, phone }
    const { studentId, phone } = body
    if (!studentId) {
      return NextResponse.json({ error: "معرّف الطالب مطلوب" }, { status: 400 })
    }

    const result = await updateStudentParentPhone(studentId, phone || "")
    if (!result.success) {
      return NextResponse.json({ error: result.error || "صيغة رقم الهاتف غير صالحة" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      studentId,
      phone: result.phone,
    })
  } catch (err: any) {
    console.error("POST /api/teacher/students/phones error:", err)
    return NextResponse.json({ error: err.message || "Failed to update student phone" }, { status: 500 })
  }
}
