"use client"
import { useState } from "react"
import toast from "react-hot-toast"
import { StudentPlan, getDailyPlanDetails, DEFAULT_PLAN } from "@/lib/plan-utils"

interface StudentWithPlan {
  id: string
  full_name: string
  plan: StudentPlan
}

export default function TeacherPlansManager({
  initialStudents,
  todayStr,
}: {
  initialStudents: StudentWithPlan[]
  todayStr: string
}) {
  const [students, setStudents] = useState<StudentWithPlan[]>(initialStudents)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  function handleFieldChange(studentId: string, field: keyof StudentPlan, value: unknown) {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s
        return {
          ...s,
          plan: {
            ...s.plan,
            [field]: value,
          },
        }
      })
    )
  }

  async function handleSavePlan(student: StudentWithPlan) {
    setSavingId(student.id)
    try {
      const res = await fetch("/api/student-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          updates: {
            current_page: Number(student.plan.current_page) || 1,
            page_part: student.plan.page_part,
            current_review_hizb: Number(student.plan.current_review_hizb) || 1,
            plan_start_date: student.plan.plan_start_date || todayStr,
            plan_end_date: student.plan.plan_end_date || "2027-12-31",
            plan_active: true,
          },
          dateStr: todayStr,
        }),
      })

      if (!res.ok) {
        throw new Error("فشل حفظ التعديلات")
      }

      toast.success(`✓ تم حفظ وتحديث خطة الطالب: ${student.full_name}`, { duration: 4000 })
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء الحفظ")
    } finally {
      setSavingId(null)
    }
  }

  const filtered = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, margin: 0 }}>
            📖 إعداد وإدارة خطط الحفظ اليومية
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.25rem 0 0", fontSize: "0.95rem" }}>
            حدد نقطة بداية الحفظ والمراجعة وتاريخ الانطلاق لكل طالب لمرة واحدة وسيتولى النظام التوليد والتقدم التلقائي
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem 1rem", borderRadius: "1rem", color: "white", fontWeight: 800 }}>
          📅 الخطة مستمرة حتى نهاية 12-2027
        </div>
      </div>

      {/* Search Input */}
      <div className="card" style={{ padding: "0.75rem 1.25rem" }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 ابحث عن طالب بالاسم..."
          style={{
            width: "100%",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            fontSize: "1rem",
            outline: "none",
          }}
        />
      </div>

      {/* Students Plan Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filtered.map(s => {
          const plan = s.plan || DEFAULT_PLAN
          const preview = getDailyPlanDetails(plan, todayStr)
          const isSaving = savingId === s.id

          return (
            <div
              key={s.id}
              className="card"
              style={{
                borderRadius: "1.25rem",
                padding: "1.25rem",
                border: "2px solid #e5e7eb",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                    👨‍🎓
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.2rem", color: "#1f2937" }}>
                      {s.full_name}
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>معرّف الطالب: {s.id.slice(0, 8)}...</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSavePlan(s)}
                  disabled={isSaving}
                  style={{
                    background: isSaving ? "#9ca3af" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "white",
                    border: "none",
                    padding: "0.65rem 1.5rem",
                    borderRadius: "0.75rem",
                    fontWeight: 900,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ خطة الطالب 💾"}
                </button>
              </div>

              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem", background: "#f9fafb", padding: "1rem", borderRadius: "1rem", marginBottom: "1rem" }}>
                {/* Current Page */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    📖 رقم الصفحة الحالية (1 - 604)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={plan.current_page}
                    onChange={e => handleFieldChange(s.id, "current_page", Math.max(1, Math.min(604, Number(e.target.value))))}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #d1d5db",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  />
                </div>

                {/* Page Part */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    📌 الجزء من الصفحة
                  </label>
                  <select
                    value={plan.page_part}
                    onChange={e => handleFieldChange(s.id, "page_part", e.target.value as "top" | "bottom")}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #d1d5db",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      background: "white",
                    }}
                  >
                    <option value="top">النصف العلوي (الورد الأول)</option>
                    <option value="bottom">النصف السفلي (الورد الثاني)</option>
                  </select>
                </div>

                {/* Review Hizb */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    🔄 رقم حزب المراجعة (1 - 60)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={plan.current_review_hizb}
                    onChange={e => handleFieldChange(s.id, "current_review_hizb", Math.max(1, Math.min(60, Number(e.target.value))))}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #d1d5db",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    📅 تاريخ بدء الخطة
                  </label>
                  <input
                    type="date"
                    value={plan.plan_start_date || todayStr}
                    onChange={e => handleFieldChange(s.id, "plan_start_date", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #d1d5db",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              {/* Live Preview of Generated Tasks */}
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.85rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#6b7280", display: "block", marginBottom: "0.5rem" }}>
                  👁️ معاينة فورية لمهام اليوم المولدة للطالب بناءً على هذه الخطة:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div style={{ background: "#f3e8ff", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", color: "#6b21a8" }}>
                    <strong>📖 الدرس:</strong> {preview.tasks.lesson}
                  </div>
                  <div style={{ background: "#fef3c7", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", color: "#92400e" }}>
                    <strong>🔗 جنب الدرس:</strong> {preview.tasks.adjacentLesson}
                  </div>
                  <div style={{ background: "#fce7f3", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", color: "#9d174d" }}>
                    <strong>🔄 المراجعة:</strong> {preview.tasks.revision}
                  </div>
                  <div style={{ background: "#dbeafe", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", color: "#1e40af" }}>
                    <strong>🎧 السماع:</strong> {preview.tasks.listening}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
