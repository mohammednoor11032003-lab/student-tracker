"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"
import toast from "react-hot-toast"

const EMOJIS = ["📚","✏️","🔢","🎨","🏃","🌱","🎵","🔬","📖","💡","🧩","⚽","🎯","🖊️","🗺️"]

export default function TaskManager({ tasks: init, teacherId }: { tasks: Task[]; teacherId: string }) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", points: 10, emoji: "📚" })
  const [loading, setLoading] = useState(false)

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from("tasks")
      .insert([{ ...form, created_by: teacherId }]).select().single()
    if (error) { toast.error("حدث خطأ ❌"); setLoading(false); return }
    setTasks([data, ...tasks])
    setForm({ name: "", description: "", points: 10, emoji: "📚" })
    setShowForm(false)
    toast.success("تمت إضافة المهمة! ✅")
    setLoading(false)
  }

  async function deleteTask(id: string) {
    if (!confirm("هل تريد حذف هذه المهمة؟")) return
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) { toast.error("حدث خطأ"); return }
    setTasks(tasks.filter(t => t.id !== id))
    toast.success("تم الحذف")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: 600 }}>{tasks.length} مهمة في القائمة</span>
        <button onClick={() => setShowForm(!showForm)} className="btn-secondary">
          {showForm ? "❌ إلغاء" : "➕ مهمة جديدة"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1rem" }}>إضافة مهمة جديدة</h2>
          <form onSubmit={addTask} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {EMOJIS.map(e => (
                <button type="button" key={e} onClick={() => setForm({ ...form, emoji: e })}
                  style={{
                    fontSize: "1.5rem", padding: "0.4rem", borderRadius: "0.5rem", cursor: "pointer",
                    border: form.emoji === e ? "2px solid #7c3aed" : "2px solid #e5e7eb",
                    background: form.emoji === e ? "#f3e8ff" : "white",
                    transform: form.emoji === e ? "scale(1.2)" : "scale(1)", transition: "all 0.15s"
                  }}>{e}</button>
              ))}
            </div>
            <input className="input" placeholder="اسم المهمة *" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="وصف المهمة (اختياري)" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
            <div>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem", color: "#374151" }}>
                النقاط: {form.points} ⭐
              </label>
              <input type="range" min="5" max="100" step="5" value={form.points}
                onChange={e => setForm({ ...form, points: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "#7c3aed" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                <span>5</span><span>100</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? "...جاري الحفظ" : "💾 حفظ المهمة"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {tasks.map(task => (
          <div key={task.id} className="card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <span style={{ fontSize: "2.5rem" }}>{task.emoji}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, color: "#1f2937", margin: "0 0 0.25rem" }}>{task.name}</h3>
              {task.description && <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 0.5rem" }}>{task.description}</p>}
              <span className="points-badge">{task.points} نقطة ⭐</span>
            </div>
            <button onClick={() => deleteTask(task.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#f87171" }}>🗑️</button>
          </div>
        ))}
      </div>

      {tasks.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📭</div>
          <p style={{ color: "#9ca3af", fontSize: "1.1rem" }}>لا مهام بعد. أضف أول مهمة!</p>
        </div>
      )}
    </div>
  )
}
