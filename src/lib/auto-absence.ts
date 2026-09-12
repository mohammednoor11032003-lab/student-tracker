import { SupabaseClient } from "@supabase/supabase-js"
import { syncStudentPoints } from "./points-sync"
import { getTodayDateStr } from "./date-utils"

export const ABSENCE_TASK_ID = "b319de27-d965-461f-aa70-b75821a58a29" // الغياب (-20 pts)
export const NO_MEMO_TASK_ID = "b8854b90-3cbb-4a04-9d04-41ef3e3d9edb" // الحضور بدون حفظ الدرس (-10 pts)
export const PRESENT_TASK_ID = "c1111111-2222-3333-4444-555555555555" // تسجيل الحضور (حاضر ومستعد) (0 pts)
export const ALT_TASK_ID = "680903aa-0b9a-42f3-a725-49eaf05a9148" // المهمة البديلة (10 pts)

export const TEST_USER_IDS = [
  "862f7c11-d807-48ad-b3ae-c7e1e7afe2d4", // مستخدم1
  "a0643aae-2611-4791-a62b-5d129be57adb", // مستخدم2
]

export interface AutoAbsenceResult {
  success: boolean
  targetDate: string
  isFriday: boolean
  totalProcessed: number
  absentCount: number
  skippedCount: number
  studentsMarkedAbsent: { id: string; name: string }[]
  error?: string
}

/**
 * Returns yesterday's calendar date formatted YYYY-MM-DD in Jordan local time (UTC+3).
 */
export function getYesterdayJordanDateStr(todayStr?: string): string {
  const base = todayStr || getTodayDateStr()
  const d = new Date(base + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() - 1)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Executes the midnight auto-absence sweep.
 * For any student who did not choose their attendance state for targetDate (yesterday):
 * - Marks them as absent (completed = true on task 'الغياب')
 * - Deducts -20 points atomically across weekly_summaries and monthly_summaries via syncStudentPoints
 * - Prepares alternative task entry
 *
 * Idempotent: can be called multiple times without duplicate deductions.
 */
export async function runAutoAbsenceSweep(
  supabase: SupabaseClient,
  overrideTargetDate?: string
): Promise<AutoAbsenceResult> {
  try {
    const targetDate = overrideTargetDate || getYesterdayJordanDateStr()

    // 1. Check day of week
    const targetDayOfWeek = new Date(targetDate + "T12:00:00Z").getUTCDay()
    const isFriday = targetDayOfWeek === 5

    // 2. Fetch all real students
    const { data: students, error: studentsErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "student")

    if (studentsErr || !students) {
      console.error("Auto-absence sweep: failed to load students:", studentsErr)
      throw new Error(`Failed to load students: ${studentsErr?.message}`)
    }

    const realStudents = students.filter(s => !TEST_USER_IDS.includes(s.id))
    const studentsMarkedAbsent: { id: string; name: string }[] = []
    let skippedCount = 0

    for (const student of realStudents) {
      // Check assignments for targetDate
      const { data: assignments, error: asgErr } = await supabase
        .from("daily_assignments")
        .select("id, task_id, completed, tasks(name)")
        .eq("student_id", student.id)
        .eq("assigned_date", targetDate)

      if (asgErr) {
        console.error(`Auto-absence: error reading assignments for student ${student.id}:`, asgErr)
        continue
      }

      const asgList: any[] = assignments || []

      function getTaskName(a: any): string {
        if (!a.tasks) return ""
        if (Array.isArray(a.tasks)) return a.tasks[0]?.name || ""
        return a.tasks.name || ""
      }

      // 2a. Already marked as absent?
      const alreadyAbsent = asgList.find(
        a => (a.task_id === ABSENCE_TASK_ID || getTaskName(a).includes("الغياب")) && a.completed
      )
      if (alreadyAbsent) {
        skippedCount++
        continue
      }

      // 2b. Marked as attended without memorizing?
      const attendedNoMemo = asgList.find(
        a => (a.task_id === NO_MEMO_TASK_ID || getTaskName(a).includes("الحضور بدون حفظ")) && a.completed
      )
      if (attendedNoMemo) {
        skippedCount++
        continue
      }

      // 2c. Marked as present or completed ANY positive task?
      const attendedPresent = asgList.find(
        a => (a.task_id === PRESENT_TASK_ID || getTaskName(a).includes("حاضر ومستعد")) && a.completed
      )
      const hasCompletedAnyTask = asgList.some(
        a => a.completed && a.task_id !== ABSENCE_TASK_ID && a.task_id !== NO_MEMO_TASK_ID
      )
      if (attendedPresent || hasCompletedAnyTask) {
        skippedCount++
        continue
      }

      // 2d. On Friday, also check Friday Tafsir tasks (attendance, homework, interaction)
      if (isFriday) {
        try {
          const { getFridayTafsirState } = await import("./friday-tafsir-server")
          const tafsir = await getFridayTafsirState(student.id, targetDate)
          if (tafsir && (tafsir.attendance.completed || tafsir.homework.completed || tafsir.interaction.completed)) {
            skippedCount++
            continue
          }
        } catch (e) {
          console.error("Auto-absence: error checking Friday Tafsir state:", e)
        }
      }

      // 3. Student did NOT record attendance! Mark as ABSENT.
      console.log(`[AUTO-ABSENCE] Student ${student.full_name} (${student.id}) had no attendance record on ${targetDate}. Marking absent.`);

      // 3a. Upsert absence assignment
      const { error: upsertErr } = await supabase
        .from("daily_assignments")
        .upsert(
          {
            student_id: student.id,
            task_id: ABSENCE_TASK_ID,
            assigned_date: targetDate,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "student_id,task_id,assigned_date" }
        )

      if (upsertErr) {
        console.error(`Failed to upsert absence assignment for student ${student.id}:`, upsertErr)
        continue
      }

      // 3b. Atomically deduct 20 points across weekly and monthly summaries
      try {
        await syncStudentPoints(
          supabase,
          student.id,
          -20,
          0, // Deductions do not count as completed tasks
          targetDate
        )
      } catch (pointsErr) {
        console.error(`Failed to deduct points for student ${student.id}:`, pointsErr)
      }

      // 3c. Ensure alternative task assignment exists for recovery
      try {
        await supabase
          .from("daily_assignments")
          .upsert(
            {
              student_id: student.id,
              task_id: ALT_TASK_ID,
              assigned_date: targetDate,
              completed: false,
              completed_at: null,
            },
            { onConflict: "student_id,task_id,assigned_date" }
          )
      } catch (altErr) {
        console.warn(`Non-critical: failed to seed alternative task for student ${student.id}:`, altErr)
      }

      studentsMarkedAbsent.push({ id: student.id, name: student.full_name })
    }

    return {
      success: true,
      targetDate,
      isFriday: false,
      totalProcessed: realStudents.length,
      absentCount: studentsMarkedAbsent.length,
      skippedCount,
      studentsMarkedAbsent,
    }
  } catch (err: any) {
    console.error("Error in runAutoAbsenceSweep:", err)
    return {
      success: false,
      targetDate: overrideTargetDate || "",
      isFriday: false,
      totalProcessed: 0,
      absentCount: 0,
      skippedCount: 0,
      studentsMarkedAbsent: [],
      error: err.message || "Unknown error",
    }
  }
}
