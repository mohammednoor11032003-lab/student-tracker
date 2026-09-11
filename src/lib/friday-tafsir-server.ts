import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import {
  FridayTafsirTaskState,
  DEFAULT_FRIDAY_TAFSIR_STATE,
  calculateFridayTafsirTotal,
  qualifiesForFridayGems,
} from "./friday-tafsir-utils"
import { getWeekAndMonthInfo, formatDateStr } from "./date-utils"

const LOCAL_STORE_PATH = path.join(process.cwd(), "src", "lib", "local-friday-tafsir.json")

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function readLocalStore(): Record<string, FridayTafsirTaskState> {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const data = fs.readFileSync(LOCAL_STORE_PATH, "utf-8")
      return JSON.parse(data) || {}
    }
  } catch (err) {
    console.error("Error reading local-friday-tafsir.json:", err)
  }
  return {}
}

function writeLocalStore(store: Record<string, FridayTafsirTaskState>) {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf-8")
  } catch (err) {
    console.error("Error writing local-friday-tafsir.json:", err)
  }
}

function getStoreKey(studentId: string, dateStr: string): string {
  return `${studentId}_${dateStr}`
}

/**
 * Get the Friday Tafsir task state for a student on a specific date
 */
export async function getFridayTafsirState(
  studentId: string,
  dateStr: string
): Promise<FridayTafsirTaskState> {
  const store = readLocalStore()
  const key = getStoreKey(studentId, dateStr)
  if (store[key]) {
    return { ...DEFAULT_FRIDAY_TAFSIR_STATE, ...store[key] }
  }

  // Check Supabase daily_assignments if exists
  const supabase = getAdminClient()
  try {
    const { data: assignments } = await supabase
      .from("daily_assignments")
      .select("*, tasks(name, points)")
      .eq("student_id", studentId)
      .eq("assigned_date", dateStr)

    if (assignments && assignments.length > 0) {
      const attendance = assignments.find(a => a.tasks?.name?.includes("حضور التفسير") || a.tasks?.name?.includes("حضور الجمعة"))
      const hw = assignments.find(a => a.tasks?.name?.includes("واجب التفسير") || a.tasks?.name?.includes("حل الواجب"))
      const inter = assignments.find(a => a.tasks?.name?.includes("تفاعل التفسير") || a.tasks?.name?.includes("التفاعل"))

      if (attendance || hw || inter) {
        const state: FridayTafsirTaskState = {
          attendance: {
            completed: Boolean(attendance?.completed),
            points: 10,
          },
          homework: {
            completed: Boolean(hw?.completed),
            score: hw?.completed ? (hw.tasks?.points || 0) : 0,
          },
          interaction: {
            completed: Boolean(inter?.completed),
            score: inter?.completed ? (inter.tasks?.points || 0) : 0,
          },
          gemsAwarded: false,
          totalPoints: 0,
        }
        state.totalPoints = calculateFridayTafsirTotal(state)
        state.gemsAwarded = qualifiesForFridayGems(state)
        return state
      }
    }
  } catch (err) {
    console.error("Error fetching Friday tafsir assignments:", err)
  }

  return { ...DEFAULT_FRIDAY_TAFSIR_STATE }
}

/**
 * Update Friday Tafsir task state and reflect point deltas into weekly and monthly summaries
 */
export async function updateFridayTafsirState(
  studentId: string,
  dateStr: string,
  updates: Partial<FridayTafsirTaskState>
): Promise<{ success: boolean; state: FridayTafsirTaskState; deltaPoints: number; awardedGems: boolean }> {
  const store = readLocalStore()
  const key = getStoreKey(studentId, dateStr)
  const previousState: FridayTafsirTaskState = store[key] || (await getFridayTafsirState(studentId, dateStr))

  const prevTotal = calculateFridayTafsirTotal(previousState)

  const newState: FridayTafsirTaskState = {
    ...previousState,
    ...updates,
    attendance: updates.attendance ? { ...previousState.attendance, ...updates.attendance } : previousState.attendance,
    homework: updates.homework ? { ...previousState.homework, ...updates.homework } : previousState.homework,
    interaction: updates.interaction ? { ...previousState.interaction, ...updates.interaction } : previousState.interaction,
    updatedAt: new Date().toISOString(),
  }

  const newTotal = calculateFridayTafsirTotal(newState)
  newState.totalPoints = newTotal
  const deltaPoints = newTotal - prevTotal

  // Check if student now qualifies for the 10 gems bonus
  let awardedGems = false
  if (qualifiesForFridayGems(newState) && !previousState.gemsAwarded) {
    newState.gemsAwarded = true
    awardedGems = true
  }

  // Save to local persistence
  store[key] = newState
  writeLocalStore(store)

  // Update Supabase summaries and hero gems if deltaPoints !== 0 or gems awarded
  const supabase = getAdminClient()
  const weekInfo = getWeekAndMonthInfo(dateStr)
  const weekStartStr = formatDateStr(weekInfo.weekStart)
  const weekEndStr = formatDateStr(weekInfo.weekEnd)
  const month = weekInfo.month
  const year = weekInfo.year

  try {
    if (deltaPoints !== 0) {
      // 1. Weekly summary
      const { data: existingWeekly } = await supabase
        .from("weekly_summaries")
        .select("id, total_points, tasks_completed")
        .eq("student_id", studentId)
        .eq("week_start", weekStartStr)
        .single()

      if (existingWeekly) {
        await supabase
          .from("weekly_summaries")
          .update({
            total_points: existingWeekly.total_points + deltaPoints,
          })
          .eq("id", existingWeekly.id)
      } else {
        await supabase.from("weekly_summaries").insert({
          student_id: studentId,
          week_start: weekStartStr,
          week_end: weekEndStr,
          total_points: deltaPoints,
          tasks_completed: 1,
        })
      }

      // 2. Monthly summary
      const { data: existingMonthly } = await supabase
        .from("monthly_summaries")
        .select("id, total_points, tasks_completed")
        .eq("student_id", studentId)
        .eq("month", month)
        .eq("year", year)
        .single()

      if (existingMonthly) {
        await supabase
          .from("monthly_summaries")
          .update({
            total_points: existingMonthly.total_points + deltaPoints,
          })
          .eq("id", existingMonthly.id)
      } else {
        await supabase.from("monthly_summaries").insert({
          student_id: studentId,
          month,
          year,
          total_points: deltaPoints,
          tasks_completed: 1,
        })
      }
    }

    // 3. Award gems if qualified
    if (awardedGems) {
      try {
        const { updateStudentHeroState, getStudentHeroState } = await import("./hero-utils")
        const heroState = await getStudentHeroState(studentId)
        await updateStudentHeroState(studentId, {
          gems_balance: heroState.gems_balance + 10,
        })
      } catch (gemErr) {
        console.error("Error updating hero state with Friday gems:", gemErr)
      }
    }
  } catch (dbErr) {
    console.error("Error updating database summaries for Friday Tafsir:", dbErr)
  }

  return { success: true, state: newState, deltaPoints, awardedGems }
}
