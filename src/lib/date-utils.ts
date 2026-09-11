export const ARABIC_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
export const WEEK_NAMES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"]

export const MONTH_NAMES = [
  "شهر 1",
  "شهر 2",
  "شهر 3",
  "شهر 4",
  "شهر 5",
  "شهر 6",
  "شهر 7",
  "شهر 8",
  "شهر 9",
  "شهر 10",
  "شهر 11",
  "شهر 12",
]

export function formatDisplayDate(dateStr: string, includeYear = true): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length < 3) return dateStr
  const [y, m, d] = parts
  const dd = String(d).padStart(2, "0")
  const mm = String(m).padStart(2, "0")
  return includeYear ? `${dd}-${mm}-${y}` : `${dd}-${mm}`
}

export function formatDisplayDateObj(d: Date, includeYear = false): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return includeYear ? `${dd}-${mm}-${d.getFullYear()}` : `${dd}-${mm}`
}

export function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Returns the Saturday that begins the week containing date `d`.
 * Weeks run Saturday -> Friday (7 days).
 */
export function getWeekStartSaturday(d: Date): Date {
  const sat = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const daysSinceSat = (sat.getDay() + 1) % 7
  sat.setDate(sat.getDate() - daysSinceSat)
  sat.setHours(0, 0, 0, 0)
  return sat
}

/**
 * Calculates the first Saturday of a given month according to the Tuesday Majority Rule:
 * A week (Sat-Fri) belongs to the month containing its 4th day (Tuesday).
 */
export function getFirstWeekSaturdayOfMonth(year: number, month: number): Date {
  const d1 = new Date(year, month - 1, 1)
  const sat = getWeekStartSaturday(d1)
  const tue = new Date(sat)
  tue.setDate(tue.getDate() + 3)

  if (tue.getMonth() + 1 === month && tue.getFullYear() === year) {
    return sat
  }
  sat.setDate(sat.getDate() + 7)
  return sat
}

export const getMonthFirstSaturday = getFirstWeekSaturdayOfMonth

/**
 * Returns an array of all weeks (4 or 5 weeks) for a given month.
 */
export function getMonthWeeksList(year: number, month: number) {
  const firstSat = getFirstWeekSaturdayOfMonth(year, month)
  const weeks = []
  let w = 1
  const curSat = new Date(firstSat)

  while (true) {
    const tue = new Date(curSat)
    tue.setDate(tue.getDate() + 3)
    if (tue.getMonth() + 1 !== month || tue.getFullYear() !== year) {
      break
    }
    const end = new Date(curSat)
    end.setDate(end.getDate() + 6)
    const sDD = String(curSat.getDate()).padStart(2, "0")
    const sMM = String(curSat.getMonth() + 1).padStart(2, "0")
    const eDD = String(end.getDate()).padStart(2, "0")
    const eMM = String(end.getMonth() + 1).padStart(2, "0")

    weeks.push({
      weekNum: w,
      weekName: `الأسبوع ${WEEK_NAMES[w - 1] || w}`,
      startDate: new Date(curSat),
      endDate: end,
      startDateStr: formatDateStr(curSat),
      endDateStr: formatDateStr(end),
      label: `من السبت ${sDD}-${sMM} إلى الجمعة ${eDD}-${eMM}`,
    })

    w++
    curSat.setDate(curSat.getDate() + 7)
  }
  return weeks
}

/**
 * Returns today's date string in YYYY-MM-DD format using Jordan local time (Asia/Amman, UTC+3).
 * Guarantees that SSR (running in UTC like Vercel) and client browsers agree on the exact calendar day.
 */
export function getTodayDateStr(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Amman",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d)
  } catch {
    // Robust UTC+3 offset fallback if Intl / timeZone is unsupported
    const offsetMs = 3 * 60 * 60 * 1000
    const jordanDate = new Date(d.getTime() + offsetMs)
    const y = jordanDate.getUTCFullYear()
    const m = String(jordanDate.getUTCMonth() + 1).padStart(2, "0")
    const day = String(jordanDate.getUTCDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }
}

/**
 * Converts any timestamp or date into Jordan local date string YYYY-MM-DD.
 */
export function getDateStrFromTimestamp(timestamp: string | Date): string {
  if (!timestamp) return getTodayDateStr()
  const d = typeof timestamp === "string" ? new Date(timestamp) : timestamp
  return getTodayDateStr(d)
}

/**
 * Attributes dateStr to its proper month, year, and weekNum (1..5) using Tuesday Majority Rule.
 */
export function getWeekAndMonthInfo(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const target = new Date(y, m - 1, d)
  const sat = getWeekStartSaturday(target)
  const tue = new Date(sat)
  tue.setDate(tue.getDate() + 3)

  const attributedYear = tue.getFullYear()
  const attributedMonth = tue.getMonth() + 1

  const firstSat = getFirstWeekSaturdayOfMonth(attributedYear, attributedMonth)
  const diffDays = Math.round((sat.getTime() - firstSat.getTime()) / (1000 * 60 * 60 * 24))
  const weekNum = Math.floor(diffDays / 7) + 1

  const end = new Date(sat)
  end.setDate(end.getDate() + 6)

  return {
    year: attributedYear,
    month: attributedMonth,
    weekNum,
    weekStart: sat,
    weekEnd: end,
  }
}

// ================= GAMIFIED PENALTY & MYSTERY BOX SYSTEM =================
export interface AlternativeSubTask {
  id: string
  title: string
  details?: string
  target: number
  current: number
  emoji: string
}

export interface AlternativeTaskState {
  active: boolean
  opened: boolean
  completed?: boolean
  completedAt?: string
  completionSummary?: string
  exempted?: boolean
  tasks: AlternativeSubTask[]
  createdAt: string
  assignedDate: string
}

function getRandomItems<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, n)
}

export function generateMysteryBoxOutcome(): {
  isExempt: boolean
  tasks: AlternativeSubTask[]
} {
  // 1. Rare Exemption (5%)
  const rand100 = Math.random() * 100
  if (rand100 < 5) {
    return {
      isExempt: true,
      tasks: [],
    }
  }

  // 2. Determine number of tasks: 1 task (70%) or 2 tasks (30%)
  const numTasksRand = Math.random() * 100
  const count = numTasksRand < 70 ? 1 : 2

  // 3. Task generator functions pool
  const taskPool: (() => AlternativeSubTask)[] = [
    // 1: تكرار قراءة الدرس نظراً 20 مرة (الهدف: 20)
    () => ({
      id: "read_20",
      title: "تكرار قراءة الدرس نظراً",
      details: "اقرأ الدرس من المصحف نظراً بتأنٍ وترتيل 20 مرة",
      target: 20,
      current: 0,
      emoji: "📖",
    }),

    // 2: تكرار قراءة الدرس نظراً 10 مرات (الهدف: 10)
    () => ({
      id: "read_10",
      title: "تكرار قراءة الدرس نظراً",
      details: "اقرأ الدرس من المصحف نظراً بتأنٍ وترتيل 10 مرات",
      target: 10,
      current: 0,
      emoji: "📖",
    }),

    // 3: نسخ الدرس 5 مرات (الهدف: 5)
    () => ({
      id: "copy_5",
      title: "نسخ الدرس في الدفتر",
      details: "انسخ آيات الدرس بخط يدك الجميل في الدفتر 5 مرات",
      target: 5,
      current: 0,
      emoji: "✍️",
    }),

    // 4: نسخ الدرس 3 مرات (الهدف: 3)
    () => ({
      id: "copy_3",
      title: "نسخ الدرس في الدفتر",
      details: "انسخ آيات الدرس بخط يدك الجميل في الدفتر 3 مرات",
      target: 3,
      current: 0,
      emoji: "✍️",
    }),

    // 5: مراجعة 3 دروس تجويد (الهدف: 3) - 3 أرقام عشوائية غير مكررة من 1 إلى 10
    () => {
      const numbers = getRandomItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3).sort((a, b) => a - b)
      return {
        id: "tajweed_3",
        title: "مراجعة 3 دروس تجويد",
        details: `راجع دروس التجويد ذات الأرقام: (${numbers.join(" ، ")})`,
        target: 3,
        current: 0,
        emoji: "🎙️",
      }
    },

    // 6: مراجعة 5 دروس تجويد (الهدف: 5) - 5 أرقام عشوائية غير مكررة من 1 إلى 10
    () => {
      const numbers = getRandomItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5).sort((a, b) => a - b)
      return {
        id: "tajweed_5",
        title: "مراجعة 5 دروس تجويد",
        details: `راجع دروس التجويد ذات الأرقام: (${numbers.join(" ، ")})`,
        target: 5,
        current: 0,
        emoji: "🎙️",
      }
    },

    // 7: مراجعة 3 دروس تفسير (الهدف: 3) - 3 أرقام عشوائية غير مكررة من 1 إلى 5
    () => {
      const numbers = getRandomItems([1, 2, 3, 4, 5], 3).sort((a, b) => a - b)
      return {
        id: "tafsir_3",
        title: "مراجعة 3 دروس تفسير",
        details: `راجع دروس التفسير ذات الأرقام: (${numbers.join(" ، ")})`,
        target: 3,
        current: 0,
        emoji: "📚",
      }
    },

    // 8: مراجعة 5 دروس تفسير (الهدف: 5) - اعرض الأرقام من 1 إلى 5 جميعها
    () => ({
      id: "tafsir_5",
      title: "مراجعة 5 دروس تفسير",
      details: "راجع دروس التفسير جميعها: (1 ، 2 ، 3 ، 4 ، 5)",
      target: 5,
      current: 0,
      emoji: "📚",
    }),
  ]

  const pickedGenerators = getRandomItems(taskPool, count)
  const tasks = pickedGenerators.map((gen, idx) => {
    const t = gen()
    return { ...t, id: `${t.id}_${idx}_${Date.now()}` }
  })

  return {
    isExempt: false,
    tasks,
  }
}