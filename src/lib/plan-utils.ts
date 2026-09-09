export interface StudentPlan {
  current_page: number // 1 to 604
  page_part: "top" | "bottom" // 'top' (النصف العلوي) or 'bottom' (النصف السفلي)
  current_review_hizb: number // 1 to 60
  plan_start_date?: string
  plan_end_date?: string
  plan_active?: boolean
}

export interface DailyPlanDetails {
  isFriday: boolean
  page: number
  part: "top" | "bottom"
  partLabel: string
  hizb: number
  juz: number
  tasks: {
    lesson: string // الدرس
    listening: string // السماع
    tafsir: string // التفسير
    nightPrayer: string // قيام الليل
    adjacentLesson: string // جنب الدرس
    revision: string // المراجعة
  }
}

export const DEFAULT_PLAN: StudentPlan = {
  current_page: 1,
  page_part: "top",
  current_review_hizb: 1,
  plan_start_date: "2026-09-09",
  plan_end_date: "2027-12-31",
  plan_active: true,
}

// Approximate Quran Juz start pages for reference and UI enhancement
export function getJuzNumber(page: number): number {
  if (page <= 1) return 1
  if (page >= 582) return 30
  // Standard Madinah Mushaf roughly 20 pages per juz
  return Math.min(30, Math.max(1, Math.floor((page - 2) / 20) + 1))
}

// Get daily 6 interconnected tasks based on student plan
export function getDailyPlanDetails(plan: StudentPlan | null | undefined, dateStr: string): DailyPlanDetails {
  const safePlan = plan || DEFAULT_PLAN
  const currentPage = Math.max(1, Math.min(604, safePlan.current_page || 1))
  const pagePart = safePlan.page_part === "bottom" ? "bottom" : "top"
  const currentHizb = Math.max(1, Math.min(60, safePlan.current_review_hizb || 1))
  const partLabel = pagePart === "top" ? "النصف العلوي" : "النصف السفلي"
  const juz = getJuzNumber(currentPage)

  // Check if date is Friday (يوم الجمعة إجازة)
  const [y, m, d] = dateStr.split("-").map(Number)
  const dateObj = new Date(y, m - 1, d)
  const isFriday = dateObj.getDay() === 5

  // 1. جنب الدرس (الربط): الصفحتين السابقتين مباشرة
  let adjacentText = ""
  if (currentPage === 1) {
    adjacentText = "لا يوجد (بداية المصحف)"
  } else if (currentPage === 2) {
    adjacentText = "صفحة 1"
  } else {
    adjacentText = `صفحة ${currentPage - 2} و ${currentPage - 1}`
  }

  // 2. الدرس وتوابعه (نفس نصف الصفحة)
  const portionDesc = `صفحة ${currentPage} - ${partLabel}`

  return {
    isFriday,
    page: currentPage,
    part: pagePart,
    partLabel,
    hizb: currentHizb,
    juz,
    tasks: {
      lesson: portionDesc,
      listening: `سماع ${portionDesc}`,
      tafsir: `تفسير ${portionDesc}`,
      nightPrayer: `قيام الليل بـ ${portionDesc}`,
      adjacentLesson: adjacentText,
      revision: `مراجعة الحزب رقم ${currentHizb}`,
    },
  }
}

// Auto-progression calculation when a task is completed/uncompleted
export function calculateNextPlanState(current: StudentPlan, taskName: string, completed: boolean): StudentPlan {
  const next = { ...current }

  const isLesson = taskName.includes("الدرس") && !taskName.includes("جنب")
  const isRevision = taskName.includes("المراجعة")

  if (completed) {
    if (isLesson) {
      if (next.page_part === "top") {
        next.page_part = "bottom"
      } else {
        next.page_part = "top"
        next.current_page = Math.min(604, next.current_page + 1)
      }
    } else if (isRevision) {
      next.current_review_hizb = (next.current_review_hizb % 60) + 1
    }
  } else {
    // Revert progression if uncompleted
    if (isLesson) {
      if (next.page_part === "bottom") {
        next.page_part = "top"
      } else if (next.current_page > 1) {
        next.page_part = "bottom"
        next.current_page = Math.max(1, next.current_page - 1)
      }
    } else if (isRevision) {
      next.current_review_hizb = next.current_review_hizb === 1 ? 60 : next.current_review_hizb - 1
    }
  }

  return next
}
