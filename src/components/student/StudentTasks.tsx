"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"
import toast from "react-hot-toast"

interface Assignment {
  id: string; student_id: string; task_id: string; completed: boolean
  tasks: Task | null
}

export default function StudentTasks({ assignments: init, studentId, studentName, weeklyPoints }: {
  assignments: Assignment[]; studentId: string; studentName: string; weeklyPoints: number
}) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState(init)
  const [points, setPoints] = useState(weeklyPoints)
  const [loading, setLoading] = useState<string | null>(null)

  const done = assignments.filter(a => a.completed)
  const pending = assignments.filter(a => !a.completed)
  const positiveAssignments = assignments.filter(a => (a.tasks?.points ?? 0) >= 0)
  const progress = positiveAssignments.length ? Math.round((positiveAssignments.filter(a => a.completed).length / positiveAssignments.length) * 100) : 0

  const isNegative = (a: Assignment) => (a.tasks?.points ?? 0) < 0

  async function complete(a: Assignment) {
    if (a.completed || loading) return
    setLoading(a.id)
    const { error } = await supabase.from("daily_assignments")
      .update({ completed: true, completed_at: new Date().toISOString() }).eq("id", a.id)
    if (error) { toast.error("حدث خطأ ❌"); setLoading(null); return }
    await fetch("/api/complete-task", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: a.id, studentId, taskId: a.task_id, points: a.tasks?.points ?? 0 })
    })
    setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, completed: true } : x))
    setPoints(prev => prev + (a.tasks?.points ?? 0))
    const pts = a.tasks?.points ?? 0
    if (pts < 0) {
      toast(`تم تسجيل ${pts} نقطة`, { icon: "⚠️", duration: 3000 })
    } else {
      toast.success(`🎉 رائع! كسبت ${pts} نقطة!`, { duration: 3000 })
    }
    setLoading(null)
  }

  const regularTasks = [...pending, ...done].filter(a => !isNegative(a))
  const penaltyTasks = [...pending, ...done].filter(a => isNegative(a))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "white", margin: 0 }}>أهلاً {studentName}! 👋</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", marginTop: "0.25rem" }}>مهامك لليوم</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        {[
          { val: points, label: "نقاط الأسبوع ⭐" },
          { val: done.filter(a => !isNegative(a)).length, label: "مكتملة ✅" },
          { val: pending.filter(a => !isNegative(a)).length, label: "متبقية ⏳" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: "1rem", padding: "1rem", textAlign: "center", color: "white" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 900 }}>{s.val}</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar - only for positive tasks */}
      {positiveAssignments.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "1rem", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "white", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            <span>التقدم في المهام</span><span>{progress}%</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.3)", borderRadius: "9999px", height: "1rem" }}>
            <div style={{ background: "white", borderRadius: "9999px", height: "1rem", width: `${progress}%`, transition: "width 0.5s ease" }} />
          </div>
          {progress === 100 && <p style={{ textAlign: "center", color: "white", fontWeight: 700, marginTop: "0.5rem" }}>🎊 أكملت كل المهام! عظيم!</p>}
        </div>
      )}

      {/* Regular tasks */}
      {assignments.length === 0 ? (
        <div style={{ background: "white", borderRadius: "1.5rem", padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>😴</div>
          <p style={{ color: "#9ca3af", fontSize: "1.1rem" }}>لا مهام اليوم</p>
        </div>
      ) : (
        <>
          {regularTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h2 style={{ color: "white", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>📋 المهام اليومية</h2>
              {regularTasks.map(a => (
                <button key={a.id} onClick={() => complete(a)} disabled={a.completed || loading === a.id}
                  style={{
                    width: "100%", background: a.completed ? "rgba(255,255,255,0.5)" : "white",
                    border: "none", borderRadius: "1rem", padding: "1rem", cursor: a.completed ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: "1rem",
                    boxShadow: a.completed ? "none" : "0 4px 15px rgba(0,0,0,0.1)",
                    transition: "all 0.2s", opacity: a.completed ? 0.7 : 1,
                  }}>
                  <div style={{
                    width: "3.5rem", height: "3.5rem", borderRadius: "0.75rem",
                    background: a.completed ? "#dcfce7" : "#f3e8ff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0
                  }}>
                    {loading === a.id ? "⏳" : a.completed ? "✅" : a.tasks?.emoji ?? "📋"}
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0, color: a.completed ? "#9ca3af" : "#1f2937", textDecoration: a.completed ? "line-through" : "none" }}>
                      {a.tasks?.name}
                    </p>
                    {a.tasks?.description && <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>{a.tasks.description}</p>}
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: a.completed ? "#9ca3af" : "#22c55e" }}>+{a.tasks?.points}</div>
                    <div style={{ fontSize: "0.7rem", color: "#d97706" }}>⭐</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Penalty tasks */}
          {penaltyTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h2 style={{ color: "white", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>⚠️ خصومات (إن وُجدت)</h2>
              {penaltyTasks.map(a => (
                <button key={a.id} onClick={() => complete(a)} disabled={a.completed || loading === a.id}
                  style={{
                    width: "100%", background: a.completed ? "rgba(254,226,226,0.7)" : "white",
                    border: a.completed ? "none" : "2px solid #fca5a5",
                    borderRadius: "1rem", padding: "1rem", cursor: a.completed ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: "1rem",
                    transition: "all 0.2s", opacity: a.completed ? 0.8 : 1,
                  }}>
                  <div style={{
                    width: "3.5rem", height: "3.5rem", borderRadius: "0.75rem",
                    background: a.completed ? "#fee2e2" : "#fff7ed",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0
                  }}>
                    {loading === a.id ? "⏳" : a.completed ? "❌" : a.tasks?.emoji ?? "⚠️"}
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0, color: a.completed ? "#9ca3af" : "#dc2626", textDecoration: a.completed ? "line-through" : "none" }}>
                      {a.tasks?.name}
                    </p>
                    {a.tasks?.description && <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0 }}>{a.tasks.description}</p>}
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: a.completed ? "#9ca3af" : "#dc2626" }}>{a.tasks?.points}</div>
                    <div style={{ fontSize: "0.7rem", color: "#dc2626" }}>نقطة</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}