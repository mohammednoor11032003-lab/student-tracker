"use client"
import React, { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BountyTask, parseBountyTask } from "@/lib/bounty-utils"
import { Award, Plus, Trash2, Edit2, Sparkles, Trophy, Check, X, Swords } from "lucide-react"
import toast from "react-hot-toast"

const BOUNTY_EMOJIS = ["🏆", "⚔️", "🏃", "📖", "🔍", "⭐", "🌙", "✨", "🎯", "🛡️", "💡", "💎", "👑", "📜", "🔥"]

interface TeacherChallengesProps {
  teacherId: string
  initialChallenges: BountyTask[]
  activeWeeklyBountyIds: string[]
}

export default function TeacherChallenges({
  teacherId,
  initialChallenges,
  activeWeeklyBountyIds,
}: TeacherChallengesProps) {
  const supabase = createClient()
  const [challenges, setChallenges] = useState<BountyTask[]>(initialChallenges)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Form State
  const [formName, setFormName] = useState("")
  const [formDetails, setFormDetails] = useState("")
  const [formPoints, setFormPoints] = useState(15)
  const [formTarget, setFormTarget] = useState(1)
  const [formUnit, setFormUnit] = useState("مرات")
  const [formEmoji, setFormEmoji] = useState("🏆")

  function resetForm() {
    setFormName("")
    setFormDetails("")
    setFormPoints(15)
    setFormTarget(1)
    setFormUnit("مرات")
    setFormEmoji("🏆")
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(c: BountyTask) {
    setEditingId(c.id)
    setFormName(c.name)
    setFormDetails(c.details || "")
    setFormPoints(c.points)
    setFormTarget(c.target)
    setFormUnit(c.unit || "مرات")
    setFormEmoji(c.emoji || "🏆")
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error("يرجى كتابة اسم التحدي")
      return
    }

    setLoading(true)
    const bountyDesc = JSON.stringify({
      isBounty: true,
      target: formTarget,
      unit: formUnit,
      details: formDetails.trim(),
    })

    try {
      if (editingId) {
        // Update existing
        const { data, error } = await supabase
          .from("tasks")
          .update({
            name: formName.trim(),
            description: bountyDesc,
            points: formPoints,
            emoji: formEmoji,
          })
          .eq("id", editingId)
          .select()
          .single()

        if (error) throw error

        const updated = parseBountyTask(data)
        setChallenges(prev => prev.map(c => (c.id === editingId ? updated : c)))
        toast.success("تم تحديث التحدي بنجاح! ✅")
      } else {
        // Create new
        const { data, error } = await supabase
          .from("tasks")
          .insert([
            {
              name: formName.trim(),
              description: bountyDesc,
              points: formPoints,
              emoji: formEmoji,
              created_by: teacherId,
            },
          ])
          .select()
          .single()

        if (error) throw error

        const created = parseBountyTask(data)
        setChallenges(prev => [created, ...prev])
        toast.success("تمت إضافة التحدي الاختياري بنجاح! 🏆")
      }
      resetForm()
    } catch (err) {
      console.error("Error saving challenge:", err)
      toast.error("حدث خطأ أثناء الحفظ ❌")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف التحدي "${name}"؟`)) return

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id)
      if (error) throw error

      setChallenges(prev => prev.filter(c => c.id !== id))
      toast.success("تم حذف التحدي بنجاح")
    } catch (err) {
      console.error("Error deleting challenge:", err)
      toast.error("حدث خطأ أثناء الحذف")
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              color: "white",
              fontSize: "1.85rem",
              fontWeight: 900,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>⚔️ لوحة التحديات الاختيارية</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
            إدارة وتخصيص بنك التحديات الأسبوعية (Bounty Board) وإضافة مهام تحفيزية بمكافآت نقاط عالية.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm()
            else setShowForm(true)
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.65rem 1.25rem",
            borderRadius: "0.85rem",
            border: "none",
            background: showForm ? "#ef4444" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "white",
            fontWeight: 800,
            fontSize: "0.9rem",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            transition: "all 0.2s ease",
          }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showForm ? "إلغاء" : "إضافة تحدي جديد"}</span>
        </button>
      </div>

      {/* Add / Edit Form Modal/Card */}
      {showForm && (
        <div
          className="card"
          style={{
            background: "white",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            border: "2px solid #f59e0b",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.2rem", fontWeight: 800, color: "#1f2937" }}>
            {editingId ? "✏️ تعديل التحدي الاختياري" : "➕ إضافة تحدي اختياري جديد"}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Emoji Selector */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#4b5563", marginBottom: "0.4rem" }}>
                اختر أيقونة التحدي:
              </label>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {BOUNTY_EMOJIS.map(e => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setFormEmoji(e)}
                    style={{
                      fontSize: "1.4rem",
                      padding: "0.35rem 0.55rem",
                      borderRadius: "0.6rem",
                      border: formEmoji === e ? "2px solid #d97706" : "1px solid #e5e7eb",
                      background: formEmoji === e ? "#fef3c7" : "#f8fafc",
                      cursor: "pointer",
                      transform: formEmoji === e ? "scale(1.15)" : "scale(1)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#4b5563", marginBottom: "0.3rem" }}>
                اسم التحدي:
              </label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="مثال: ماراثون المراجعة، باحث التفسير..."
                required
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid #d1d5db",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Details */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#4b5563", marginBottom: "0.3rem" }}>
                تفاصيل التحدي والمطلوب من الطالب:
              </label>
              <textarea
                value={formDetails}
                onChange={e => setFormDetails(e.target.value)}
                placeholder="اشرح ما يجب على الطالب فعله بالتفصيل لإتمام هذا التحدي..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid #d1d5db",
                  fontSize: "0.9rem",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Grid for Points, Target, Unit */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#4b5563", marginBottom: "0.3rem" }}>
                  قيمة المكافأة (+نقاط):
                </label>
                <input
                  type="number"
                  value={formPoints}
                  onChange={e => setFormPoints(Math.max(1, parseInt(e.target.value) || 0))}
                  min={1}
                  max={100}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.75rem",
                    border: "1.5px solid #d1d5db",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#4b5563", marginBottom: "0.3rem" }}>
                  الهدف المطلوب للعداد:
                </label>
                <input
                  type="number"
                  value={formTarget}
                  onChange={e => setFormTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={50}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.75rem",
                    border: "1.5px solid #d1d5db",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#4b5563", marginBottom: "0.3rem" }}>
                  وحدة القياس:
                </label>
                <input
                  type="text"
                  value={formUnit}
                  onChange={e => setFormUnit(e.target.value)}
                  placeholder="مرات، أحزاب، صفحات..."
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.75rem",
                    border: "1.5px solid #d1d5db",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Submit buttons */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "0.65rem 1.25rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  background: "#f3f4f6",
                  color: "#4b5563",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.65rem 1.5rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
                }}
              >
                {loading ? "جاري الحفظ..." : editingId ? "تحديث التحدي" : "حفظ التحدي"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Challenges List */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {challenges.map(c => {
          const isActiveThisWeek = activeWeeklyBountyIds.includes(c.id)

          return (
            <div
              key={c.id}
              style={{
                background: "white",
                borderRadius: "1.25rem",
                padding: "1.25rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: isActiveThisWeek ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem",
                position: "relative",
              }}
            >
              {/* Active this week tag */}
              {isActiveThisWeek && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "1rem",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                    padding: "0.2rem 0.65rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Sparkles size={12} />
                  <span>نشط هذا الأسبوع للطلاب</span>
                </div>
              )}

              {/* Card Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.85rem", lineHeight: 1 }}>{c.emoji}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1f2937" }}>
                        {c.name}
                      </h3>
                      <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>
                        الهدف: {c.target} {c.unit || "مرات"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "0.75rem",
                      fontWeight: 900,
                      fontSize: "1.05rem",
                      border: "1px solid #fde68a",
                    }}
                  >
                    +{c.points}
                  </div>
                </div>

                {/* Details */}
                <p
                  style={{
                    margin: "0.85rem 0 0",
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    lineHeight: 1.45,
                    background: "#f9fafb",
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  {c.details}
                </p>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: "0.75rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    background: "white",
                    color: "#4b5563",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Edit2 size={14} />
                  <span>تعديل</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
