import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

export interface ManualConsolidation {
  id: string
  student_id: string
  start_page: number
  end_page: number
  daily_pages_count: number
  start_date: string
  end_date: string
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
 * Checks if a student has an active manual consolidation covering the target date.
 */
export async function getActiveManualConsolidation(
  studentId: string,
  dateStr: string
): Promise<ManualConsolidation | null> {
  const supabase = getAdminClient()

  try {
    const { data, error } = await supabase
      .from("manual_consolidations")
      .select("*")
      .eq("student_id", studentId)
      .eq("is_active", true)
      .lte("start_date", dateStr)
      .gte("end_date", dateStr)
      .order("created_at", { ascending: false })
      .limit(1)

    if (!error && data && data.length > 0) {
      return normalizeConsolidation(data[0])
    }
  } catch {
    // Fallback to local store
  }

  // Fallback to local storage
  const localList = readLocalConsolidations()
  const match = localList.find(
    c =>
      c.student_id === studentId &&
      c.is_active &&
      c.start_date <= dateStr &&
      c.end_date >= dateStr
  )
  return match ? normalizeConsolidation(match) : null
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

function normalizeConsolidation(raw: any): ManualConsolidation {
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
