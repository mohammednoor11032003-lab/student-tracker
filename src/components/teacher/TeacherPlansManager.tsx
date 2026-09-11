"use client"
import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import { StudentPlan, getDailyPlanDetails, DEFAULT_PLAN, getReviewCycle } from "@/lib/plan-utils"
import ManualConsolidationModal from "@/components/teacher/ManualConsolidationModal"
import { ManualConsolidation } from "@/lib/manual-consolidation-utils"
import { Shield, Sparkles, Calendar, BookOpen, Trash2, Edit, Plus, CheckCircle2, Clock } from "lucide-react"

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
  const [manualModalStudent, setManualModalStudent] = useState<{ id: string; name: string; suggestedPointer: string } | null>(null)
  const [editingConsolidation, setEditingConsolidation] = useState<ManualConsolidation | null>(null)
  const [consolidationsMap, setConsolidationsMap] = useState<Record<string, ManualConsolidation[]>>({})

  // Fetch consolidations for all students
  const fetchAllConsolidations = useCallback(async () => {
    try {
      const map: Record<string, ManualConsolidation[]> = {}
      await Promise.all(
        students.map(async s => {
          try {
            const res = await fetch(`/api/manual-consolidation?studentId=${s.id}`)
            const data = await res.json()
            if (data.success && data.consolidations) {
              map[s.id] = data.consolidations
            }
          } catch {}
        })
      )
      setConsolidationsMap(map)
    } catch (err) {
      console.error("Failed to fetch consolidations:", err)
    }
  }, [students])

  useEffect(() => {
    fetchAllConsolidations()
  }, [fetchAllConsolidations])

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
            current_review_hizb: activeHizb,
            current_review_index: safeIndex,
          },
        }
      })
    )
  }

  function handleSetAjzaPreset(studentId: string, ajza: number[]) {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s
        const newCycle = getReviewCycle(ajza)
        const activeHizb = newCycle[0]?.hizb || 1

        return {
          ...s,
          plan: {
            ...s.plan,
            memorized_ajza: ajza,
            current_review_hizb: activeHizb,
            current_review_index: 0,
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
          student_id: student.id,
          updates: student.plan,
          ...student.plan,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success(`تم حفظ خطة الطالب ${student.full_name} بنجاح! 💾`, {
        icon: "✅",
        duration: 4000,
      })
    } catch {
      toast.error("حدث خطأ أثناء حفظ الخطة")
    } finally {
      setSavingId(null)
    }
  }

  async function handleDeleteConsolidation(studentId: string, consolidationId: string) {
    if (!confirm("هل أنت متأكد من حذف نظام التثبيت هذا؟")) return
    try {
      const res = await fetch("/api/manual-consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: consolidationId, studentId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("تم حذف نظام التثبيت بنجاح ✓")
        setConsolidationsMap(prev => ({
          ...prev,
          [studentId]: (prev[studentId] || []).filter(x => x.id !== consolidationId),
        }))
      } else {
        toast.error(data.error || "فشل الحذف")
      }
    } catch {
      toast.error("حدث خطأ أثناء الاتصال")
    }
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, margin: 0 }}>
            📋 إدارة خطط الحفظ وأنظمة التثبيت للطلاب
          </h1>
          <p style={{ color: "#9ca3af", margin: "0.4rem 0 0", fontSize: "0.95rem" }}>
            تحديد مواضع الحفظ الجديدة ومسار المراجعة، وبرمجة أنظمة التثبيت الذكية لكل طالب
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: "280px" }}>
          <input
            type="text"
            placeholder="بحث عن طالب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem 1rem",
              borderRadius: "0.75rem",
              border: "1px solid #374151",
              background: "#1f2937",
              color: "white",
              fontSize: "0.95rem",
            }}
          />
        </div>
      </div>

      {/* Info Card */}
      <div
        style={{
          background: "#1e1b4b",
          border: "1px solid #4338ca",
          borderRadius: "1rem",
          padding: "1.25rem",
          color: "#c7d2fe",
          display: "flex",
          gap: "0.85rem",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>🛡️</span>
        <div style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
          <strong style={{ color: "white", display: "block", fontSize: "1rem", marginBottom: "0.2rem" }}>
            أنظمة التثبيت اليدوي الذكية:
          </strong>
          يمكنك برمجة فترات تثبيت مخصصة لكل طالب بتحديد نطاق الصفحات والمقدار اليومي، وسيقوم النظام آلياً بحساب الأيام اللازمة وتوزيع المهام على الطالب يومياً مع خيار يوم الحصاد وتجميد مؤشر الحفظ الاعتيادي لحين انتهاء التثبيت.
        </div>
      </div>

      {/* Students List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {filtered.map(s => {
          const plan = s.plan || DEFAULT_PLAN
          const preview = getDailyPlanDetails(plan, todayStr)
          const isSaving = savingId === s.id
          const selectedAjza = plan.memorized_ajza || [1]
          const cycle = getReviewCycle(selectedAjza)
          const studentConsolidations = consolidationsMap[s.id] || []
          const suggestedPointer = `ص ${plan.current_page} ${plan.page_part === "bottom" ? "النصف السفلي" : "النصف العلوي"}`

          return (
            <div
              key={s.id}
              className="card"
              style={{
                borderRadius: "1.25rem",
                padding: "1.5rem",
                border: "2px solid #e5e7eb",
                transition: "all 0.2s",
                background: "white",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              }}
            >
              {/* Card Top */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
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
                    onClick={() => {
                      setEditingConsolidation(null)
                      setManualModalStudent({ id: s.id, name: s.full_name, suggestedPointer })
                    }}
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
                    <Shield size={18} />
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

              {/* ================= 🛡️ قِسم: أنظمة التثبيت المجدولة والنشطة ================= */}
              <div
                style={{
                  background: "#fdf2f8",
                  border: "1.5px solid #fbcfe8",
                  borderRadius: "1rem",
                  padding: "1.1rem 1.25rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Shield size={20} color="#be123c" />
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#881337" }}>
                      أنظمة التثبيت المجدولة والنشطة ({studentConsolidations.length})
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingConsolidation(null)
                      setManualModalStudent({ id: s.id, name: s.full_name, suggestedPointer })
                    }}
                    style={{
                      background: "#be123c",
                      color: "white",
                      border: "none",
                      padding: "0.35rem 0.85rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Plus size={14} />
                    <span>جدولة نظام تثبيت إضافي</span>
                  </button>
                </div>

                {studentConsolidations.length === 0 ? (
                  <div style={{ padding: "0.85rem", background: "white", borderRadius: "0.75rem", border: "1px dashed #f472b6", textAlign: "center", color: "#9d174d", fontSize: "0.88rem" }}>
                    لا توجد أنظمة تثبيت نشطة أو مجدولة لهذا الطالب حالياً. خطة الحفظ التلقائية سارية.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0.85rem" }}>
                    {studentConsolidations.map(c => {
                      const isActiveNow = c.is_active && todayStr >= c.start_date && todayStr <= c.end_date
                      const isFuture = c.is_active && c.start_date > todayStr
                      const isCompleted = !c.is_active || c.end_date < todayStr

                      // Calculate next day after end_date for resumption
                      const resumptionDate = (() => {
                        const d = new Date(c.end_date + "T00:00:00")
                        d.setDate(d.getDate() + 1)
                        return d.toISOString().split("T")[0]
                      })()

                      const totalP = Math.max(0, c.end_page - c.start_page + 1)

                      return (
                        <div
                          key={c.id}
                          style={{
                            background: "white",
                            borderRadius: "0.85rem",
                            border: isActiveNow ? "2px solid #e11d48" : "1px solid #cbd5e1",
                            padding: "1rem",
                            boxShadow: isActiveNow ? "0 4px 15px rgba(225, 29, 72, 0.15)" : "none",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.6rem",
                          }}
                        >
                          {/* Card Header with Status Badge */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.65rem",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: 900,
                                background: isActiveNow ? "#ffe4e6" : isFuture ? "#e0e7ff" : "#f1f5f9",
                                color: isActiveNow ? "#be123c" : isFuture ? "#4338ca" : "#64748b",
                                border: isActiveNow ? "1px solid #fda4af" : isFuture ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                              }}
                            >
                              {isActiveNow ? "🟢 نشط حالياً" : isFuture ? "⏳ مجدول مستقبلاً" : "🏁 مكتمل / مؤرشف"}
                            </span>

                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button
                                type="button"
                                title="تعديل"
                                onClick={() => {
                                  setEditingConsolidation(c)
                                  setManualModalStudent({ id: s.id, name: s.full_name, suggestedPointer })
                                }}
                                style={{
                                  background: "#f1f5f9",
                                  border: "none",
                                  borderRadius: "0.4rem",
                                  padding: "0.3rem 0.5rem",
                                  cursor: "pointer",
                                  color: "#334155",
                                }}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                title="حذف"
                                onClick={() => handleDeleteConsolidation(s.id, c.id)}
                                style={{
                                  background: "#fee2e2",
                                  border: "none",
                                  borderRadius: "0.4rem",
                                  padding: "0.3rem 0.5rem",
                                  cursor: "pointer",
                                  color: "#dc2626",
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: 800 }}>
                            📖 النطاق: من ص {c.start_page} إلى ص {c.end_page} ({totalP} صفحة)
                          </div>

                          <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                            ⚡ المقدار اليومي: <strong>{c.daily_pages_count} صفحات يومياً</strong>
                          </div>

                          <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                            📅 المدة: من <strong>{c.start_date}</strong> إلى <strong>{c.end_date}</strong>
                          </div>

                          <div style={{ fontSize: "0.82rem", color: c.has_harvest_day ? "#b45309" : "#64748b", fontWeight: 700 }}>
                            🌾 حالة يوم الحصاد: {c.has_harvest_day ? `مفعّل (${c.harvest_days_count || 1} أيام حصاد في نهاية الفترة)` : "غير مفعّل"}
                          </div>

                          <div style={{ fontSize: "0.82rem", color: c.include_fridays ? "#15803d" : "#64748b", fontWeight: 700 }}>
                            🕌 أيام الجمعة: {c.include_fridays ? "مشمولة في خطة التثبيت ⚡" : "إجازة رسمية (مستثناة من المهام) 🕌"}
                          </div>

                          {/* Prominent Resumption Callout (Requirement 3) */}
                          <div
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #86efac",
                              borderRadius: "0.6rem",
                              padding: "0.55rem 0.75rem",
                              fontSize: "0.82rem",
                              color: "#166534",
                              fontWeight: 800,
                              lineHeight: 1.4,
                              marginTop: "0.2rem",
                            }}
                          >
                            📌 موعد استئناف خطة الحفظ التلقائية: <strong>{resumptionDate}</strong> بدءاً من <strong>{c.resume_page_pointer || "ص 1 النصف العلوي"}</strong>.
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
                      fontSize: "0.95rem",
                    }}
                  />
                </div>

                {/* Consolidation Week Switch */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#374151", marginBottom: "0.35rem" }}>
                    🛡️ أسبوع تثبيت نهاية الجزء (7 أيام)
                  </label>
                  <select
                    value={plan.is_in_consolidation ? "yes" : "no"}
                    onChange={e => handleFieldChange(s.id, "is_in_consolidation", e.target.value === "yes")}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #cbd5e1",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      background: plan.is_in_consolidation ? "#fef3c7" : "white",
                      color: plan.is_in_consolidation ? "#b45309" : "#1f2937",
                    }}
                  >
                    <option value="no">تلقائي حسب تقدم الطالب (ينشط ذاتياً عند إتمام كل 20 صفحة)</option>
                    <option value="yes">فرض أسبوع التثبيت الآن (استثنائي لمدة 7 أيام)</option>
                  </select>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: "0.3rem", lineHeight: 1.4 }}>
                    ملاحظة: هذا النظام ينشط تلقائياً للطالب بعد كل 20 صفحة (الأيام 1-4: 5 صفحات x 10 تكرارات | 5-6: 10 صفحات x 5 | 7: 20 صفحة x 3). الخيار اليدوي هنا يُستخدم فقط في حال رغبت بفرضه استثنائياً.
                  </span>
                </div>
              </div>

              {/* Review Cycle Ajza Selection */}
              <div style={{ background: "#f0fdf4", padding: "1rem", borderRadius: "1rem", border: "1px solid #bbf7d0", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#166534" }}>
                      🔄 الأجزاء المخصصة للمراجعة التراكمية (دورة المراجعة الصغرى والكبرى)
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
                        }}
                      >
                        جزء {juzNum}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Real-time Preview Bar */}
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
          onClose={() => {
            setManualModalStudent(null)
            setEditingConsolidation(null)
          }}
          studentId={manualModalStudent.id}
          studentName={manualModalStudent.name}
          todayStr={todayStr}
          suggestedResumePointer={manualModalStudent.suggestedPointer}
          initialEditItem={editingConsolidation}
          onSaved={() => fetchAllConsolidations()}
        />
      )}
    </div>
  )
}
