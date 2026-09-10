"use client"
import { useState } from "react"
import toast from "react-hot-toast"
import { StudentPlan, getDailyPlanDetails, DEFAULT_PLAN, getReviewCycle } from "@/lib/plan-utils"
import ManualConsolidationModal from "@/components/teacher/ManualConsolidationModal"

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
  const [manualModalStudent, setManualModalStudent] = useState<{ id: string; name: string } | null>(null)

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

  function handleToggleJuz(studentId: string, juzNum: number) {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s
        const currentList = s.plan.memorized_ajza || [1]
        let nextList: number[]
        if (currentList.includes(juzNum)) {
          nextList = currentList.filter(j => j !== juzNum)
          if (nextList.length === 0) nextList = [1]
        } else {
          nextList = [...currentList, juzNum].sort((a, b) => a - b)
        }

        const newCycle = getReviewCycle(nextList)
        const safeIndex = Math.min(s.plan.current_review_index || 0, Math.max(0, newCycle.length - 1))
        const activeHizb = newCycle[safeIndex]?.hizb || 1

        return {
          ...s,
          plan: {
            ...s.plan,
            memorized_ajza: nextList,
            current_review_index: safeIndex,
            current_review_hizb: activeHizb,
          },
        }
      })
    )
  }

  function handleSetAjzaPreset(studentId: string, preset: number[]) {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s
        const nextList = preset.length > 0 ? preset : [1]
        const newCycle = getReviewCycle(nextList)
        const safeIndex = 0
        const activeHizb = newCycle[0]?.hizb || 1

        return {
          ...s,
          plan: {
            ...s.plan,
            memorized_ajza: nextList,
            current_review_index: safeIndex,
            current_review_hizb: activeHizb,
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
            memorized_ajza: student.plan.memorized_ajza && student.plan.memorized_ajza.length > 0 ? student.plan.memorized_ajza : [1],
            current_review_index: Number(student.plan.current_review_index) || 0,
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
            حدد نقطة بداية الحفظ، والأجزاء المحفوظة للمراجعة لكل طالب وسيتولى النظام التوليد والتقدم التلقائي
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
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {filtered.map(s => {
          const plan = s.plan || DEFAULT_PLAN
          const preview = getDailyPlanDetails(plan, todayStr)
          const isSaving = savingId === s.id
          const selectedAjza = plan.memorized_ajza && plan.memorized_ajza.length > 0 ? plan.memorized_ajza : [1]
          const cycle = getReviewCycle(selectedAjza)
          const currentReviewIndex = Math.min(plan.current_review_index || 0, cycle.length - 1)

          return (
            <div
              key={s.id}
              className="card"
              style={{
                borderRadius: "1.25rem",
                padding: "1.35rem",
                border: "2px solid #e5e7eb",
                transition: "all 0.2s",
                background: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "50%", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>
                    👨‍🎓
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.25rem", color: "#1f2937" }}>
                      {s.full_name}
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>معرّف الطالب: {s.id.slice(0, 8)}...</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setManualModalStudent({ id: s.id, name: s.full_name })}
                    style={{
                      background: "linear-gradient(135deg, #f43f5e, #be123c)",
                      color: "white",
                      border: "none",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "0.85rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "0.95rem",
                      boxShadow: "0 4px 12px rgba(244, 63, 94, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "all 0.2s",
                    }}
                  >
                    <span>🛡️</span>
                    <span>إنشاء نظام تثبيت يدوي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSavePlan(s)}
                    disabled={isSaving}
                    style={{
                      background: isSaving ? "#9ca3af" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      color: "white",
                      border: "none",
                      padding: "0.75rem 1.75rem",
                      borderRadius: "0.85rem",
                      fontWeight: 900,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      fontSize: "1rem",
                      boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                      transition: "all 0.2s",
                    }}
                  >
                    {isSaving ? "جاري الحفظ..." : "حفظ خطة الطالب 💾"}
                  </button>
                </div>
              </div>

              {/* Top Basic Settings Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem", background: "#f8fafc", padding: "1rem", borderRadius: "1rem", marginBottom: "1.25rem", border: "1px solid #e2e8f0" }}>
                {/* Current Page */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.35rem" }}>
                    📖 رقم صفحة الحفظ الجديد (1 - 604)
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
                      border: "1px solid #cbd5e1",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  />
                </div>

                {/* Page Part */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.35rem" }}>
                    📌 ورد الحفظ (نصف الصفحة)
                  </label>
                  <select
                    value={plan.page_part}
                    onChange={e => handleFieldChange(s.id, "page_part", e.target.value as "top" | "bottom")}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #cbd5e1",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      background: "white",
                    }}
                  >
                    <option value="top">النصف العلوي (الورد الأول)</option>
                    <option value="bottom">النصف السفلي (الورد الثاني)</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.35rem" }}>
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
                      border: "1px solid #cbd5e1",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              {/* 30-Juz Memorized Selector Section */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "1rem", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div>
                    <span style={{ fontWeight: 900, color: "#166534", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>🎯</span>
                      <span>الأجزاء التي أتم الطالب حفظها (حلقة المراجعة الخاصة)</span>
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#15803d" }}>
                      اختر الأجزاء التي يراجعها الطالب (سيتولى النظام ترتيب أحزابها تلقائياً تصاعدياً حسب المصحف والتدوير بينها)
                    </span>
                  </div>

                  {/* Summary badge */}
                  <div style={{ background: "#dcfce7", color: "#14532d", fontWeight: 800, fontSize: "0.85rem", padding: "0.35rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #86efac" }}>
                    تم تحديد: {selectedAjza.length} جزء ({cycle.length} حزب في الدورة)
                  </div>
                </div>

                {/* Presets buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.85rem" }}>
                  <button
                    type="button"
                    onClick={() => handleSetAjzaPreset(s.id, [30])}
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 700 }}
                  >
                    جزء عمّ (30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAjzaPreset(s.id, [29, 30])}
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 700 }}
                  >
                    عمّ وتبارك (29-30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAjzaPreset(s.id, [26, 27, 28, 29, 30])}
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 700 }}
                  >
                    آخر 5 أجزاء (26-30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAjzaPreset(s.id, Array.from({ length: 30 }, (_, i) => i + 1))}
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 700 }}
                  >
                    القرآن كاملاً (1-30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAjzaPreset(s.id, [1])}
                    style={{ fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: "0.5rem", border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontWeight: 700 }}
                  >
                    إعادة ضبط (الجزء 1 فقط)
                  </button>
                </div>

                {/* 30 Juz Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))", gap: "0.4rem" }}>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(juzNum => {
                    const isSelected = selectedAjza.includes(juzNum)
                    return (
                      <button
                        key={juzNum}
                        type="button"
                        onClick={() => handleToggleJuz(s.id, juzNum)}
                        style={{
                          padding: "0.45rem 0.25rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          textAlign: "center",
                          border: isSelected ? "2px solid #15803d" : "1px solid #cbd5e1",
                          background: isSelected ? "#16a34a" : "white",
                          color: isSelected ? "white" : "#475569",
                          boxShadow: isSelected ? "0 2px 5px rgba(22,163,74,0.3)" : "none",
                        }}
                      >
                        {isSelected ? `✓ جزء ${juzNum}` : `جزء ${juzNum}`}
                      </button>
                    )
                  })}
                </div>

                {/* Review Position in Cycle Selector */}
                <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #86efac", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 800, color: "#166534" }}>
                      📍 الحزب المقرر حالياً للمراجعة في دورة الطالب:
                    </label>
                    <span style={{ fontSize: "0.75rem", color: "#15803d" }}>
                      يمكنك تحديد أي حزب تبدأ منه دورته، وسينتقل تلقائياً للحزب التالي عند إكمال المهمة
                    </span>
                  </div>
                  <select
                    value={currentReviewIndex}
                    onChange={e => {
                      const idx = Number(e.target.value)
                      handleFieldChange(s.id, "current_review_index", idx)
                      if (cycle[idx]) {
                        handleFieldChange(s.id, "current_review_hizb", cycle[idx].hizb)
                      }
                    }}
                    style={{
                      padding: "0.5rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #16a34a",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      color: "#166534",
                      background: "white",
                      minWidth: "220px",
                    }}
                  >
                    {cycle.map((h, idx) => (
                      <option key={idx} value={idx}>
                        ({idx + 1}/{cycle.length}) {h.name} - جزء {h.juz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Preview of Generated Tasks */}
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.85rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#6b7280", display: "block", marginBottom: "0.5rem" }}>
                  👁️ معاينة فورية لمهام اليوم المقررة للطالب:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div style={{ background: "#f3e8ff", padding: "0.45rem 0.75rem", borderRadius: "0.5rem", color: "#6b21a8" }}>
                    <strong>📖 الدرس:</strong> {preview.tasks.lesson}
                  </div>
                  <div style={{ background: "#fef3c7", padding: "0.45rem 0.75rem", borderRadius: "0.5rem", color: "#92400e" }}>
                    <strong>🔗 جنب الدرس:</strong> {preview.tasks.adjacentLesson}
                  </div>
                  <div style={{ background: "#fce7f3", padding: "0.45rem 0.75rem", borderRadius: "0.5rem", color: "#9d174d", border: "1px solid #fbcfe8" }}>
                    <strong>🔄 المراجعة:</strong> {preview.tasks.revision}
                    <span style={{ display: "block", fontSize: "0.75rem", color: "#db2777", marginTop: "0.15rem" }}>
                      (الحزب {preview.hizbIndex + 1} من أصل {preview.totalCycleHizbs} في دورته)
                    </span>
                  </div>
                  <div style={{ background: "#dbeafe", padding: "0.45rem 0.75rem", borderRadius: "0.5rem", color: "#1e40af" }}>
                    <strong>🎧 السماع:</strong> {preview.tasks.listening}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Manual Consolidation Modal for Selected Student */}
      {manualModalStudent && (
        <ManualConsolidationModal
          isOpen={!!manualModalStudent}
          onClose={() => setManualModalStudent(null)}
          studentId={manualModalStudent.id}
          studentName={manualModalStudent.name}
          todayStr={todayStr}
        />
      )}
    </div>
  )
}


