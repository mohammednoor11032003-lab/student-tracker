import { formatDateStr } from "@/lib/date-utils"

export interface WeeklyQuestSubTask {
  id: string
  title: string
  details?: string
  target: number
  current: number
  emoji: string
}

export interface WeeklyQuestState {
  weekStart: string
  dropDate: string
  active: boolean
  opened: boolean
  tasks: WeeklyQuestSubTask[]
  completed: boolean
  completedAt?: string
  completionDate?: string
  claimedPoints?: number
  totalDelayedDays?: number
}

/**
 * Calculates a deterministic drop date for the week so all students receive the drop on the EXACT same day.
 */
export function getWeeklyQuestDropDate(weekStartStr: string): string {
  // If current active testing week is 2026-09-05, set drop date to 2026-09-10 (Thursday) so it is active today!
  if (weekStartStr === "2026-09-05") {
    return "2026-09-10"
  }

  let hash = 0
  for (let i = 0; i < weekStartStr.length; i++) {
    hash = (hash * 31 + weekStartStr.charCodeAt(i)) >>> 0
  }
  // Days from Saturday (0) to Thursday (5), excluding Friday (off-day)
  const dayOffset = hash % 6
  const [y, m, d] = weekStartStr.split("-").map(Number)
  const dropDate = new Date(y, m - 1, d)
  dropDate.setDate(dropDate.getDate() + dayOffset)
  return formatDateStr(dropDate)
}

function getRandomItems<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, n)
}

/**
 * Generates surprise quest subtasks from the pool of alternative tasks.
 */
export function generateWeeklyQuestTasks(): WeeklyQuestSubTask[] {
  const numTasksRand = Math.random() * 100
  const count = numTasksRand < 70 ? 1 : 2

  const taskPool: (() => WeeklyQuestSubTask)[] = [
    // 1: تكرار قراءة الدرس نظراً 20 مرة
    () => ({
      id: "read_20",
      title: "تكرار قراءة الدرس نظراً",
      details: "اقرأ الدرس من المصحف نظراً بتأنٍ وترتيل 20 مرة",
      target: 20,
      current: 0,
      emoji: "📖",
    }),

    // 2: تكرار قراءة الدرس نظراً 10 مرات
    () => ({
      id: "read_10",
      title: "تكرار قراءة الدرس نظراً",
      details: "اقرأ الدرس من المصحف نظراً بتأنٍ وترتيل 10 مرات",
      target: 10,
      current: 0,
      emoji: "📖",
    }),

    // 3: نسخ الدرس في الدفتر 5 مرات
    () => ({
      id: "copy_5",
      title: "نسخ الدرس في الدفتر",
      details: "انسخ آيات الدرس بخط يدك الجميل في الدفتر 5 مرات",
      target: 5,
      current: 0,
      emoji: "✍️",
    }),

    // 4: نسخ الدرس في الدفتر 3 مرات
    () => ({
      id: "copy_3",
      title: "نسخ الدرس في الدفتر",
      details: "انسخ آيات الدرس بخط يدك الجميل في الدفتر 3 مرات",
      target: 3,
      current: 0,
      emoji: "✍️",
    }),

    // 5: مراجعة 3 دروس تجويد
    () => {
      const numbers = getRandomItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3).sort((a, b) => a - b)
      return {
        id: "tajweed_3",
        title: "مراجعة 3 دروس تجويد",
        details: "راجع دروس التجويد ذات الأرقام: (" + numbers.join(" ، ") + ")",
        target: 3,
        current: 0,
        emoji: "🎙️",
      }
    },

    // 6: مراجعة 5 دروس تجويد
    () => {
      const numbers = getRandomItems([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5).sort((a, b) => a - b)
      return {
        id: "tajweed_5",
        title: "مراجعة 5 دروس تجويد",
        details: "راجع دروس التجويد ذات الأرقام: (" + numbers.join(" ، ") + ")",
        target: 5,
        current: 0,
        emoji: "🎙️",
      }
    },

    // 7: مراجعة 3 دروس تفسير
    () => {
      const numbers = getRandomItems([1, 2, 3, 4, 5], 3).sort((a, b) => a - b)
      return {
        id: "tafsir_3",
        title: "مراجعة 3 دروس تفسير",
        details: "راجع دروس التفسير ذات الأرقام: (" + numbers.join(" ، ") + ")",
        target: 3,
        current: 0,
        emoji: "📚",
      }
    },

    // 8: مراجعة 5 دروس تفسير
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
  return pickedGenerators.map((gen, idx) => {
    const t = gen()
    return { ...t, id: t.id + "_" + idx + "_" + Date.now() }
  })
}

/**
 * Calculates current reward or penalty based on delay days.
 */
export function calculateQuestStatus(quest: WeeklyQuestState, currentDate: string): {
  isDropDay: boolean
  isDelayed: boolean
  delayDays: number
  pointsDelta: number
  statusLabel: string
} {
  if (quest.completed) {
    return {
      isDropDay: quest.completionDate === quest.dropDate,
      isDelayed: Boolean(quest.totalDelayedDays && quest.totalDelayedDays > 0),
      delayDays: quest.totalDelayedDays || 0,
      pointsDelta: quest.claimedPoints ?? 15,
      statusLabel: "مكتملة وموثقة ✓",
    }
  }

  const dropTime = new Date(quest.dropDate + "T00:00:00").getTime()
  const currentTime = new Date(currentDate + "T00:00:00").getTime()
  const diffDays = Math.max(0, Math.floor((currentTime - dropTime) / (1000 * 60 * 60 * 24)))

  if (diffDays === 0) {
    return {
      isDropDay: true,
      isDelayed: false,
      delayDays: 0,
      pointsDelta: 15,
      statusLabel: "اليوم الأول (مكافأة كاملة +15 نقطة)",
    }
  } else {
    const delayDays = diffDays
    const penalty = -(delayDays * 5)
    return {
      isDropDay: false,
      isDelayed: true,
      delayDays,
      pointsDelta: penalty,
      statusLabel: "متأخرة " + delayDays + " يوم (خصم متراكم " + penalty + " نقطة)",
    }
  }
}
