import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

export * from "./manual-consolidation-utils"
import {
  ManualConsolidation,
  parseResumePointer,
  countWorkingDays,
  calculateEndDateForWorkingDays,
  getWorkingDayIndex,
  isFridayDate,
} from "./manual-consolidation-utils"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Local fallback store to ensure seamless offline/local development without Supabase table dependencies
const LOCAL_STORAGE_PATH = path.join(process.cwd(), "src", "lib", "local-manual-consolidations.json")

function readLocalConsolidations(): ManualConsolidation[] {
  try {
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const content = fs.readFileSync(LOCAL_STORAGE_PATH, "utf-8")
      return JSON.parse(content) || []
    }
  } catch (err) {
    console.error("Error reading local-manual-consolidations.json:", err)
  }
  return []
}

function writeLocalConsolidations(items: ManualConsolidation[]) {
  try {
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(items, null, 2), "utf-8")
  } catch (err) {
    console.error("Error writing local-manual-consolidations.json:", err)
  }
}

/**
 * Fetch all active and upcoming manual consolidations for a student (where end_date >= currentDateStr),
 * ordered ascending by start_date so the student sees their active and future scheduled plans.
 */
export async function getStudentActiveAndUpcomingConsolidations(
  studentId: string,
  currentDateStr: string
): Promise<ManualConsolidation[]> {
  const supabase = getAdminClient()

  try {
    const { data, error } = await supabase
      .from("manual_consolidations")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_active", true)
      .gte("end_date", currentDateStr)
      .order("start_date", { ascending: true })

    if (!error && data) {
      return data.map(normalizeConsolidation)
    }
  } catch {
    // Fallback to local store
  }

  const localList = readLocalConsolidations()
  return localList
    .filter(c => c.student_id === studentId && c.is_active && c.end_date >= currentDateStr)
    .map(normalizeConsolidation)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
}

/**
 * Checks if a student has an active manual consolidation covering the target date.
 * Searches across the full student consolidations array using .find().
 */
export async function getActiveManualConsolidation(
  studentId: string,
  dateStr: string
): Promise<ManualConsolidation | null> {
  const list = await getStudentActiveAndUpcomingConsolidations(studentId, dateStr)
  const match = list.find(c => c.is_active && dateStr >= c.start_date && dateStr <= c.end_date)
  return match || null
}

/**
 * Fetch all manual consolidations for a student (for teacher view/management).
 */
export async function getStudentManualConsolidations(
  studentId: string
): Promise<ManualConsolidation[]> {
  const supabase = getAdminClient()

  try {
    const { data, error } = await supabase
      .from("manual_consolidations")
      .select("*")
      .eq("student_id", studentId)
      .order("start_date", { ascending: false })

    if (!error && data) {
      return data.map(normalizeConsolidation)
    }
  } catch {
    // Fallback
  }

  const localList = readLocalConsolidations()
  return localList
    .filter(c => c.student_id === studentId)
    .map(normalizeConsolidation)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
}

export function normalizeConsolidation(raw: any): ManualConsolidation {
  const start_page = Number(raw.start_page) || 1
  const end_page = Number(raw.end_page) || 20
  const daily_pages_count = Number(raw.daily_pages_count) || 4
  const harvest_days_count = Number(raw.harvest_days_count) || 1

  return {
    id: raw.id,
    student_id: raw.student_id,
    start_page,
    end_page,
    daily_pages_count,
    start_date: raw.start_date,
    end_date: raw.end_date,
    include_fridays: Boolean(raw.include_fridays),
    has_harvest_day: Boolean(raw.has_harvest_day),
    harvest_days_count: Math.min(3, Math.max(1, harvest_days_count)),
    resume_page_pointer: raw.resume_page_pointer || "ص 1 النصف العلوي",
    pages_description: raw.pages_description || `من ص ${start_page} إلى ص ${end_page}`,
    repetitions_count: Number(raw.repetitions_count) || 5,
    is_active: raw.is_active ?? true,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

/**
 * Save or update a manual consolidation record.
 */
export async function saveManualConsolidation(
  record: Partial<ManualConsolidation> & { student_id: string; start_date: string; end_date: string }
): Promise<ManualConsolidation> {
  const supabase = getAdminClient()
  const now = new Date().toISOString()
  const id = record.id || `mc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const start_page = Number(record.start_page) || 1
  const end_page = Number(record.end_page) || 20
  const daily_pages_count = Number(record.daily_pages_count) || 4
  const harvest_days_count = Math.min(3, Math.max(1, Number(record.harvest_days_count) || 1))

  const fullRecord: ManualConsolidation = {
    id,
    student_id: record.student_id,
    start_page,
    end_page,
    daily_pages_count,
    start_date: record.start_date,
    end_date: record.end_date,
    include_fridays: Boolean(record.include_fridays),
    has_harvest_day: Boolean(record.has_harvest_day),
    harvest_days_count,
    resume_page_pointer: record.resume_page_pointer || "ص 1 النصف العلوي",
    pages_description: record.pages_description || `من ص ${start_page} إلى ص ${end_page}`,
    repetitions_count: Number(record.repetitions_count) || 5,
    is_active: record.is_active ?? true,
    created_at: record.created_at || now,
    updated_at: now,
  }

  // 1. Try Supabase
  try {
    await supabase.from("manual_consolidations").upsert(fullRecord)
  } catch (err) {
    console.warn("Supabase upsert failed for manual_consolidations, saving locally:", err)
  }

  // 2. Always persist to local store
  const localList = readLocalConsolidations()
  const existingIdx = localList.findIndex(c => c.id === id)
  if (existingIdx >= 0) {
    localList[existingIdx] = { ...localList[existingIdx], ...fullRecord, updated_at: now }
  } else {
    localList.unshift(fullRecord)
  }
  writeLocalConsolidations(localList)

  return fullRecord
}

/**
 * Cancel / deactivate a manual consolidation record.
 */
export async function cancelManualConsolidation(id: string): Promise<boolean> {
  const supabase = getAdminClient()

  try {
    await supabase
      .from("manual_consolidations")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
  } catch {}

  const localList = readLocalConsolidations()
  const target = localList.find(c => c.id === id)
  if (target) {
    target.is_active = false
    target.updated_at = new Date().toISOString()
    writeLocalConsolidations(localList)
    return true
  }
  return false
}

/**
 * Delete a manual consolidation record permanently.
 */
export async function deleteManualConsolidation(id: string): Promise<boolean> {
  const supabase = getAdminClient()

  try {
    await supabase
      .from("manual_consolidations")
      .delete()
      .eq("id", id)
  } catch {}

  const localList = readLocalConsolidations()
  const filtered = localList.filter(c => c.id !== id)
  writeLocalConsolidations(filtered)
  return true
}

/**
 * Enforces the resume_page_pointer for a student when a consolidation has completed (end_date < todayStr).
 * Guarantees that the student's base plan on end_date + 1 starts EXACTLY at resume_page_pointer.
 */
export async function enforceStudentResumePointer(studentId: string, todayStr: string): Promise<boolean> {
  try {
    const consolidations = await getStudentManualConsolidations(studentId)
    // Find active consolidations whose end_date is in the past (completed)
    const endedList = consolidations
      .filter(c => c.is_active && c.end_date < todayStr)
      .sort((a, b) => b.end_date.localeCompare(a.end_date))

    if (endedList.length > 0) {
      const mostRecentEnded = endedList[0]
      let planUpdated = false

      if (mostRecentEnded.resume_page_pointer) {
        const { page, part } = parseResumePointer(mostRecentEnded.resume_page_pointer)
        const { getStudentPlan, updateStudentPlan } = await import("@/lib/student-plan")
        const current = await getStudentPlan(studentId)

        if (current.current_page !== page || current.page_part !== part) {
          console.log(`[ManualConsolidation] Precision resume pointer enforced for student ${studentId}: ص ${page} ${part} (resumption from ended consolidation ${mostRecentEnded.id})`)
          await updateStudentPlan(studentId, {
            current_page: page,
            page_part: part,
            is_in_consolidation: false,
          })
          planUpdated = true
        }
      }

      // Mark all past ended consolidations as inactive so they don't trigger repeatedly
      for (const ended of endedList) {
        await cancelManualConsolidation(ended.id)
      }

      return planUpdated
    }
  } catch (err) {
    console.error("Error in enforceStudentResumePointer:", err)
  }
  return false
}
