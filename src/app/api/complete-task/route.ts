import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getWeekAndMonthInfo, formatDateStr, getTodayDateStr } from "@/lib/date-utils"
import { getStudentPlan, updateStudentPlan } from "@/lib/student-plan"
import { calculateNextPlanState } from "@/lib/plan-utils"

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { assignmentId, studentId, taskId, points, completed = true, assignedDate } = await req.json()

    const todayStr = getTodayDateStr()
    const effectiveDate = assignedDate || todayStr

    // 1. If this is a dynamic task like 'المهمة البديلة' without an assignmentId, upsert it into daily_assignments
    let effectiveAssignmentId = assignmentId
    if (!effectiveAssignmentId && studentId && taskId) {
      const { data: upsertedDA } = await supabase
        .from("daily_assignments")
        .upsert(
          {
            student_id: studentId,
            task_id: taskId,
            assigned_date: effectiveDate,
            completed: completed,
            completed_at: completed ? new Date().toISOString() : null,
          },
          { onConflict: "student_id,task_id,assigned_date" }
        )
        .select("id")
        .single()
      if (upsertedDA) {
        effectiveAssignmentId = upsertedDA.id
      }
    }

    // 2. Strict midnight deadline check:
    if (effectiveAssignmentId) {
      const { data: assignment } = await supabase
        .from("daily_assignments")
        .select("assigned_date, completed")
        .eq("id", effectiveAssignmentId)
        .single()

      // Allow completing alternative task across days
      const isAltTask = taskId === "680903aa-0b9a-42f3-a725-49eaf05a9148"
      if (assignment && assignment.assigned_date !== todayStr && !isAltTask) {
        return NextResponse.json(
          { error: "انتهت مهلة هذا اليوم عند الساعة 12:00 منتصف الليل ولا يمكن تعديله" },
          { status: 403 }
        )
      }
    }

    const deltaPoints = completed ? points : -points
    const deltaCompleted = completed ? 1 : -1

    const weekInfo = getWeekAndMonthInfo(effectiveDate)
    const weekStartStr = formatDateStr(weekInfo.weekStart)
    const weekEndStr = formatDateStr(weekInfo.weekEnd)
    const month = weekInfo.month
    const year = weekInfo.year

    // Weekly summary upsert (allow points to be negative if penalties exceed score, do not clamp total_points to 0!)
    const { data: existingWeekly } = await supabase
      .from("weekly_summaries")
      .select("id, total_points, tasks_completed")
      .eq("student_id", studentId)
      .eq("week_start", weekStartStr)
      .single()

    if (existingWeekly) {
      await supabase.from("weekly_summaries").update({
        total_points: existingWeekly.total_points + deltaPoints,
        tasks_completed: Math.max(0, existingWeekly.tasks_completed + deltaCompleted),
      }).eq("id", existingWeekly.id)
    } else {
      await supabase.from("weekly_summaries").insert({
        student_id: studentId,
        week_start: weekStartStr,
        week_end: weekEndStr,
        total_points: deltaPoints,
        tasks_completed: Math.max(0, deltaCompleted),
      })
    }

    // Monthly summary upsert (do not clamp total_points to 0!)
    const { data: existingMonthly } = await supabase
      .from("monthly_summaries")
      .select("id, total_points, tasks_completed")
      .eq("student_id", studentId)
      .eq("month", month)
      .eq("year", year)
      .single()

    if (existingMonthly) {
      await supabase.from("monthly_summaries").update({
        total_points: existingMonthly.total_points + deltaPoints,
        tasks_completed: Math.max(0, existingMonthly.tasks_completed + deltaCompleted),
      }).eq("id", existingMonthly.id)
    } else {
      await supabase.from("monthly_summaries").insert({
        student_id: studentId,
        month,
        year,
        total_points: deltaPoints,
        tasks_completed: Math.max(0, deltaCompleted),
      })
    }

    // Auto-progression for Daily Memorization Plan (الدرس والمراجعة)
    try {
      if (taskId && studentId) {
        // Check if student is currently under an active Manual Consolidation
        const { getActiveManualConsolidation } = await import("@/lib/manual-consolidation")
        const activeManual = await getActiveManualConsolidation(studentId, effectiveDate)

        if (activeManual) {
          // Freeze Current Page Pointer! Do NOT advance current_page or page_part during manual consolidation
          console.log(`Student ${studentId} is under manual consolidation (${activeManual.pages_description}). Page pointer is frozen.`)
        } else {
          const { data: taskObj } = await supabase.from("tasks").select("name").eq("id", taskId).single()
          const tName = taskObj?.name || ""
          if ((tName.includes("الدرس") && !tName.includes("جنب")) || tName.includes("المراجعة")) {
            const { markStudentLessonCompleted } = await import("@/lib/student-plan")
            await markStudentLessonCompleted(studentId, effectiveDate, completed)
          }
        }
      }
    } catch (planErr) {
      console.error("Auto-progression error:", planErr)
    }

    // WhatsApp notification via Twilio (only when completed)
    if (completed && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
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