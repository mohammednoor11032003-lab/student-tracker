export const ARABIC_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
export const WEEK_NAMES = ["الأول", "الثاني", "الثالث", "الرابع"]

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

export function getMonthFirstSaturday(year: number, month: number): Date {
  const d1 = new Date(year, month - 1, 1)
  const dayOfWeek = d1.getDay()
  let offset = 0
  if (dayOfWeek === 6) offset = 0
  else if (dayOfWeek <= 2) offset = -(dayOfWeek + 1)
  else offset = (6 - dayOfWeek)
  
  const sat = new Date(year, month - 1, 1)
  sat.setDate(sat.getDate() + offset)
  return sat
}

export function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
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
    return formatDateStr(d)
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


export function getWeekAndMonthInfo(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const target = new Date(y, m - 1, d)

  for (const candM of [m - 1, m, m + 1]) {
    let checkY = y
    let checkM = candM
    if (checkM < 1) { checkM = 12; checkY-- }
    if (checkM > 12) { checkM = 1; checkY++ }

    const sat1 = getMonthFirstSaturday(checkY, checkM)
    for (let w = 1; w <= 4; w++) {
      const wStart = new Date(sat1)
      wStart.setDate(wStart.getDate() + (w - 1) * 7)
      const wEnd = new Date(wStart)
      wEnd.setDate(wEnd.getDate() + 6)

      if (target >= wStart && target <= wEnd) {
        return {
          year: checkY,
          month: checkM,
          weekNum: w,
          weekStart: wStart,
          weekEnd: wEnd,
        }
      }
    }
  }

  return { year: y, month: m, weekNum: 4, weekStart: target, weekEnd: target }
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