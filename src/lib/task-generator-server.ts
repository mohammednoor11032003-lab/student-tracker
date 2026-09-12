import { createClient } from "@supabase/supabase-js"
import { getTodayDateStr } from "./date-utils"
import { isBountyTask } from "./bounty-utils"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface TaskGenerationResult {
  date: string
  studentsCount: number
  tasksCount: number
  createdCount: number
  existingCount: number
  studentNames: string[]
  taskNames: string[]
}

/**
 * Ensures daily assignments exist for all students (or a specific subset) on a given date.
 * Guarantees that Saturday and any other day will have routine tasks properly assigned in Supabase.
 * Uses atomic UPSERT with ignoreDuplicates: true to be completely idempotent.
 */
export async function ensureDailyAssignmentsForAllStudents(
  targetDate?: string,
  targetStudentIds?: string[]
): Promise<TaskGenerationResult> {
  const supabase = getAdminClient()
  const dateStr = targetDate || getTodayDateStr()

  // 1. Fetch all student profiles
  let query = supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name")

  if (targetStudentIds && targetStudentIds.length > 0) {
    query = query.in("id", targetStudentIds)
  }

  const { data: students, error: studentsError } = await query
  if (studentsError) {
    console.error("Error fetching students for task generation:", studentsError)
    throw new Error("Failed to fetch students: " + studentsError.message)
  }

  const studentList = students || []
  if (studentList.length === 0) {
    return {
      date: dateStr,
      studentsCount: 0,
      tasksCount: 0,
      createdCount: 0,
      existingCount: 0,
      studentNames: [],
      taskNames: [],
    }
  }

  // 2. Fetch standard routine tasks
  // Routine daily tasks: السماع, الدرس, جنب الدرس, التفسير, المراجعة, قيام الليل
  // Exclude special / penalty / bounty / mystery tasks
  const { data: allTasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, name, points, emoji, description")
    .neq("name", "المهمة البديلة")
    .neq("name", "المهمة الأسبوعية المفاجئة")

  if (tasksError) {
    console.error("Error fetching tasks for daily assignments:", tasksError)
    throw new Error("Failed to fetch tasks: " + tasksError.message)
  }

  // Filter out any weekly bounties (points >= 10 and not regular daily)
  const routineTasks = (allTasks || []).filter(t => !isBountyTask(t))

  if (routineTasks.length === 0) {
    return {
      date: dateStr,
      studentsCount: studentList.length,
      tasksCount: 0,
      createdCount: 0,
      existingCount: 0,
      studentNames: studentList.map(s => s.full_name),
      taskNames: [],
    }
  }

  // 3. Check existing assignments for today to count existing vs new
  const studentIds = studentList.map(s => s.id)
  const { data: existingAssignments } = await supabase
    .from("daily_assignments")
    .select("student_id, task_id")
    .in("student_id", studentIds)
    .eq("assigned_date", dateStr)

  const existingSet = new Set(
    (existingAssignments || []).map(a => a.student_id + "_" + a.task_id)
  )

  const toInsert: {
    student_id: string
    task_id: string
    assigned_date: string
    completed: boolean
  }[] = []

  for (const student of studentList) {
    for (const task of routineTasks) {
      const key = student.id + "_" + task.id
      if (!existingSet.has(key)) {
        toInsert.push({
          student_id: student.id,
          task_id: task.id,
          assigned_date: dateStr,
          completed: false,
        })
      }
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("daily_assignments")
      .upsert(toInsert, {
        onConflict: "student_id,task_id,assigned_date",
        ignoreDuplicates: true,
      })

    if (insertError) {
      console.error("Error upserting daily assignments:", insertError)
      throw new Error("Failed to insert assignments: " + insertError.message)
    }
  }

  return {
    date: dateStr,
    studentsCount: studentList.length,
    tasksCount: routineTasks.length,
    createdCount: toInsert.length,
    existingCount: existingSet.size,
    studentNames: studentList.map(s => s.full_name),
    taskNames: routineTasks.map(t => t.name),
  }
}
