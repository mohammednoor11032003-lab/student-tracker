import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getDailyPointsBreakdown, reconcileSingleStudentPoints } from "@/lib/points-breakdown"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const breakdown = await getDailyPointsBreakdown(supabase, studentId, startDate, endDate)

    return NextResponse.json({ success: true, breakdown })
  } catch (err: any) {
    console.error("GET /api/teacher/points-breakdown error:", err)
    return NextResponse.json({ error: err.message || "فشل جلب تفصيل النقاط" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, studentId, targetDateStr } = body

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const supabase = getAdminClient()

    if (action === "reconcile_single") {
      const result = await reconcileSingleStudentPoints(supabase, studentId, targetDateStr)
      // Fetch fresh breakdown after reconciliation
      const breakdown = await getDailyPointsBreakdown(supabase, studentId)
      return NextResponse.json({
        success: true,
        message: "تم تصحيح وتوحيد النقاط لهذا الطالب بنجاح",
        result,
        breakdown,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("POST /api/teacher/points-breakdown error:", err)
    return NextResponse.json({ error: err.message || "فشل تنفيذ العملية" }, { status: 500 })
  }
}
