"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task, Profile } from "@/lib/types"
import toast from "react-hot-toast"

interface Assignment {
  id: string; student_id: string; task_id: string
  assigned_date: string; completed: boolean
  tasks: Task | null; profiles: { full_name: string } | null
}

export default function AssignTasks({ tasks, students, existingAssignments, today }: {
  tasks: Task[]; students: Profile[]
  existingAssignments: Assignment[]; today: string
}) {
  const supabase = createClient()
  const [selTasks, setSelTasks] = useState<string[]>([])
  const [selStudents, setSelStudents] = useState<string[]>([])
  const [assignments, setAssignments] = useState(existingAssignments)
  const [loading, setLoading] = useState(false)

  const toggle = <T,>(arr: T[], item: T) => arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]

  async function assign() {
    if (!selTasks.length) { toast.error("اختر مهمة واحدة على الأقل"); return }
    if (!selStudents.length) { toast.error("اختر طالباً واحداً على الأقل"); return }
    setLoading(true)
    const toInsert = []
    for (const sid of selStudents)
      for (const tid of selTasks)
        if (!assignments.find(a => a.student_id === sid && a.task_id === tid))
          toInsert.push({ student_id: sid, task_id: tid, assigned_date: today, completed: false })
    if (!toInsert.length) { toast("المهام معينة بالفعل لهؤلاء الطلاب"); setLoading(false); return }
    const { data, error } = await supabase.from("daily_assignments")
      .insert(toInsert).select("*, tasks(*), profiles(full_name)")
    if (error) { toast.error("حدث خطأ"); setLoading(false); return }
    setAssignments([...assignments, ...(data ?? [])])
    setSelTasks([]); setSelStudents([])
    toast.success(`تم تعيين ${toInsert.length} مهمة! ✅`)
    setLoading(false)
  }

  async function removeAssignment(id: string) {
    await supabase.from("daily_assignments").delete().eq("id", id)
    setAssignments(assignments.filter(a => a.id !== id))
    toast.success("تم الحذف")
  }

  const cardStyle = (selected: boolean) => ({
    width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.75rem 1rem", borderRadius: "0.75rem", cursor: "pointer",
    border: selected ? "2px solid #7c3aed" : "2px solid #e5e7eb",
    background: selected ? "#f3e8ff" : "white", transition: "all 0.15s", textAlign: "right" as const
  })

  const TASK_ORDER = [
    "السماع",
    "الدرس",
    "جنب الدرس",
    "التفسير",
    "المراجعة",
    "قيام الليل",
    "الغياب",
    "الحضور بدون حفظ الدرس",
    "الحضور بدون حفظ",
  ]
  const sortedTasks = [...tasks].sort((a, b) => {
    const idxA = TASK_ORDER.indexOf(a.name)
    const idxB = TASK_ORDER.indexOf(b.name)
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99)
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>📋 اختر المهام</h2>
          {sortedTasks.length === 0 ? <p style={{ color: "#9ca3af" }}>أضف مهاماً أولاً</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "300px", overflowY: "auto" }}>
              {sortedTasks.map(task => (
                <button key={task.id} onClick={() => setSelTasks(toggle(selTasks, task.id))}
                  style={cardStyle(selTasks.includes(task.id))}>
                  <span style={{ fontSize: "1.75rem" }}>{task.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{task.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#d97706", margin: 0 }}>{task.points} ⭐</p>
                  </div>
                  {selTasks.includes(task.id) && <span style={{ color: "#7c3aed", fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontWeight: 700, margin: 0 }}>👨‍🎓 اختر الطلاب</h2>
            <button onClick={() => setSelStudents(selStudents.length === students.length ? [] : students.map(s => s.id))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontWeight: 700, fontSize: "0.85rem" }}>
              {selStudents.length === students.length ? "إلغاء الكل" : "تحديد الكل"}
            </button>
          </div>
          {students.length === 0 ? <p style={{ color: "#9ca3af" }}>لا طلاب</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {students.map(s => (
                <button key={s.id} onClick={() => setSelStudents(toggle(selStudents, s.id))}
                  style={cardStyle(selStudents.includes(s.id))}>
                  <span style={{ fontSize: "1.5rem" }}>👦</span>
                  <span style={{ fontWeight: 700, flex: 1 }}>{s.full_name}</span>
                  {selStudents.includes(s.id) && <span style={{ color: "#7c3aed", fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button onClick={assign} disabled={loading} className="btn-primary"
        style={{ fontSize: "1.05rem", padding: "1rem", opacity: loading ? 0.7 : 1 }}>
        {loading ? "...جاري التعيين" : `🚀 تعيين ${selTasks.length} مهمة لـ ${selStudents.length} طالب`}
      </button>

      <div className="card">
        <h2 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>📌 مهام اليوم ({assignments.length})</h2>
        {assignments.length === 0 ? <p style={{ color: "#9ca3af", textAlign: "center", padding: "1.5rem 0" }}>لا مهام معينة اليوم بعد</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "350px", overflowY: "auto" }}>
            {assignments.map(a => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.75rem", borderRadius: "0.75rem",
                background: a.completed ? "#f0fdf4" : "#f9fafb"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>{a.tasks?.emoji}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>{a.profiles?.full_name}</p>
                    <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>{a.tasks?.name}</p>
                  </div>
                </div>
                {a.completed ? <span style={{ color: "#16a34a", fontSize: "0.85rem" }}>✅ مكتمل</span> : (
                  <button onClick={() => removeAssignment(a.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: "1.1rem" }}>🗑️</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
