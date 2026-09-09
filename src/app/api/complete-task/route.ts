import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { assignmentId, studentId, taskId, points } = await req.json()

    // 1. Strict midnight deadline check:
    const todayStr = new Date().toISOString().split("T")[0]
    const { data: assignment } = await supabase
      .from("daily_assignments")
      .select("assigned_date, completed")
      .eq("id", assignmentId)
      .single()

    if (assignment && assignment.assigned_date !== todayStr) {
      return NextResponse.json(
        { error: "انتهت مهلة هذا اليوم عند الساعة 12:00 منتصف الليل ولا يمكن تعديله" },
        { status: 403 }
      )
    }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split("T")[0]
    const weekEndStr = weekEnd.toISOString().split("T")[0]
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Weekly summary upsert
    const { data: existingWeekly } = await supabase
      .from("weekly_summaries")
      .select("id, total_points, tasks_completed")
      .eq("student_id", studentId)
      .eq("week_start", weekStartStr)
      .single()

    if (existingWeekly) {
      await supabase.from("weekly_summaries").update({
        total_points: existingWeekly.total_points + points,
        tasks_completed: existingWeekly.tasks_completed + 1,
      }).eq("id", existingWeekly.id)
    } else {
      await supabase.from("weekly_summaries").insert({
        student_id: studentId,
        week_start: weekStartStr,
        week_end: weekEndStr,
        total_points: points,
        tasks_completed: 1,
      })
    }

    // Monthly summary upsert
    const { data: existingMonthly } = await supabase
      .from("monthly_summaries")
      .select("id, total_points, tasks_completed")
      .eq("student_id", studentId)
      .eq("month", month)
      .eq("year", year)
      .single()

    if (existingMonthly) {
      await supabase.from("monthly_summaries").update({
        total_points: existingMonthly.total_points + points,
        tasks_completed: existingMonthly.tasks_completed + 1,
      }).eq("id", existingMonthly.id)
    } else {
      await supabase.from("monthly_summaries").insert({
        student_id: studentId,
        month,
        year,
        total_points: points,
        tasks_completed: 1,
      })
    }

    // WhatsApp notification via Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const [studentRes, taskRes, parentRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", studentId).single(),
          supabase.from("tasks").select("name, points").eq("id", taskId).single(),
          supabase.from("profiles").select("phone").eq("role", "parent").eq("student_id", studentId).single(),
        ])
        if (parentRes.data?.phone) {
          const { data: updatedWeekly } = await supabase
            .from("weekly_summaries")
            .select("total_points")
            .eq("student_id", studentId)
            .eq("week_start", weekStartStr)
            .single()
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const twilio = require("twilio")
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
          await client.messages.create({
            body: `🎉 ابنك/ابنتك ${studentRes.data?.full_name} أكمل مهمة "${taskRes.data?.name}" وحصل على ${taskRes.data?.points} نقطة!\n⭐ إجمالي نقاطه هذا الأسبوع: ${updatedWeekly?.total_points ?? points} نقطة`,
            from: process.env.TWILIO_WHATSAPP_FROM,
            to: `whatsapp:${parentRes.data.phone}`,
          })
        }
      } catch (err) {
        console.error("Twilio error:", err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}