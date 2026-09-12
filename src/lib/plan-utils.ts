import { getTodayDateStr } from "@/lib/date-utils"
import type { ManualConsolidation } from "@/lib/manual-consolidation-utils"
import { parseResumePointer } from "@/lib/manual-consolidation-utils"

export interface HizbInfo {
  hizb: number // 1 to 60
  juz: number // 1 to 30
  name: string
}

export interface StudentPlan {
  current_page: number // 1 to 604
  page_part: "top" | "bottom" // 'top' (النصف العلوي) or 'bottom' (النصف السفلي)
  current_review_hizb?: number // legacy fallback (1 to 60)
  memorized_ajza: number[] // array of Juz numbers, e.g. [26, 27, 28, 29, 30, 1, 2]
  current_review_index: number // index in custom review cycle (starts at 0)
  is_in_consolidation?: boolean // true if student is in 7-day consolidation week
  consolidation_day?: number // 1 to 7
  consolidation_juz?: number // which Juz is being consolidated (1 to 30)
  plan_start_date?: string
  plan_end_date?: string
  plan_active?: boolean
  plan_date?: string
  last_lesson_completed_date?: string | null
  daily_plan_snapshots?: Record<string, {
    page: number
    part: "top" | "bottom"
    hizb?: number
    is_in_consolidation?: boolean
    consolidation_day?: number
    consolidation_juz?: number
  }>
}

export interface ConsolidationTaskInfo {
  day: number
  title: string
  target: number
}

export interface DailyPlanDetails {
  isFriday: boolean
  isInConsolidation: boolean
  consolidationDay: number
  consolidationJuz: number
  consolidationTask: ConsolidationTaskInfo | null
  page: number
  part: "top" | "bottom"
  partLabel: string
  hizb: number
  hizbName: string
  hizbIndex: number
  totalCycleHizbs: number
  juz: number
  tasks: {
    lesson: string // الدرس أو مهمة التثبيت
    listening: string // السماع
    tafsir: string // التفسير
    nightPrayer: string // قيام الليل
    adjacentLesson: string // جنب الدرس
    revision: string // المراجعة
  }
  consolidationTasksInfo?: {
    isFridayZeroReward: boolean
    repetition: { title: string; target: number; points: number; pagesText: string }
    adjacent: { title: string; description: string; points: number; pagesText: string }
    nightPrayer: { title: string; description: string; points: number; pagesText: string }
    task1: { title: string; target: number; points: number; pagesText: string }
    task2: { title: string; description: string; points: number; pagesText: string }
    task3: { title: string; description: string; points: number; pagesText: string }
  }
}

// 60 Hizbs Dictionary with official names and Juz mapping
export const HIZB_DICTIONARY: HizbInfo[] = [
  { hizb: 1, juz: 1, name: "حزب الفاتحة" },
  { hizb: 2, juz: 1, name: "حزب {أفتطمعون}" },
  { hizb: 3, juz: 2, name: "حزب {سيقول السفهاء}" },
  { hizb: 4, juz: 2, name: "حزب {واذكروا الله}" },
  { hizb: 5, juz: 3, name: "حزب {تلك الرسل}" },
  { hizb: 6, juz: 3, name: "حزب {قل أؤنبئكم}" },
  { hizb: 7, juz: 4, name: "حزب {كل الطعام}" },
  { hizb: 8, juz: 4, name: "حزب {يستبشرون}" },
  { hizb: 9, juz: 5, name: "حزب {والمحصنات}" },
  { hizb: 10, juz: 5, name: "حزب {فما لكم في المنافقين}" },
  { hizb: 11, juz: 6, name: "حزب {لا يحب الله الجهر بالسوء}" },
  { hizb: 12, juz: 6, name: "حزب {واتل عليهم نبأ ابني آدم}" },
  { hizb: 13, juz: 7, name: "حزب {لتجدن أشد الناس عداوة}" },
  { hizb: 14, juz: 7, name: "حزب {إنما يستجيب الذين يسمعون}" },
  { hizb: 15, juz: 8, name: "حزب {ولو أننا نزلنا إليهم الملائكة}" },
  { hizb: 16, juz: 8, name: "حزب الأعراف" },
  { hizb: 17, juz: 9, name: "حزب {قال الملأ الذين استكبروا}" },
  { hizb: 18, juz: 9, name: "حزب {وإذ نتقنا الجبل}" },
  { hizb: 19, juz: 10, name: "حزب {واعلموا أنما غنمتم}" },
  { hizb: 20, juz: 10, name: "حزب {يا أيها الذين آمنوا إن كثيرا من الأحبار}" },
  { hizb: 21, juz: 11, name: "حزب {إنما السبيل على الذين يستأذنونك}" },
  { hizb: 22, juz: 11, name: "حزب {للذين أحسنوا الحسنى}" },
  { hizb: 23, juz: 12, name: "حزب {وما من دابة}" },
  { hizb: 24, juz: 12, name: "حزب {وإلى مدين أخاهم شعيبا}" },
  { hizb: 25, juz: 13, name: "حزب {وما أبرئ نفسي}" },
  { hizb: 26, juz: 13, name: "حزب {أفمن يعلم أنما أنزل إليك}" },
  { hizb: 27, juz: 14, name: "حزب الحجر" },
  { hizb: 28, juz: 14, name: "حزب {وقال الله لا تتخذوا إلهين}" },
  { hizb: 29, juz: 15, name: "حزب الإسراء" },
  { hizb: 30, juz: 15, name: "حزب {أولم يروا أن الله الذي خلق السماوات}" },
  { hizb: 31, juz: 16, name: "حزب {قال ألم أقل لك}" },
  { hizb: 32, juz: 16, name: "حزب طه" },
  { hizb: 33, juz: 17, name: "حزب الأنبياء" },
  { hizb: 34, juz: 17, name: "حزب الحج" },
  { hizb: 35, juz: 18, name: "حزب المؤمنون" },
  { hizb: 36, juz: 18, name: "حزب {يا أيها الذين آمنوا لا تتبعوا خطوات الشيطان}" },
  { hizb: 37, juz: 19, name: "حزب {وقال الذين لا يرجون لقاءنا}" },
  { hizb: 38, juz: 19, name: "حزب {قالوا أنؤمن لك واتبعك الأرذلون}" },
  { hizb: 39, juz: 20, name: "حزب {فما كان جواب قومه}" },
  { hizb: 40, juz: 20, name: "حزب {ولقد وصلنا لهم القول}" },
  { hizb: 41, juz: 21, name: "حزب {ولا تجادلوا أهل الكتاب}" },
  { hizb: 42, juz: 21, name: "حزب {ومن يسلم وجهه إلى الله}" },
  { hizb: 43, juz: 22, name: "حزب {ومن يقنت منكن}" },
  { hizb: 44, juz: 22, name: "حزب {قل من يرزقكم من السماوات والأرض}" },
  { hizb: 45, juz: 23, name: "حزب {وما أنزلنا على قومه}" },
  { hizb: 46, juz: 23, name: "حزب {فنبذناه بالعراء وهو سقيم}" },
  { hizb: 47, juz: 24, name: "حزب {فمن أظلم ممن كذب على الله}" },
  { hizb: 48, juz: 24, name: "حزب {ويا قوم ما لي أدعوكم إلى النجاة}" },
  { hizb: 49, juz: 25, name: "حزب {إليه يرد علم الساعة}" },
  { hizb: 50, juz: 25, name: "حزب {قال أولو جئتكم بأهدى}" },
  { hizb: 51, juz: 26, name: "حزب الأحقاف" },
  { hizb: 52, juz: 26, name: "حزب الفتح" },
  { hizb: 53, juz: 27, name: "حزب الذاريات" },
  { hizb: 54, juz: 27, name: "حزب {الرحمن}" },
  { hizb: 55, juz: 28, name: "حزب المجادلة" },
  { hizb: 56, juz: 28, name: "حزب الجمعة" },
  { hizb: 57, juz: 29, name: "حزب الملك" },
  { hizb: 58, juz: 29, name: "حزب الجن" },
  { hizb: 59, juz: 30, name: "حزب النبأ" },
  { hizb: 60, juz: 30, name: "حزب الأعلى" },
]

export const DEFAULT_PLAN: StudentPlan = {
  current_page: 1,
  page_part: "top",
  current_review_hizb: 1,
  memorized_ajza: [1],
  current_review_index: 0,
  is_in_consolidation: false,
  consolidation_day: 0,
  consolidation_juz: 0,
  plan_start_date: "2026-09-09",
  plan_end_date: "2027-12-31",
  plan_active: true,
}

// 1. Juz Boundaries Dictionary (نهايات الأجزاء وفق مصحف المدينة 604 صفحة)
export const JUZ_BOUNDARIES: Record<number, number> = {
  1: 21,
  2: 41,
  3: 61,
  4: 81,
  5: 101,
  6: 121,
  7: 141,
  8: 161,
  9: 181,
  10: 201,
  11: 221,
  12: 241,
  13: 261,
  14: 281,
  15: 301,
  16: 321,
  17: 341,
  18: 361,
  19: 381,
  20: 401,
  21: 421,
  22: 441,
  23: 461,
  24: 481,
  25: 501,
  26: 521,
  27: 541,
  28: 561,
  29: 581,
  30: 604,
}

export function getJuzForEndPage(page: number): number | null {
  for (const [juzStr, endPage] of Object.entries(JUZ_BOUNDARIES)) {
    if (endPage === page) return Number(juzStr)
  }
  return null
}

// 2. جدول أسبوع التثبيت التلقائي (7 أيام)
export const CONSOLIDATION_SCHEDULE: Record<number, { title: string; target: number }> = {
  1: { title: "تثبيت أول 5 صفحات من الجزء", target: 10 },
  2: { title: "تثبيت ثاني 5 صفحات من الجزء", target: 10 },
  3: { title: "تثبيت ثالث 5 صفحات من الجزء", target: 10 },
  4: { title: "تثبيت آخر 5 صفحات من الجزء", target: 10 },
  5: { title: "تثبيت النصف الأول من الجزء (10 صفحات)", target: 5 },
  6: { title: "تثبيت النصف الثاني من الجزء (10 صفحات)", target: 5 },
  7: { title: "تثبيت الجزء كامل", target: 3 },
}

// Generate the custom non-linear review cycle based on memorized Ajza
export function getReviewCycle(memorizedAjza: number[] | null | undefined): HizbInfo[] {
  // 1. Sanitize and sort Ajza in ascending Quran order (1, 2... 26, 27, etc.)
  const rawList = Array.isArray(memorizedAjza) ? memorizedAjza : [1]
  const validAjza = Array.from(
    new Set(
      rawList
        .map(Number)
        .filter(j => !isNaN(j) && j >= 1 && j <= 30)
    )
  ).sort((a, b) => a - b)

  const activeAjza = validAjza.length > 0 ? validAjza : [1]

  // 2. Extract corresponding Hizbs in Quran order
  const cycle: HizbInfo[] = []
  for (const juzNum of activeAjza) {
    const hizb1 = (juzNum - 1) * 2 + 1
    const hizb2 = (juzNum - 1) * 2 + 2
    const item1 = HIZB_DICTIONARY.find(h => h.hizb === hizb1)
    const item2 = HIZB_DICTIONARY.find(h => h.hizb === hizb2)
    if (item1) cycle.push(item1)
    if (item2) cycle.push(item2)
  }

  return cycle.length > 0 ? cycle : [HIZB_DICTIONARY[0]]
}

// Get the current Hizb in the review cycle for a student
export function getCurrentReviewHizb(plan: StudentPlan | null | undefined): { item: HizbInfo; index: number; total: number } {
  const safePlan = plan || DEFAULT_PLAN
  const cycle = getReviewCycle(safePlan.memorized_ajza)
  const safeIndex = Math.max(0, Number(safePlan.current_review_index) || 0) % cycle.length
  return {
    item: cycle[safeIndex],
    index: safeIndex,
    total: cycle.length,
  }
}

// Approximate Quran Juz start pages for reference and UI enhancement
export function getJuzNumber(page: number): number {
  if (page <= 1) return 1
  if (page >= 582) return 30
  // Standard Madinah Mushaf roughly 20 pages per juz
  return Math.min(30, Math.max(1, Math.floor((page - 2) / 20) + 1))
}

// Get page range for any Juz (1 to 30) according to Madinah Mushaf (604 pages)
export function getJuzPageRange(juz: number): { start: number; end: number; count: number } {
  const safeJuz = Math.max(1, Math.min(30, Number(juz) || 1))
  const start = safeJuz === 1 ? 1 : (safeJuz - 1) * 20 + 2
  const end = safeJuz === 30 ? 604 : safeJuz * 20 + 1
  return { start, end, count: end - start + 1 }
}

// Calculate total unique pages memorized (sequential current_page + memorized_ajza with zero double counting)
export function calculateTotalMemorizedPages(plan: StudentPlan | null | undefined): {
  totalPages: number
  percentComplete: number
} {
  const safePlan = plan || DEFAULT_PLAN
  const currentPage = Math.max(1, Math.min(604, safePlan.current_page || 1))
  const pagePart = safePlan.page_part === "bottom" ? "bottom" : "top"
  const memorizedAjza = Array.isArray(safePlan.memorized_ajza) ? safePlan.memorized_ajza : [1]

  const memorizedPagesSet = new Set<number>()

  // 1. Add all sequential pages up to currentPage - 1
  for (let p = 1; p < currentPage; p++) {
    memorizedPagesSet.add(p)
  }

  // 2. Handle currentPage: if bottom, page is completed; if top, half is completed
  let hasCurrentHalf = false
  if (pagePart === "bottom") {
    memorizedPagesSet.add(currentPage)
  } else {
    hasCurrentHalf = true
  }

  // 3. Add all pages from memorized_ajza (union without any duplicate counting)
  for (const j of memorizedAjza) {
    if (j >= 1 && j <= 30) {
      const { start, end } = getJuzPageRange(j)
      for (let p = start; p <= end; p++) {
        memorizedPagesSet.add(p)
      }
    }
  }

  let totalPages = memorizedPagesSet.size
  if (hasCurrentHalf && !memorizedPagesSet.has(currentPage)) {
    totalPages += 0.5
  }

  const percentComplete = Math.min(100, Math.round((totalPages / 604) * 100))

  return { totalPages, percentComplete }
}

// Get daily tasks based on student plan
export function getDailyPlanDetails(plan: StudentPlan | null | undefined, dateStr: string): DailyPlanDetails {
  const safePlan = plan || DEFAULT_PLAN
  const currentPage = Math.max(1, Math.min(604, safePlan.current_page || 1))
  const pagePart = safePlan.page_part === "bottom" ? "bottom" : "top"
  const partLabel = pagePart === "top" ? "النصف العلوي" : "النصف السفلي"
  const juz = getJuzNumber(currentPage)

  // Consolidation State
  const isInConsolidation = Boolean(safePlan.is_in_consolidation)
  const consolidationDay = Math.max(1, Math.min(7, safePlan.consolidation_day || 1))
  const consolidationJuz = safePlan.consolidation_juz || juz
  const schedItem = CONSOLIDATION_SCHEDULE[consolidationDay] || CONSOLIDATION_SCHEDULE[1]
  const consolidationTask: ConsolidationTaskInfo | null = isInConsolidation
    ? { day: consolidationDay, title: schedItem.title, target: schedItem.target }
    : null

  // Review Hizb from custom cycle
  const { item: reviewHizb, index: reviewIndex, total: totalCycleHizbs } = getCurrentReviewHizb(safePlan)

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

  let lessonTaskText = portionDesc
  let adjacentTaskText = adjacentText
  let listeningTaskText = `سماع ${portionDesc}`
  let tafsirTaskText = `تفسير ${portionDesc}`
  let nightPrayerTaskText = `قيام الليل بـ ${portionDesc}`
  let revisionTaskText = `مراجعة ${reviewHizb.name} (الجزء ${reviewHizb.juz})`

  let consolidationTasksInfo: DailyPlanDetails["consolidationTasksInfo"] = undefined

  if (isInConsolidation) {
    const cJuz = safePlan.consolidation_juz || juz
    const { start: jStart, end: jEnd } = getJuzPageRange(cJuz)

    let dStart = jStart
    let dEnd = jStart + 4
    if (consolidationDay === 1) {
      dStart = jStart
      dEnd = jStart + 4
    } else if (consolidationDay === 2) {
      dStart = jStart + 5
      dEnd = jStart + 9
    } else if (consolidationDay === 3) {
      dStart = jStart + 10
      dEnd = jStart + 14
    } else if (consolidationDay === 4) {
      dStart = jStart + 15
      dEnd = jEnd
    } else if (consolidationDay === 5) {
      dStart = jStart
      dEnd = jStart + 9
    } else if (consolidationDay === 6) {
      dStart = jStart + 10
      dEnd = jEnd
    } else if (consolidationDay === 7) {
      dStart = jStart
      dEnd = jEnd
    }
    const cumulativeEnd = consolidationDay <= 4 ? dEnd : jEnd

    // 🛡️ Friday Zero-Reward Rule:
    const repPoints = isFriday ? 0 : 20
    const adjPoints = isFriday ? 0 : 5
    const nightPoints = isFriday ? 0 : 5

    lessonTaskText = `أسبوع التثبيت (اليوم ${consolidationDay} من 7): ${schedItem.title} (الهدف: ${schedItem.target} تكرارات)`
    adjacentTaskText = `تسميع ومراجعة جميع الصفحات التي تم أخذها منذ بداية خطة التثبيت الحالية وحتى اليوم (من ص ${jStart} إلى ص ${cumulativeEnd})`
    nightPrayerTaskText = `صلاة قيام الليل بالصفحات التي تم تكرارها اليوم فقط في خطة التثبيت (صفحات اليوم: من ص ${dStart} إلى ص ${dEnd})`
    listeningTaskText = "معلّق خلال أسبوع التثبيت للتركيز على إتقان الجزء"
    tafsirTaskText = "معلّق خلال أسبوع التثبيت للتركيز على إتقان الجزء"
    revisionTaskText = "معلّق خلال أسبوع التثبيت للتركيز على إتقان الجزء"

    const repTask = {
      title: lessonTaskText,
      target: schedItem.target,
      points: repPoints,
      pagesText: `من ص ${dStart} إلى ص ${dEnd}`,
    }
    const adjTask = {
      title: "جنب الدرس (المراجعة التراكمية للتثبيت)",
      description: "تسميع ومراجعة جميع الصفحات التي تم أخذها منذ بداية خطة التثبيت الحالية وحتى اليوم",
      points: adjPoints,
      pagesText: `من ص ${jStart} إلى ص ${cumulativeEnd}`,
    }
    const nightTask = {
      title: "قيام الليل بالورد التثبيتي",
      description: "صلاة قيام الليل بالصفحات التي تم تكرارها اليوم فقط في خطة التثبيت",
      points: nightPoints,
      pagesText: `صفحات اليوم: من ص ${dStart} إلى ص ${dEnd}`,
    }

    consolidationTasksInfo = {
      isFridayZeroReward: isFriday,
      repetition: repTask,
      adjacent: adjTask,
      nightPrayer: nightTask,
      task1: repTask,
      task2: adjTask,
      task3: nightTask,
    }
  }

  return {
    isFriday,
    isInConsolidation,
    consolidationDay,
    consolidationJuz,
    consolidationTask,
    page: currentPage,
    part: pagePart,
    partLabel,
    hizb: reviewHizb.hizb,
    hizbName: reviewHizb.name,
    hizbIndex: reviewIndex,
    totalCycleHizbs,
    juz,
    tasks: {
      lesson: lessonTaskText,
      listening: listeningTaskText,
      tafsir: tafsirTaskText,
      nightPrayer: nightPrayerTaskText,
      adjacentLesson: adjacentTaskText,
      revision: revisionTaskText,
    },
    consolidationTasksInfo,
  }
}

// Auto-progression calculation when a task is completed/uncompleted
export function calculateNextPlanState(current: StudentPlan, taskName: string, completed: boolean): StudentPlan {
  const next: StudentPlan = {
    ...current,
    memorized_ajza: Array.isArray(current.memorized_ajza) && current.memorized_ajza.length > 0 ? current.memorized_ajza : [1],
    current_review_index: Math.max(0, Number(current.current_review_index) || 0),
    is_in_consolidation: Boolean(current.is_in_consolidation),
    consolidation_day: Number(current.consolidation_day) || 0,
    consolidation_juz: Number(current.consolidation_juz) || 0,
  }

  const isLesson = (taskName.includes("الدرس") || taskName.includes("التثبيت")) && !taskName.includes("جنب")
  const isRevision = taskName.includes("المراجعة")

  if (completed) {
    if (next.is_in_consolidation && isLesson) {
      // In consolidation mode: advance day
      const cDay = Number(next.consolidation_day) || 0
      if (cDay < 7) {
        next.consolidation_day = cDay + 1
      } else {
        // Finished day 7: resume standard plan for next Juz!
        next.is_in_consolidation = false
        next.consolidation_day = 0
        next.consolidation_juz = 0
        next.current_page = Math.min(604, next.current_page + 1)
        next.page_part = "top"
      }
    } else if (isLesson) {
      if (next.page_part === "top") {
        next.page_part = "bottom"
      } else {
        // Check if current page is end of Juz!
        const endJuz = getJuzForEndPage(next.current_page)
        if (endJuz !== null) {
          // Trigger Consolidation week!
          next.is_in_consolidation = true
          next.consolidation_day = 1
          next.consolidation_juz = endJuz
          // Keep page on this completed page until day 7 finishes
        } else {
          next.page_part = "top"
          next.current_page = Math.min(604, next.current_page + 1)
        }
      }
    } else if (isRevision) {
      const cycle = getReviewCycle(next.memorized_ajza)
      next.current_review_index = (next.current_review_index + 1) % cycle.length
      next.current_review_hizb = cycle[next.current_review_index].hizb
    }
  } else {
    // Revert progression if uncompleted
    if (next.is_in_consolidation && isLesson) {
      const cDay = Number(next.consolidation_day) || 0
      if (cDay > 1) {
        next.consolidation_day = cDay - 1
      } else {
        // If at day 1 and uncompleted, exit consolidation back to bottom of end page
        next.is_in_consolidation = false
        next.consolidation_day = 0
        next.consolidation_juz = 0
        next.page_part = "bottom"
      }
    } else if (isLesson) {
      if (next.page_part === "bottom") {
        next.page_part = "top"
      } else if (next.current_page > 1) {
        next.page_part = "bottom"
        next.current_page = Math.max(1, next.current_page - 1)
      }
    } else if (isRevision) {
      const cycle = getReviewCycle(next.memorized_ajza)
      next.current_review_index = (next.current_review_index - 1 + cycle.length) % cycle.length
      next.current_review_hizb = cycle[next.current_review_index].hizb
    }
  }

  return next
}

// 3. Future Plan Projection Engine (محرك محاكاة التقويم المستقبلي لخطة الحفظ)
export function calculateProjectedPlan(
  studentPlan: StudentPlan,
  targetDateStr: string,
  fromDateStr?: string,
  manualConsolidations?: ManualConsolidation[]
): {
  projectedPlan: StudentPlan
  planDetails: DailyPlanDetails
  diffDays: number
} {
  const safePlan = studentPlan || DEFAULT_PLAN
  const baseDateStr = fromDateStr || getTodayDateStr()

  const [by, bm, bd] = baseDateStr.split("-").map(Number)
  const [ty, tm, td] = targetDateStr.split("-").map(Number)
  const baseDate = new Date(by, bm - 1, bd)
  const targetDate = new Date(ty, tm - 1, td)

  // Calculate day difference
  const diffTime = targetDate.getTime() - baseDate.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    const activeManual = manualConsolidations?.find(
      c => c.is_active && targetDateStr >= c.start_date && targetDateStr <= c.end_date
    )
    let effectivePlan = safePlan
    if (activeManual && activeManual.resume_page_pointer) {
      const { page, part } = parseResumePointer(activeManual.resume_page_pointer)
      effectivePlan = {
        ...safePlan,
        current_page: page,
        page_part: part,
      }
    }
    return {
      projectedPlan: effectivePlan,
      planDetails: getDailyPlanDetails(effectivePlan, targetDateStr),
      diffDays: Math.max(0, diffDays),
    }
  }

  // Clone in-memory
  const sim: StudentPlan = {
    ...safePlan,
    memorized_ajza: Array.isArray(safePlan.memorized_ajza) && safePlan.memorized_ajza.length > 0 ? safePlan.memorized_ajza : [1],
    current_review_index: Math.max(0, Number(safePlan.current_review_index) || 0),
    is_in_consolidation: Boolean(safePlan.is_in_consolidation),
    consolidation_day: Number(safePlan.consolidation_day) || 0,
    consolidation_juz: Number(safePlan.consolidation_juz) || 0,
  }

  const cycle = getReviewCycle(sim.memorized_ajza)

  // Iterate day by day from 1 to diffDays
  for (let step = 1; step <= diffDays; step++) {
    const curDate = new Date(baseDate)
    curDate.setDate(baseDate.getDate() + step)
    const yyyy = curDate.getFullYear()
    const mm = String(curDate.getMonth() + 1).padStart(2, "0")
    const dd = String(curDate.getDate()).padStart(2, "0")
    const curDateStr = `${yyyy}-${mm}-${dd}`

    const isFriday = curDate.getDay() === 5

    // 1. Check if curDate falls inside an active manual consolidation
    const activeManual = manualConsolidations?.find(
      c => c.is_active && curDateStr >= c.start_date && curDateStr <= c.end_date
    )

    if (activeManual) {
      // 🛡️ CRITICAL FIX: FREEZE POINTER!
      // During active manual consolidation, regular memorization is 100% frozen!
      // Lock sim to resume_page_pointer so that when consolidation ends, it starts exactly here.
      if (activeManual.resume_page_pointer) {
        const { page, part } = parseResumePointer(activeManual.resume_page_pointer)
        sim.current_page = page
        sim.page_part = part
      }
      continue
    }

    // 2. Check if curDate is the first day after a manual consolidation ended (end_date + 1)
    const justEndedManual = manualConsolidations?.find(c => {
      if (!c.is_active || !c.resume_page_pointer) return false
      const [ey, em, ed] = c.end_date.split("-").map(Number)
      const endPlusOne = new Date(ey, em - 1, ed)
      endPlusOne.setDate(endPlusOne.getDate() + 1)
      const ey1 = endPlusOne.getFullYear()
      const em1 = String(endPlusOne.getMonth() + 1).padStart(2, "0")
      const ed1 = String(endPlusOne.getDate()).padStart(2, "0")
      return curDateStr === `${ey1}-${em1}-${ed1}`
    })

    if (justEndedManual && justEndedManual.resume_page_pointer) {
      // On end_date + 1, lock EXACTLY to resume_page_pointer as the starting day's tasks!
      const { page, part } = parseResumePointer(justEndedManual.resume_page_pointer)
      sim.current_page = page
      sim.page_part = part
      continue
    }

    // If Friday: off day, no progression occurs
    if (isFriday) {
      continue
    }

    // Progression on regular non-Friday working days (outside consolidation)
    if (sim.is_in_consolidation) {
      const sDay = Number(sim.consolidation_day) || 0
      if (sDay < 7) {
        sim.consolidation_day = sDay + 1
      } else {
        // Finished Day 7: exit consolidation and advance page to next Juz!
        sim.is_in_consolidation = false
        sim.consolidation_day = 0
        sim.consolidation_juz = 0
        sim.current_page = Math.min(604, sim.current_page + 1)
        sim.page_part = "top"
      }
    } else {
      if (sim.page_part === "top") {
        sim.page_part = "bottom"
      } else {
        const endJuz = getJuzForEndPage(sim.current_page)
        if (endJuz !== null) {
          // End of Juz reached: trigger Consolidation week!
          sim.is_in_consolidation = true
          sim.consolidation_day = 1
          sim.consolidation_juz = endJuz
        } else {
          sim.current_page = Math.min(604, sim.current_page + 1)
          sim.page_part = "top"
        }
      }
    }

    // Review Hizb progression: FROZEN during consolidation week!
    if (!sim.is_in_consolidation && cycle.length > 0) {
      sim.current_review_index = (sim.current_review_index + 1) % cycle.length
      sim.current_review_hizb = cycle[sim.current_review_index].hizb
    }
  }

  const planDetails = getDailyPlanDetails(sim, targetDateStr)

  return {
    projectedPlan: sim,
    planDetails,
    diffDays,
  }
}


