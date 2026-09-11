// Utility types and helpers for Friday Tafsir Day Tasks (يوم التفسير الأسبوعي)

export interface FridayTafsirTaskState {
  attendance: {
    completed: boolean
    points: number
  }
  homework: {
    completed: boolean
    score: number // 0 to 30
  }
  interaction: {
    completed: boolean
    score: number // 0 to 30
  }
  gemsAwarded: boolean
  totalPoints: number
  updatedAt?: string
}

export const DEFAULT_FRIDAY_TAFSIR_STATE: FridayTafsirTaskState = {
  attendance: {
    completed: false,
    points: 10,
  },
  homework: {
    completed: false,
    score: 0,
  },
  interaction: {
    completed: false,
    score: 0,
  },
  gemsAwarded: false,
  totalPoints: 0,
}

/**
 * Validate homework or interaction score (must be integer between 0 and 30)
 */
export function validateScore(val: unknown): { valid: boolean; score: number; error?: string } {
  const num = typeof val === "number" ? val : parseInt(String(val), 10)
  if (isNaN(num)) {
    return { valid: false, score: 0, error: "الرجاء إدخال رقم صحيح بين 0 و 30" }
  }
  if (num < 0 || num > 30) {
    return { valid: false, score: 0, error: "الدرجة يجب أن تكون بين 0 و 30 فقط" }
  }
  return { valid: true, score: Math.floor(num) }
}

/**
 * Calculate total points earned in Friday Tafsir tasks
 */
export function calculateFridayTafsirTotal(state: Partial<FridayTafsirTaskState>): number {
  let total = 0
  if (state.attendance?.completed) {
    total += 10
  }
  if (state.homework?.completed) {
    total += Math.max(0, Math.min(30, state.homework.score || 0))
  }
  if (state.interaction?.completed) {
    total += Math.max(0, Math.min(30, state.interaction.score || 0))
  }
  return total
}

/**
 * Check if the student achieved the perfect score of 70 to qualify for the 10 gems bonus
 */
export function qualifiesForFridayGems(state: Partial<FridayTafsirTaskState>): boolean {
  const total = calculateFridayTafsirTotal(state)
  return total === 70
}
