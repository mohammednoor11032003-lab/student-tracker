import { NextRequest, NextResponse } from "next/server"
import {
  getActiveManualConsolidation,
  getStudentManualConsolidations,
  getStudentActiveAndUpcomingConsolidations,
  saveManualConsolidation,
  cancelManualConsolidation,
  deleteManualConsolidation,
} from "@/lib/manual-consolidation"
import { getTodayDateStr } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const dateStr = searchParams.get("date")
    const all = searchParams.get("all") === "true"

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    if (all) {
      const consolidations = await getStudentManualConsolidations(studentId)
      return NextResponse.json({ success: true, consolidations })
    }

    const currentDate = dateStr || getTodayDateStr()
    const consolidations = await getStudentActiveAndUpcomingConsolidations(studentId, currentDate)
    const active = consolidations.find(
      c => c.is_active && currentDate >= c.start_date && currentDate <= c.end_date
    ) || null

    return NextResponse.json({ success: true, consolidations, active })
  } catch (err: any) {
    console.error("GET /api/manual-consolidation error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      action,
      studentId,
      id,
      start_page,
      end_page,
      daily_pages_count,
      start_date,
      end_date,
      include_fridays,
      has_harvest_day,
      harvest_days_count,
      resume_page_pointer,
      pages_description,
      repetitions_count,
    } = body

    if (action === "cancel") {
      if (!id) {
        return NextResponse.json({ error: "id is required for cancellation" }, { status: 400 })
      }
      await cancelManualConsolidation(id)
      return NextResponse.json({ success: true, message: "تم إلغاء نظام التثبيت اليدوي بنجاح" })
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "id is required for deletion" }, { status: 400 })
      }
      await deleteManualConsolidation(id)
      return NextResponse.json({ success: true, message: "تم حذف نظام التثبيت اليدوي بنجاح" })
    }

    // Validation for save/update
    if (!studentId || !start_date || !end_date) {
      return NextResponse.json(
        { error: "معرف الطالب وتاريخ البدء وتاريخ الانتهاء مطلوبة" },
        { status: 400 }
      )
    }

    const sPage = Number(start_page) || 1
    const ePage = Number(end_page) || 20
    const dailyCount = Number(daily_pages_count) || 4
    const isHarvest = Boolean(has_harvest_day)
    const harvestDays = Math.min(3, Math.max(1, Number(harvest_days_count) || 1))
    const includeFridays = Boolean(include_fridays)

    if (sPage < 1 || ePage < sPage) {
      return NextResponse.json(
        { error: "نطاق الصفحات غير صحيح (يجب أن تكون صفحة النهاية أكبر من أو تساوي البداية)" },
        { status: 400 }
      )
    }

    if (dailyCount < 1) {
      return NextResponse.json(
        { error: "المقدار اليومي يجب أن يكون صفحة واحدة على الأقل" },
        { status: 400 }
      )
    }

    // Strict Validation: check if available working days >= required days (Fridays handling)
    const { countWorkingDays } = await import("@/lib/manual-consolidation")
    const totalPages = ePage - sPage + 1
    const reviewDays = Math.ceil(totalPages / dailyCount)
    const totalRequiredDays = reviewDays + (isHarvest ? harvestDays : 0)
    const availableWorkingDays = countWorkingDays(start_date, end_date, includeFridays)

    if (availableWorkingDays < totalRequiredDays) {
      return NextResponse.json(
        {
          error: `المدة الزمنية المحددة لا تكفي لإنجاز هذه الصفحات بهذا المقدار اليومي! (المطلوب: ${totalRequiredDays} أيام عمل فعلية، المتاح: ${availableWorkingDays} أيام عمل${!includeFridays ? " مع استثناء أيام الجمعة كإجازة" : ""})`,
          requiredDays: totalRequiredDays,
          availableDays: availableWorkingDays,
        },
        { status: 400 }
      )
    }

    const saved = await saveManualConsolidation({
      id,
      student_id: studentId,
      start_page: sPage,
      end_page: ePage,
      daily_pages_count: dailyCount,
      start_date,
      end_date,
      include_fridays: includeFridays,
      has_harvest_day: isHarvest,
      harvest_days_count: harvestDays,
      resume_page_pointer: resume_page_pointer?.trim() || "ص 1 النصف العلوي",
      pages_description: pages_description?.trim() || `من ص ${sPage} إلى ص ${ePage}`,
      repetitions_count: Number(repetitions_count) || 5,
      is_active: true,
    })

    // Sync resume pointer to student plan so the plan continues from it after consolidation
    if (resume_page_pointer?.trim()) {
      try {
        const { parseResumePointer } = await import("@/lib/manual-consolidation")
        const { updateStudentPlan } = await import("@/lib/student-plan")
        const { page, part } = parseResumePointer(resume_page_pointer)
        await updateStudentPlan(studentId, {
          current_page: page,
          page_part: part,
        })
      } catch (planErr) {
        console.warn("Failed to sync resume pointer to student plan:", planErr)
      }
    }

    return NextResponse.json({ success: true, consolidation: saved })
  } catch (err: any) {
    console.error("POST /api/manual-consolidation error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
