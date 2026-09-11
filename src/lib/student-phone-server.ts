import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Admin Supabase client
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Local JSON storage for fallback & resilience
const LOCAL_PHONES_PATH = path.join(process.cwd(), "src", "lib", "local-student-phones.json")

export function readLocalPhones(): Record<string, string> {
  try {
    if (fs.existsSync(LOCAL_PHONES_PATH)) {
      const content = fs.readFileSync(LOCAL_PHONES_PATH, "utf-8")
      return JSON.parse(content)
    }
  } catch (e) {
    console.error("Error reading local-student-phones.json:", e)
  }
  return {}
}

export function writeLocalPhones(data: Record<string, string>): void {
  try {
    fs.writeFileSync(LOCAL_PHONES_PATH, JSON.stringify(data, null, 2), "utf-8")
  } catch (e) {
    console.error("Error writing local-student-phones.json:", e)
  }
}

/**
 * Validates a guardian phone number.
 * Must be digits only, between 10 and 15 digits (e.g. 9627XXXXXXXX without plus or leading zeros).
 * Empty string is allowed (nullable).
 */
export function validateParentPhone(input: string): {
  isValid: boolean
  sanitized: string
  error?: string
} {
  if (!input || input.trim() === "") {
    return { isValid: true, sanitized: "" }
  }

  // Remove any whitespace, plus signs, hyphens, or parentheses
  const sanitized = input.replace(/\D/g, "")

  // Check if original had letters
  if (/[a-zA-Zء-ي]/.test(input)) {
    return {
      isValid: false,
      sanitized,
      error: "رقم الهاتف يجب أن يحتوي على أرقام فقط (لا يُسمح بالحروف أو الرموز)",
    }
  }

  if (sanitized.length < 10) {
    return {
      isValid: false,
      sanitized,
      error: "رقم الهاتف قصير جداً (يجب أن يتكون من 10 أرقام على الأقل متضمناً مفتاح الدولة مثل 962...)",
    }
  }

  if (sanitized.length > 15) {
    return {
      isValid: false,
      sanitized,
      error: "رقم الهاتف طويل جداً (الحد الأقصى 15 رقماً)",
    }
  }

  return { isValid: true, sanitized }
}

/**
 * Retrieves parent phone numbers for all students.
 * Merges Supabase profiles, auth user_metadata, and local fallback storage.
 */
export async function getAllStudentParentPhones(): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...readLocalPhones() }
  const supabase = getAdminClient()

  // 1. Try querying Supabase profiles table
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, phone, parent_phone")
      .eq("role", "student")

    if (!error && profiles) {
      for (const p of profiles) {
        const phoneVal = (p as any).parent_phone || p.phone
        if (phoneVal && typeof phoneVal === "string" && phoneVal.trim() !== "") {
          result[p.id] = phoneVal.trim().replace(/\D/g, "")
        }
      }
    }
  } catch (err) {
    try {
      const { data: profilesFallback } = await supabase
        .from("profiles")
        .select("id, phone")
        .eq("role", "student")

      if (profilesFallback) {
        for (const p of profilesFallback) {
          if (p.phone && typeof p.phone === "string" && p.phone.trim() !== "") {
            result[p.id] = p.phone.trim().replace(/\D/g, "")
          }
        }
      }
    } catch {}
  }

  // 2. Query Auth admin user_metadata for students
  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    if (authUsers && authUsers.users) {
      for (const u of authUsers.users) {
        const metaPhone = u.user_metadata?.parent_phone || u.user_metadata?.phone
        if (metaPhone && typeof metaPhone === "string" && metaPhone.trim() !== "") {
          result[u.id] = metaPhone.trim().replace(/\D/g, "")
        }
      }
    }
  } catch (e) {
    console.error("Failed to list auth users for parent phones:", e)
  }

  return result
}

/**
 * Updates the parent phone number for a single student across all persistent layers.
 */
export async function updateStudentParentPhone(
  studentId: string,
  rawPhone: string
): Promise<{ success: boolean; phone: string; error?: string }> {
  const validation = validateParentPhone(rawPhone)
  if (!validation.isValid) {
    return { success: false, phone: validation.sanitized, error: validation.error }
  }

  const phone = validation.sanitized
  const supabase = getAdminClient()

  // 1. Update local storage
  const local = readLocalPhones()
  if (phone) {
    local[studentId] = phone
  } else {
    delete local[studentId]
  }
  writeLocalPhones(local)

  // 2. Update Supabase Auth user_metadata
  try {
    await supabase.auth.admin.updateUserById(studentId, {
      user_metadata: {
        parent_phone: phone || null,
        phone: phone || null,
      },
    })
  } catch (e) {
    console.error("Failed to update auth user_metadata parent_phone:", e)
  }

  // 3. Try updating Supabase profiles table (parent_phone column)
  try {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ parent_phone: phone || null, phone: phone || null })
      .eq("id", studentId)

    if (profileErr) {
      await supabase
        .from("profiles")
        .update({ phone: phone || null })
        .eq("id", studentId)
    }
  } catch (e) {
    console.error("Failed to update profiles parent_phone:", e)
  }

  return { success: true, phone }
}

/**
 * Bulk updates parent phones for multiple students.
 */
export async function updateBulkStudentParentPhones(
  phonesMap: Record<string, string>
): Promise<{
  success: boolean
  updatedCount: number
  errors: Record<string, string>
}> {
  const errors: Record<string, string> = {}
  let updatedCount = 0

  for (const [studentId, rawPhone] of Object.entries(phonesMap)) {
    const res = await updateStudentParentPhone(studentId, rawPhone)
    if (!res.success && res.error) {
      errors[studentId] = res.error
    } else {
      updatedCount++
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    updatedCount,
    errors,
  }
}
