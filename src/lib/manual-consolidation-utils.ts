export interface ManualConsolidation {
  id: string
  student_id: string
  start_page: number
  end_page: number
  daily_pages_count: number
  start_date: string
  end_date: string
  include_fridays: boolean
  has_harvest_day: boolean
  harvest_days_count: number
  resume_page_pointer: string
  pages_description: string
  repetitions_count: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function parseResumePointer(pointer: string): { page: number; part: "top" | "bottom" } {
  const match = pointer.match(/\d+/)
  const page = match ? Math.max(1, Math.min(604, parseInt(match[0], 10))) : 1
  const part: "top" | "bottom" = pointer.includes("السفلي") ? "bottom" : "top"
  return { page, part }
}

/**
 * Check if a date string (YYYY-MM-DD) is a Friday.
 */
export function isFridayDate(dateStr: string): boolean {
  if (!dateStr) return false
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getDay() === 5
}

/**
 * Calculates the number of actual working days between startDate and endDate.
 * If includeFridays is false, Fridays are excluded.
 */
export function countWorkingDays(startDateStr: string, endDateStr: string, includeFridays: boolean): number {
  if (!startDateStr || !endDateStr) return 0
  const [sy, sm, sd] = startDateStr.split("-").map(Number)
  const [ey, em, ed] = endDateStr.split("-").map(Number)
  const startD = new Date(sy, sm - 1, sd)
  const endD = new Date(ey, em - 1, ed)
  if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || endD < startD) return 0

  let workingDays = 0
  const cur = new Date(startD)
  while (cur <= endD) {
    const isFriday = cur.getDay() === 5
    if (includeFridays || !isFriday) {
      workingDays++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return workingDays
}

/**
 * Calculates the recommended end date given a start date and the required number of working days.
 * If includeFridays is false, Fridays are skipped so each required day is an actual working day.
 */
export function calculateEndDateForWorkingDays(
  startDateStr: string,
  requiredWorkingDays: number,
  includeFridays: boolean
): string {
  if (!startDateStr || requiredWorkingDays <= 0) return ""
  const [sy, sm, sd] = startDateStr.split("-").map(Number)
  const cur = new Date(sy, sm - 1, sd)

  let counted = 0
  while (counted < requiredWorkingDays) {
    const isFriday = cur.getDay() === 5
    if (includeFridays || !isFriday) {
      counted++
      if (counted === requiredWorkingDays) {
        break
      }
    }
    cur.setDate(cur.getDate() + 1)
  }

  const yyyy = cur.getFullYear()
  const mm = String(cur.getMonth() + 1).padStart(2, "0")
  const dd = String(cur.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Calculates which working day index a specific date is within a manual consolidation.
 * Returns { workingDayIndex: -1, isOffDay: true } if targetDate is a Friday and includeFridays is false.
 */
export function getWorkingDayIndex(
  startDateStr: string,
  targetDateStr: string,
  includeFridays: boolean
): { workingDayIndex: number; isOffDay: boolean } {
  if (!startDateStr || !targetDateStr || targetDateStr < startDateStr) {
    return { workingDayIndex: -1, isOffDay: false }
  }

  const [ty, tm, td] = targetDateStr.split("-").map(Number)
  const targetD = new Date(ty, tm - 1, td)
  const isTargetFriday = targetD.getDay() === 5

  if (!includeFridays && isTargetFriday) {
    return { workingDayIndex: -1, isOffDay: true }
  }

  const [sy, sm, sd] = startDateStr.split("-").map(Number)
  const cur = new Date(sy, sm - 1, sd)

  let index = 0
  while (cur < targetD) {
    const isFriday = cur.getDay() === 5
    if (includeFridays || !isFriday) {
      index++
    }
    cur.setDate(cur.getDate() + 1)
  }

  return { workingDayIndex: index, isOffDay: false }
}

export interface ManualConsolidationDailyDetails {
  workingDayIndex: number
  isFridayOffDay: boolean
  totalPages: number
  totalWorkingDays: number
  availableReviewDays: number
  dailyCount: number
  isHarvestDay: boolean
  todayStart: number
  todayEnd: number
  taskTitle: string
  detailsDescription: string
}

/**
 * Calculates daily chunking and harvest day details for a specific date within an active manual consolidation.
 * - If date is Friday and include_fridays is false -> returns isFridayOffDay: true
 * - If has_harvest_day is true -> reserves final day for Harvest Task (covers start_page to end_page),
 *   and chunks remaining pages strictly across availableReviewDays (totalWorkingDays - 1).
 */
export function getManualConsolidationDailyTaskDetails(
  consolidation: ManualConsolidation,
  selectedDateStr: string
): ManualConsolidationDailyDetails | null {
  if (!consolidation || !selectedDateStr) return null
  if (selectedDateStr < consolidation.start_date || selectedDateStr > consolidation.end_date) {
    return null
  }

  const includeFridays = Boolean(consolidation.include_fridays)
  const { workingDayIndex, isOffDay } = getWorkingDayIndex(
    consolidation.start_date,
    selectedDateStr,
    includeFridays
  )

  const totalPages = Math.max(0, consolidation.end_page - consolidation.start_page + 1)
  const totalWorkingDays = countWorkingDays(consolidation.start_date, consolidation.end_date, includeFridays)
  const hasHarvest = Boolean(consolidation.has_harvest_day)
  const harvestDays = hasHarvest ? Math.max(1, consolidation.harvest_days_count || 1) : 0
  const availableReviewDays = Math.max(1, totalWorkingDays - harvestDays)

  if (isOffDay) {
    return {
      workingDayIndex: -1,
      isFridayOffDay: true,
      totalPages,
      totalWorkingDays,
      availableReviewDays,
      dailyCount: consolidation.daily_pages_count || 4,
      isHarvestDay: false,
      todayStart: 0,
      todayEnd: 0,
      taskTitle: "يوم الجمعة إجازة رسمية 🕌 (لا توجد مهام تثبيت)",
      detailsDescription:
        "يوم الجمعة إجازة رسمية مستثناة من خطة التثبيت. لا توجد مهام تسميع أو تكرار لهذا اليوم، استمتع بيوم الراحة أو راجع ما سبق حفظه.",
    }
  }

  // Harvest Day Check:
  // When has_harvest_day is enabled, the final day (end_date) or any day beyond availableReviewDays is the Harvest Day
  const isHarvestDay =
    hasHarvest && (selectedDateStr === consolidation.end_date || workingDayIndex >= availableReviewDays)

  if (isHarvestDay) {
    return {
      workingDayIndex,
      isFridayOffDay: false,
      totalPages,
      totalWorkingDays,
      availableReviewDays,
      dailyCount: totalPages,
      isHarvestDay: true,
      todayStart: consolidation.start_page,
      todayEnd: consolidation.end_page,
      taskTitle: `يوم حصاد التثبيت الشامل: تسميع من ص ${consolidation.start_page} إلى ص ${consolidation.end_page}`,
      detailsDescription:
        "🌾 هذا هو يوم الحصاد الأكبر! المطلوب تسميع كل ما سبق دفعة واحدة لترسيخ الحفظ ونيل وسام الحصاد الذهبي! انقر على العداد بعد كل قراءة.",
    }
  }

  // Regular review day chunking:
  // Evenly distribute pages across availableReviewDays (totalWorkingDays - harvestDays)
  const effectiveDaily = Math.max(1, Math.ceil(totalPages / availableReviewDays))
  const chunkIndex = Math.min(workingDayIndex, availableReviewDays - 1)
  const todayStart = consolidation.start_page + chunkIndex * effectiveDaily
  let todayEnd = todayStart + effectiveDaily - 1

  if (chunkIndex === availableReviewDays - 1 || todayEnd > consolidation.end_page) {
    todayEnd = consolidation.end_page
  }
  const safeStart = Math.min(todayStart, consolidation.end_page)
  const safeEnd = Math.min(todayEnd, consolidation.end_page)

  return {
    workingDayIndex,
    isFridayOffDay: false,
    totalPages,
    totalWorkingDays,
    availableReviewDays,
    dailyCount: effectiveDaily,
    isHarvestDay: false,
    todayStart: safeStart,
    todayEnd: safeEnd,
    taskTitle: `مهمة التثبيت: تسميع من ص ${safeStart} إلى ص ${safeEnd}`,
    detailsDescription: `اليوم ${workingDayIndex + 1} من أصل ${availableReviewDays} أيام تثبيت (المقدار: ${Math.max(1, safeEnd - safeStart + 1)} صفحات). خطة الحفظ التلقائية مجمدة مؤقتاً لحين إتقان هذا المقدار.`,
  }
}
