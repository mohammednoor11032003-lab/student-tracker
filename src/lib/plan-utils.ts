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
  hizbName: string
  hizbIndex: number
  totalCycleHizbs: number
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
  plan_start_date: "2026-09-09",
  plan_end_date: "2027-12-31",
  plan_active: true,
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

// Get daily 6 interconnected tasks based on student plan
export function getDailyPlanDetails(plan: StudentPlan | null | undefined, dateStr: string): DailyPlanDetails {
  const safePlan = plan || DEFAULT_PLAN
  const currentPage = Math.max(1, Math.min(604, safePlan.current_page || 1))
  const pagePart = safePlan.page_part === "bottom" ? "bottom" : "top"
  const partLabel = pagePart === "top" ? "النصف العلوي" : "النصف السفلي"
  const juz = getJuzNumber(currentPage)

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

  return {
    isFriday,
    page: currentPage,
    part: pagePart,
    partLabel,
    hizb: reviewHizb.hizb,
    hizbName: reviewHizb.name,
    hizbIndex: reviewIndex,
    totalCycleHizbs,
    juz,
    tasks: {
      lesson: portionDesc,
      listening: `سماع ${portionDesc}`,
      tafsir: `تفسير ${portionDesc}`,
      nightPrayer: `قيام الليل بـ ${portionDesc}`,
      adjacentLesson: adjacentText,
      revision: `مراجعة ${reviewHizb.name} (الجزء ${reviewHizb.juz})`,
    },
  }
}

// Auto-progression calculation when a task is completed/uncompleted
export function calculateNextPlanState(current: StudentPlan, taskName: string, completed: boolean): StudentPlan {
  const next: StudentPlan = {
    ...current,
    memorized_ajza: Array.isArray(current.memorized_ajza) && current.memorized_ajza.length > 0 ? current.memorized_ajza : [1],
    current_review_index: Math.max(0, Number(current.current_review_index) || 0),
  }

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
      const cycle = getReviewCycle(next.memorized_ajza)
      next.current_review_index = (next.current_review_index + 1) % cycle.length
      next.current_review_hizb = cycle[next.current_review_index].hizb
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
      const cycle = getReviewCycle(next.memorized_ajza)
      next.current_review_index = (next.current_review_index - 1 + cycle.length) % cycle.length
      next.current_review_hizb = cycle[next.current_review_index].hizb
    }
  }

  return next
}
