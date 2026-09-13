import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureDailyAssignmentsForAllStudents } from "@/lib/task-generator-server"
import { getTodayDateStr } from "@/lib/date-utils"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  return handleAutoGenerate(req)
}

export async function GET(req: NextRequest) {
  return handleAutoGenerate(req)
}

async function handleAutoGenerate(req: NextRequest) {
  try {
    const supabase = await createClient()
    const userRes = await supabase.auth.getUser()
    const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user

    if (!user) {
      return NextResponse.json(
        { error: "غير مصرح، يرجى تسجيل الدخول أولاً" },
        { status: 401 }
      )
    }

    const todayStr = getTodayDateStr()
    let targetDate = todayStr

    if (req.method === "POST") {
      try {
        const body = await req.json().catch(() => ({}))
        if (body && body.date) {
          targetDate = body.date
        }
      } catch {}
    } else {
      const { searchParams } = new URL(req.url)
      const qDate = searchParams.get("date")
      if (qDate) {
        targetDate = qDate
      }
    }

    // Ensure tasks exist for this authenticated student using admin client (bypasses RLS safely on server)
    const result = await ensureDailyAssignmentsForAllStudents(targetDate, [user.id])

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (err: any) {
    console.error("Error in student auto-generate API:", err)
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ غير متوقع أثناء توليد المهام" },
      { status: 500 }
    )
  }
}
