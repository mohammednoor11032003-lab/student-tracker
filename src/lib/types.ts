export type Role = "teacher" | "student" | "parent"
export interface Profile {
  id: string
  full_name: string
  role: Role
  phone?: string
  student_id?: string
  created_at: string
}
export interface Task {
  id: string
  name: string
  description?: string
  points: number
  emoji: string
  created_by: string
  created_at: string
}
export interface DailyAssignment {
  id: string
  student_id: string
  task_id: string
  assigned_date: string
  completed: boolean
  completed_at?: string
  tasks?: Task
  profiles?: { full_name: string }
}
export interface WeeklySummary {
  id: string
  student_id: string
  week_start: string
  week_end: string
  total_points: number
  tasks_completed: number
  profiles?: { full_name: string }
}
export interface MonthlySummary {
  id: string
  student_id: string
  month: number
  year: number
  total_points: number
  tasks_completed: number
  profiles?: { full_name: string }
}
