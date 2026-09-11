import { isFridayDate } from "./manual-consolidation-utils"
import { getActiveManualConsolidation } from "./manual-consolidation"
import { getFridayTafsirState } from "./friday-tafsir-server"
import { getAllStudentParentPhones } from "./student-phone-server"
import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface StudentDailyReportData {
  studentId: string
  studentName: string
  parentPhone: string
  dateStr: string
  formattedDate: string
  isFriday: boolean
  hasConsolidation: boolean
  consolidationDetails?: any
  status: "absent" | "present_memorized" | "present_unmemorized"
  generatedText: string
  whatsappUrl: string
}

export function formatReportDate(dateStr: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length < 3) return dateStr
  const [y, m, d] = parts
  return `${d}-${m}-${y}`
}

/**
 * Builds the comprehensive WhatsApp report text for a student based on exact rules:
 * - Header: السلام عليكم ورحمة الله وبركاته، تقرير أداء الطالب: [اسم الطالب] ليوم [التاريخ].
 * - Attendance & Memorization:
 *   - If absent: الدوام: ❌ غائب. (Stops here, no tasks printed)
 *   - If present: الدوام: ✅ حاضر
 *                 الحفظ: [✅ حافظ / ❌ غير حافظ]
 * - Tasks section based on day and consolidation state:
 *   - Case A (Regular Day - Memorization Plan): 6 routine tasks with ✅ or ❌
 *   - Case B (Regular Day - Consolidation Plan): 3 consolidation tasks (تكرارات التثبيت, جنب الدرس التثبيتي, قيام الليل التثبيتي)
 *   - Case C (Friday - No Consolidation Plan): Friday Tafsir tasks (حضور التفسير, حل الواجب, التفاعل)
 *   - Case D (Friday - Concurrent with Consolidation Plan): Both Friday Tafsir tasks and Consolidation tasks printed separately
 */
export function buildStudentReportText(params: {
  studentName: string
  dateStr: string
  isFriday: boolean
  hasConsolidation: boolean
  consolidationTarget?: number
  consolidationCompleted?: boolean
  consolidationAdjCompleted?: boolean
  consolidationNightCompleted?: boolean
  assignments: { name: string; completed: boolean }[]
  fridayState?: {
    attendance: { completed: boolean }
    homework: { completed: boolean; score: number }
    interaction: { completed: boolean; score: number }
  }
}): { text: string; status: "absent" | "present_memorized" | "present_unmemorized" } {
  const {
    studentName,
    dateStr,
    isFriday,
    hasConsolidation,
    consolidationTarget = 10,
    consolidationCompleted = false,
    consolidationAdjCompleted = false,
    consolidationNightCompleted = false,
    assignments = [],
    fridayState,
  } = params

  const formattedDate = formatReportDate(dateStr)

  // 1. Determine attendance and memorization status
  const isAbsent = assignments.some(
    a => (a.name.includes("الغياب") || a.name.includes("غياب")) && a.completed
  )
  const isNoMemorization = assignments.some(
    a => a.name.includes("الحضور بدون حفظ") && a.completed
  )

  let status: "absent" | "present_memorized" | "present_unmemorized" = "present_memorized"
  if (isAbsent) {
    status = "absent"
  } else if (isNoMemorization) {
    status = "present_unmemorized"
  }

  // Header line
  const lines: string[] = [
    `السلام عليكم ورحمة الله وبركاته، تقرير أداء الطالب: ${studentName} ليوم (${formattedDate}).`,
    "",
  ]

  // If student was absent: stop here
  if (isAbsent) {
    lines.push("الدوام: ❌ غائب.")
    return { text: lines.join("\n"), status }
  }

  // Attendance & Memorization lines
  lines.push("الدوام: ✅ حاضر.")
  lines.push(`الحفظ: ${isNoMemorization ? "❌ غير حافظ" : "✅ حافظ"}.`)
  lines.push("")

  // Dynamic Tasks Section
  if (isFriday) {
    // Friday Cases: C or D
    // Friday Tafsir tasks block
    lines.push("📖 مهام يوم التفسير الأسبوعي:")
    const fAtt = Boolean(fridayState?.attendance?.completed)
    const fHwScore = fridayState?.homework?.completed ? (fridayState.homework.score ?? 0) : 0
    const fIntScore = fridayState?.interaction?.completed ? (fridayState.interaction.score ?? 0) : 0

    lines.push(`- حضور التفسير: ${fAtt ? "✅" : "❌"}`)
    lines.push(`- حل الواجب: ${fridayState?.homework?.completed ? `العلامة ${fHwScore}/30` : "❌ لم يُسلّم (0/30)"}`)
    lines.push(`- التفاعل: ${fridayState?.interaction?.completed ? `العلامة ${fIntScore}/30` : "❌ لا يوجد تفاعل (0/30)"}`)

    // Case D: If concurrent with active consolidation plan on Friday
    if (hasConsolidation) {
      lines.push("")
      lines.push("🛡️ مهام التثبيت المعتمدة (يوم الجمعة):")
      lines.push(
        `- تكرارات التثبيت: ${
          consolidationCompleted ? `✅ أنجز ${consolidationTarget}/${consolidationTarget}` : `❌ لم يكتمل`
        }`
      )
      lines.push(`- جنب الدرس التثبيتي: ${consolidationAdjCompleted ? "✅" : "❌"}`)
      lines.push(`- قيام الليل التثبيتي: ${consolidationNightCompleted ? "✅" : "❌"}`)
    }
  } else {
    // Regular Day Cases: A or B
    if (hasConsolidation) {
      // Case B: Regular Day - Consolidation Plan
      lines.push("🛡️ مهام التثبيت المعتمدة:")
      lines.push(
        `- تكرارات التثبيت: ${
          consolidationCompleted ? `✅ أنجز ${consolidationTarget}/${consolidationTarget}` : `❌ لم يكتمل`
        }`
      )
      lines.push(`- جنب الدرس التثبيتي: ${consolidationAdjCompleted ? "✅" : "❌"}`)
      lines.push(`- قيام الليل التثبيتي: ${consolidationNightCompleted ? "✅" : "❌"}`)
    } else {
      // Case A: Regular Day - Memorization Plan (6 tasks)
      lines.push("📋 مهام خطة الحفظ:")
      const regularOrder = ["السماع", "الدرس", "جنب الدرس", "التفسير", "المراجعة", "قيام الليل"]
      for (const tName of regularOrder) {
        const found = assignments.find(a => a.name === tName)
        const isDone = Boolean(found && found.completed)
        lines.push(`- ${tName}: ${isDone ? "✅" : "❌"}`)
      }
    }
  }

  return { text: lines.join("\n"), status }
}

/**
 * Generates daily reports for all students for a specific date
 */
export async function generateAllStudentsDailyReports(
  dateStr: string
): Promise<StudentDailyReportData[]> {
  const supabase = getAdminClient()
  const isFriday = isFridayDate(dateStr)
  const formattedDate = formatReportDate(dateStr)

  // 1. Fetch students & parent phones
  const [studentsRes, phonesMap] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name"),
    getAllStudentParentPhones(),
  ])

  const students = studentsRes.data || []

  // 2. Fetch daily assignments for all students on this date
  const { data: allAssignments } = await supabase
    .from("daily_assignments")
    .select("student_id, completed, tasks(name)")
    .eq("assigned_date", dateStr)

  const assignmentsByStudent: Record<string, { name: string; completed: boolean }[]> = {}
  for (const s of students) {
    assignmentsByStudent[s.id] = []
  }
  for (const row of allAssignments || []) {
    if (assignmentsByStudent[row.student_id] && row.tasks) {
      assignmentsByStudent[row.student_id].push({
        name: (row.tasks as any).name || "",
        completed: Boolean(row.completed),
      })
    }
  }

  // 3. Process students in parallel
  const reports: StudentDailyReportData[] = await Promise.all(
    students.map(async s => {
      const studentId = s.id
      const studentName = s.full_name
      const parentPhone = phonesMap[studentId] || (s as any).parent_phone || s.phone || ""
      const studentAssignments = assignmentsByStudent[studentId] || []

      // Check active consolidation and Friday state in parallel
      const [activeConsolidation, fridayState] = await Promise.all([
        getActiveManualConsolidation(studentId, dateStr),
        isFriday ? getFridayTafsirState(studentId, dateStr) : Promise.resolve(undefined),
      ])

      const hasConsolidation = Boolean(
        activeConsolidation && (activeConsolidation.include_fridays || !isFriday)
      )

      // Consolidation task status
      const repDone = studentAssignments.some(a => a.name === "الدرس" && a.completed)
      const adjDone = studentAssignments.some(a => a.name === "جنب الدرس" && a.completed)
      const nightDone = studentAssignments.some(a => a.name === "قيام الليل" && a.completed)
      const target = activeConsolidation?.repetitions_count || 10

      const { text, status } = buildStudentReportText({
        studentName,
        dateStr,
        isFriday,
        hasConsolidation,
        consolidationTarget: target,
        consolidationCompleted: repDone,
        consolidationAdjCompleted: adjDone,
        consolidationNightCompleted: nightDone,
        assignments: studentAssignments,
        fridayState,
      })

      // Prepare WhatsApp URL
      const cleanPhone = parentPhone.replace(/\D/g, "")
      const encodedText = encodeURIComponent(text)
      const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`

      return {
        studentId,
        studentName,
        parentPhone: cleanPhone,
        dateStr,
        formattedDate,
        isFriday,
        hasConsolidation,
        consolidationDetails: activeConsolidation
          ? {
              pagesDescription: activeConsolidation.pages_description,
              repetitionsCount: target,
            }
          : undefined,
        status,
        generatedText: text,
        whatsappUrl,
      }
    })
  )

  return reports
}
