"use client"
import React, { useState } from "react"
import Link from "next/link"
import { Shield, Phone, Save, CheckCircle, AlertTriangle, RefreshCw, X, UserCheck } from "lucide-react"
import toast from "react-hot-toast"
import ManualConsolidationModal from "./ManualConsolidationModal"

interface Profile {
  id: string
  full_name: string
  role: string
  phone?: string | null
  parent_phone?: string | null
  student_id?: string | null
  student?: { full_name: string } | null
}

interface StudentsManagerProps {
  students: Profile[]
  parents: Profile[]
  todayStr: string
  initialParentPhones?: Record<string, string>
}

export default function StudentsManager({
  students,
  parents,
  todayStr,
  initialParentPhones = {},
}: StudentsManagerProps) {
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null)

  // Parent Phones state initialized from initialParentPhones or student.parent_phone/phone
  const [parentPhones, setParentPhones] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = { ...initialParentPhones }
    students.forEach(s => {
      if (!initial[s.id]) {
        const val = s.parent_phone || s.phone || ""
        initial[s.id] = val ? val.replace(/\D/g, "") : ""
      }
    })
    return initial
  })

  // Bulk save loading state
  const [isBulkSaving, setIsBulkSaving] = useState<boolean>(false)

  // Individual modal edit state
  const [editingStudent, setEditingStudent] = useState<{ id: string; name: string; phone: string } | null>(null)
  const [isSavingSingle, setIsSavingSingle] = useState<boolean>(false)

  // Handle phone input change (digits only)
  const handlePhoneChange = (studentId: string, rawVal: string) => {
    const sanitized = rawVal.replace(/\D/g, "")
    setParentPhones(prev => ({
      ...prev,
      [studentId]: sanitized,
    }))
  }

  // Validate phone format helper
  const getPhoneValidation = (phoneStr: string) => {
    if (!phoneStr || phoneStr.trim() === "") {
      return { status: "empty", label: "لم يُسجل بعد", color: "#94a3b8" }
    }
    if (phoneStr.length < 10) {
      return {
        status: "incomplete",
        label: `⚠️ غير مكتمل (${phoneStr.length}/10 أرقام)`,
        color: "#f59e0b",
      }
    }
    if (phoneStr.length > 15) {
      return {
        status: "too_long",
        label: `⚠️ طويل جداً (${phoneStr.length}/15 رقم)`,
        color: "#ef4444",
      }
    }
    return { status: "valid", label: "جاهز للواتساب ✓", color: "#10b981" }
  }

  // Count ready numbers
  const readyCount = students.filter(s => {
    const p = parentPhones[s.id]
    return p && p.length >= 10 && p.length <= 15
  }).length

  // Save All Numbers (Bulk Save)
  const handleSaveAllPhones = async () => {
    // Check if any student has an incomplete phone (1 to 9 digits)
    const incomplete = students.filter(s => {
      const p = parentPhones[s.id]
      return p && p.length > 0 && p.length < 10
    })

    if (incomplete.length > 0) {
      toast.error(
        `تنبيه: يوجد ${incomplete.length} أرقام غير مكتملة (أقل من 10 أرقام). يرجى إدخال مفتاح الدولة كاملاً.`,
        { duration: 4000 }
      )
      return
    }

    setIsBulkSaving(true)
    try {
      const res = await fetch("/api/teacher/students/phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones: parentPhones }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في حفظ أرقام الهواتف")
      }

      if (data.phones) {
        setParentPhones(data.phones)
      }
      toast.success("تم حفظ جميع أرقام هواتف أولياء الأمور بنجاح 📱✨", { duration: 4000 })
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الأرقام")
    } finally {
      setIsBulkSaving(false)
    }
  }

  // Save Single Student Phone (from modal)
  const handleSaveSinglePhone = async () => {
    if (!editingStudent) return

    const validation = getPhoneValidation(editingStudent.phone)
    if (editingStudent.phone && validation.status !== "valid") {
      toast.error(validation.label, { duration: 3000 })
      return
    }

    setIsSavingSingle(true)
    try {
      const res = await fetch("/api/teacher/students/phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: editingStudent.id,
          phone: editingStudent.phone,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في حفظ رقم الهاتف")
      }

      setParentPhones(prev => ({
        ...prev,
        [editingStudent.id]: editingStudent.phone,
      }))

      toast.success(`تم حفظ رقم هاتف ولي أمر الطالب ${editingStudent.name} بنجاح ✅`)
      setEditingStudent(null)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الرقم")
    } finally {
      setIsSavingSingle(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          borderRadius: "1.5rem",
          padding: "1.5rem 1.75rem",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ color: "white", fontSize: "1.85rem", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span>👨‍🎓</span>
            <span>إدارة الطلاب وأرقام هواتف أولياء الأمور</span>
          </h1>
          <p style={{ color: "#94a3b8", margin: "0.35rem 0 0", fontSize: "0.92rem" }}>
            إعداد أرقام واتساب أولياء الأمور لتقارير الإنجاز اليومية والأسبوعية وإدارة خطط التثبيت.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#34d399",
              padding: "0.5rem 1rem",
              borderRadius: "0.85rem",
              fontWeight: 800,
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
            }}
          >
            <UserCheck size={18} />
            <span>الهواتف الجاهزة: {readyCount} / {students.length}</span>
          </div>
          <Link
            href="/teacher/reports"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "white",
              padding: "0.55rem 1.15rem",
              borderRadius: "0.85rem",
              fontWeight: 800,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              textDecoration: "none",
              boxShadow: "0 4px 15px rgba(22, 163, 74, 0.4)",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
            }}
          >
            <span>📱</span>
            <span>عرض تقارير الواتساب اليومية ◀</span>
          </Link>
        </div>
      </div>

      {/* ================= QUICK BULK FILL CARD (شاشة التعبئة السريعة) ================= */}
      <div
        className="card"
        style={{
          background: "white",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          boxShadow: "0 10px 35px rgba(0,0,0,0.06)",
          border: "2px solid #e0e7ff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.5rem" }}>⚡</span>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e1b4b", margin: 0, fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
                التعبئة السريعة لأرقام هواتف أولياء الأمور (WhatsApp Fast Entry)
              </h2>
              <span
                style={{
                  background: "#e0e7ff",
                  color: "#4338ca",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                }}
              >
                تحديث جماعي بنقرة واحدة
              </span>
            </div>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.88rem", lineHeight: 1.5 }}>
              أدخل أرقام هواتف أولياء الأمور لجميع الطلاب التسعة واحفظها دفعة واحدة لتفعيل ميزة تقارير الواتساب الآلية.
            </p>
          </div>

          <button
            type="button"
            disabled={isBulkSaving}
            onClick={handleSaveAllPhones}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              border: "none",
              borderRadius: "0.85rem",
              padding: "0.75rem 1.4rem",
              fontWeight: 900,
              fontSize: "0.95rem",
              cursor: isBulkSaving ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
              transition: "all 0.2s ease",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
            }}
          >
            {isBulkSaving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>جاري حفظ الأرقام...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>حفظ جميع الأرقام ({students.length} طلاب) 💾</span>
              </>
            )}
          </button>
        </div>

        {/* Format Explanation Helper Box */}
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "0.95rem",
            padding: "0.85rem 1.15rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>💡</span>
          <div style={{ fontSize: "0.85rem", color: "#1e40af", lineHeight: 1.5 }}>
            <strong>صيغة الإدخال المعتمدة:</strong> يجب إدخال الرقم مسبوقاً بمفتاح الدولة <u>بدون</u> إشارة <strong>+</strong> أو أصفار في البداية (مثال للأردن: <code style={{ background: "#dbeafe", padding: "0.15rem 0.4rem", borderRadius: "0.3rem", fontWeight: 700 }}>9627XXXXXXXX</code>، وللسعودية: <code style={{ background: "#dbeafe", padding: "0.15rem 0.4rem", borderRadius: "0.3rem", fontWeight: 700 }}>9665XXXXXXXX</code>).
          </div>
        </div>

        {/* 9 Students Quick Entry Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {students.map((student, idx) => {
            const currentVal = parentPhones[student.id] || ""
            const validation = getPhoneValidation(currentVal)

            return (
              <div
                key={student.id}
                style={{
                  background: "#f8fafc",
                  border: validation.status === "valid" ? "1.5px solid #10b981" : "1.5px solid #e2e8f0",
                  borderRadius: "1rem",
                  padding: "0.95rem 1.1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                }}
              >
                {/* Student Info Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        color: "white",
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#1e293b" }}>
                        {student.full_name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        طالب مشارك
                      </div>
                    </div>
                  </div>

                  {/* Validation status badge */}
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: validation.color,
                      background: validation.status === "valid" ? "rgba(16, 185, 129, 0.12)" : "rgba(0,0,0,0.05)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "9999px",
                      border: `1px solid ${validation.color}33`,
                      fontFamily: "'Tajawal', 'Cairo', sans-serif",
                    }}
                  >
                    {validation.label}
                  </span>
                </div>

                {/* Input Field (Numbers Only) */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    <Phone size={15} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={currentVal}
                    onChange={e => handlePhoneChange(student.id, e.target.value)}
                    placeholder="مثال: 962791234567"
                    style={{
                      width: "100%",
                      padding: "0.6rem 2.2rem 0.6rem 0.75rem",
                      borderRadius: "0.75rem",
                      border: validation.status === "incomplete" ? "1.5px solid #f59e0b" : "1px solid #cbd5e1",
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      background: "white",
                      outline: "none",
                      letterSpacing: "0.03em",
                      fontFamily: "monospace, sans-serif",
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Save All Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem" }}>
          <button
            type="button"
            disabled={isBulkSaving}
            onClick={handleSaveAllPhones}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              border: "none",
              borderRadius: "0.85rem",
              padding: "0.8rem 2rem",
              fontWeight: 900,
              fontSize: "1rem",
              cursor: isBulkSaving ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
            }}
          >
            {isBulkSaving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>جاري حفظ الأرقام...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>حفظ جميع أرقام هواتف أولياء الأمور (9 طلاب) 💾</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= 2-COLUMN VIEW: DETAILED STUDENTS & PARENTS ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Students Column */}
        <div className="card" style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#1e293b", marginBottom: "1rem" }}>
            قائمة الطلاب ({students?.length ?? 0})
          </h2>
          {!students?.length ? (
            <p style={{ color: "#9ca3af" }}>لا طلاب بعد</p>
          ) : (
            students.map(s => {
              const currentPhone = parentPhones[s.id] || s.parent_phone || s.phone || ""

              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.85rem 1rem",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.85rem",
                    marginBottom: "0.6rem",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "2.75rem",
                        height: "2.75rem",
                        background: "#e0e7ff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                      }}
                    >
                      👦
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, margin: 0, color: "#1e293b", fontSize: "0.95rem" }}>
                        {s.full_name}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                          {s.id.slice(0, 8)}...
                        </span>
                        {currentPhone ? (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "#059669",
                              fontWeight: 700,
                              background: "rgba(16, 185, 129, 0.12)",
                              padding: "0.1rem 0.45rem",
                              borderRadius: "0.35rem",
                              direction: "ltr",
                            }}
                          >
                            📞 {currentPhone}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: "#d97706",
                              fontWeight: 700,
                              background: "rgba(245, 158, 11, 0.12)",
                              padding: "0.1rem 0.45rem",
                              borderRadius: "0.35rem",
                            }}
                          >
                            ⚠️ لم يُحدد هاتف ولي الأمر
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {/* Edit Parent Phone Button */}
                    <button
                      type="button"
                      onClick={() => setEditingStudent({ id: s.id, name: s.full_name, phone: currentPhone })}
                      style={{
                        background: "rgba(99, 102, 241, 0.1)",
                        color: "#4f46e5",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                        borderRadius: "0.6rem",
                        padding: "0.45rem 0.75rem",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontFamily: "'Tajawal', 'Cairo', sans-serif",
                      }}
                    >
                      <Phone size={13} />
                      <span>تعديل هاتف ولي الأمر</span>
                    </button>

                    {/* Manual Consolidation Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedStudent({ id: s.id, name: s.full_name })}
                      style={{
                        background: "linear-gradient(135deg, #f43f5e, #be123c)",
                        color: "white",
                        border: "none",
                        borderRadius: "0.6rem",
                        padding: "0.45rem 0.85rem",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        boxShadow: "0 2px 8px rgba(244, 63, 94, 0.25)",
                        fontFamily: "'Tajawal', 'Cairo', sans-serif",
                      }}
                    >
                      <Shield size={14} />
                      <span>نظام تثبيت يدوي</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Parents Column */}
        <div className="card" style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#1e293b", marginBottom: "1rem" }}>
            أولياء الأمور المسجلون ({parents?.length ?? 0})
          </h2>
          {!parents?.length ? (
            <p style={{ color: "#9ca3af" }}>لا أولياء أمور مسجلون بعد</p>
          ) : (
            parents.map(p => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.85rem",
                  marginBottom: "0.6rem",
                }}
              >
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    background: "#fed7aa",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                  }}
                >
                  👨
                </div>
                <div>
                  <p style={{ fontWeight: 800, margin: 0, color: "#1e293b", fontSize: "0.95rem" }}>
                    {p.full_name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
                    متابع للطالب: {(p.student as { full_name?: string } | null)?.full_name ?? "غير محدد"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= INDIVIDUAL STUDENT PHONE MODAL ================= */}
      {editingStudent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={e => {
            if (e.target === e.currentTarget && !isSavingSingle) setEditingStudent(null)
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "0.85rem",
                    background: "#e0e7ff",
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Phone size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: "#1e293b" }}>
                    رقم هاتف ولي أمر الطالب
                  </h3>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    الطالب: <strong style={{ color: "#4f46e5" }}>{editingStudent.name}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Helper explanation */}
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "0.85rem",
                padding: "0.75rem 1rem",
                fontSize: "0.82rem",
                color: "#1e40af",
                lineHeight: 1.5,
                marginBottom: "1.25rem",
              }}
            >
              💡 <strong>صيغة الإدخال المطلوبة:</strong> يجب أن يبدأ بمفتاح الدولة بدون علامة + أو أصفار (مثال للأردن: <code>9627XXXXXXXX</code>، وللسعودية: <code>9665XXXXXXXX</code>).
            </div>

            {/* Input field */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#334155", marginBottom: "0.4rem" }}>
                رقم هاتف ولي الأمر (أرقام فقط)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={editingStudent.phone}
                  onChange={e => {
                    const sanitized = e.target.value.replace(/\D/g, "")
                    setEditingStudent(prev => prev ? { ...prev, phone: sanitized } : null)
                  }}
                  placeholder="مثال: 962791234567"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.85rem",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    outline: "none",
                    fontFamily: "monospace, sans-serif",
                  }}
                />
              </div>

              {/* Real-time validation feedback */}
              <div style={{ marginTop: "0.45rem", fontSize: "0.78rem" }}>
                {(() => {
                  const v = getPhoneValidation(editingStudent.phone)
                  return (
                    <span style={{ color: v.color, fontWeight: 700 }}>
                      {v.label}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                disabled={isSavingSingle}
                onClick={handleSaveSinglePhone}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "0.85rem",
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  cursor: isSavingSingle ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                }}
              >
                {isSavingSingle ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>حفظ رقم الهاتف</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                style={{
                  flex: 1,
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  padding: "0.75rem",
                  borderRadius: "0.85rem",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Consolidation Modal */}
      {selectedStudent && (
        <ManualConsolidationModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          todayStr={todayStr}
        />
      )}
    </div>
  )
}
