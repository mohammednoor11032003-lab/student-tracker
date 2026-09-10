export interface BountyTask {
  id: string
  name: string
  description: string
  points: number
  gems: number
  emoji: string
  target: number
  unit?: string
  details?: string
  created_by?: string
  created_at?: string
}

export interface BountyProgress {
  taskId: string
  accepted: boolean
  acceptedAt?: string
  current: number
  target: number
  completed: boolean
  completedAt?: string
}

/**
 * Checks if a task is an optional bounty challenge.
 */
export function isBountyTask(task: { name: string; description?: string | null }): boolean {
  if (!task.description) return false
  if (task.description.includes('"isBounty":true') || task.description.includes('"isBounty": true')) return true
  if (task.description.startsWith("[BOUNTY]")) return true
  return false
}

/**
 * Parses raw task object into a structured BountyTask.
 */
export function parseBountyTask(task: {
  id: string
  name: string
  description?: string | null
  points: number
  emoji: string
  created_by?: string
  created_at?: string
}): BountyTask {
  let target = 1
  let unit = "مرات"
  let details = task.description || ""
  let gems = Math.max(10, Math.round(task.points * 0.4))

  if (task.description) {
    try {
      const parsed = JSON.parse(task.description)
      if (typeof parsed === "object" && parsed !== null) {
        if (parsed.target) target = Number(parsed.target) || 1
        if (parsed.unit) unit = String(parsed.unit)
        if (parsed.details) details = String(parsed.details)
        if (parsed.gems) gems = Number(parsed.gems)
      }
    } catch {
      // not JSON, fallback to raw text
    }
  }

  return {
    id: task.id,
    name: task.name,
    description: task.description || "",
    points: task.points,
    gems,
    emoji: task.emoji || "🏆",
    target,
    unit,
    details,
    created_by: task.created_by,
    created_at: task.created_at,
  }
}

/**
 * Deterministically select 3 bounties from the pool for the given weekStartStr.
 * All students in that calendar week will see the EXACT same 3 challenges.
 */
export function getWeeklyBounties(weekStartStr: string, pool: BountyTask[]): BountyTask[] {
  if (!pool || pool.length === 0) return []
  if (pool.length <= 3) return [...pool]

  // Deterministic seed based on weekStartStr
  let seed = 0
  for (let i = 0; i < weekStartStr.length; i++) {
    seed = (seed * 31 + weekStartStr.charCodeAt(i)) >>> 0
  }

  // Linear Congruential Generator (LCG)
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  // Clone and shuffle using seeded random
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, 3)
}
