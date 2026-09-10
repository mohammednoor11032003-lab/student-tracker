"use client"
import React, { useState, useEffect } from "react"
import { Shield, X, Calendar, BookOpen, RotateCcw, AlertCircle, CheckCircle2, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { ManualConsolidation } from "@/lib/manual-consolidation"

interface ManualConsolidationModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  todayStr: string
  onSaved?: () => void
}

export default function ManualConsolidationModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  todayStr,
  onSaved,
}: ManualConsolidationModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [existingList, setExistingList] = useState<ManualConsolidation[]>([])
  
  // Form State
  const [form, setForm] = useState({
    id: "",
    start_date: todayStr,
    end_date: "",
    pages_description: "",
    repetitions_count: 5,
  })

  // Load existing consolidations when opened
  useEffect(() => {
    if (!isOpen || !studentId) return

    let isMounted = true
    async function fetchConsolidations() {
      setFetching(true)
      try {
        const res = await fetch(`/api/manual-consolidation?studentId=${studentId}`)
        const data = await res.json()
        if (isMounted && data.success && data.consolidations) {
          setExistingList(data.consolidations)
          
          // If active one exists, prefill form for quick editing
          const active = data.consolidations.find((c: ManualConsolidation) => c.is_active)
          if (active) {
            setForm({
              id: active.id,
              start_date: active.start_date,
              end_date: active.end_date,
              pages_description: active.pages_description,
              repetitions_count: active.repetitions_count,
            })
          } else {
            // Default: 7 days starting from today
            const endD = new Date(todayStr)
            endD.setDate(endD.getDate() + 6)
            const endStr = endD.toISOString().split("T")[0]
            setForm({
              id: "",
              start_date: todayStr,
              end_date: endStr,
              pages_description: "تثبيت ومراجعة من ص ... إلى ص ...",
              repetitions_count: 5,
            })
          }
        }
      } catch (err) {
        console.error("Failed to load manual consolidations:", err)
      } finally {
        if (isMounted) setFetching(false)
      }
    }

    fetchConsolidations()
    return () => {
      isMounted = false
    }
  }, [isOpen, studentId, todayStr])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.start_date || !form.end_date || !form.pages_description.trim()) {
      toast.error("يرجى تعبئة كافة الحقول المطلوبة")
      return
    }

    if (form.start_date > form.end_date) {
      toast.error("تاريخ البدء يجب أن يكون قبل أو يساوي تاريخ الانتهاء")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/manual-consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          studentId,
          start_date: form.start_date,
          end_date: form.end_date,
          pages_description: form.pages_description.trim(),
          repetitions_count: Number(form.repetitions_count) || 5,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل حفظ نظام التثبيت اليدوي")
      }

      toast.success("✓ تم تفعيل وحفظ نظام التثبيت اليدوي بنجاح!")
      if (onSaved) onSaved()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "حدث خطأ أثناء الحفظ")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelConsolidation(id: string) {
    if (!confirm("هل أنت متأكد من إلغاء نظام التثبيت اليدوي لهذا الطالب؟ سيعود الطالب للخطة الاعتيادية فوراً.")) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/manual-consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "فشل الإلغاء")

      toast.success("✓ تم إلغاء نظام التثبيت اليدوي وعودة الخطة الاعتيادية")
      setExistingList(prev => prev.map(c => (c.id === id ? { ...c, is_active: false } : c)))
      setForm({
        id: "",
        start_date: todayStr,
        end_date: todayStr,
        pages_description: "",
        repetitions_count: 5,
      })
      if (onSaved) onSaved()
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الإلغاء")
    } finally {
      setLoading(false)
    }
  }

  const activeRecord = existingList.find(c => c.is_active)

  return (
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
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div
        className="max-h-[90vh] overflow-y-auto flex flex-col"
        style={{
          width: "100%",
          maxWidth: "540px",
          background: "white",
          borderRadius: "1.5rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "scaleIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            background: "linear-gradient(135deg, #4338ca 0%, #3730a3 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
              }}
            >
              🛡️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>
                نظام التثبيت اليدوي المخصص
              </h3>
              <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                الطالب: {studentName}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.5rem" }}>
          {/* Active Banner if exists */}
          {activeRecord && (
            <div
              style={{
                background: "#fef2f2",
                border: "1.5px solid #f87171",
                borderRadius: "1rem",
                padding: "1rem",
                marginBottom: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, color: "#991b1b", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <AlertCircle size={18} />
                  <span>يوجد نظام تثبيت يدوي نشط حالياً لهذا الطالب</span>
                </span>
                <span style={{ background: "#ef4444", color: "white", fontSize: "0.75rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                  نشط 🟢
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#7f1d1d" }}>
                <strong>المقدار:</strong> {activeRecord.pages_description} • <strong>التكرار:</strong> {activeRecord.repetitions_count} مرات يومياً
                <br />
                <strong>المدة:</strong> من {activeRecord.start_date} إلى {activeRecord.end_date}
              </div>
              <div style={{ marginTop: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => handleCancelConsolidation(activeRecord.id)}
                  disabled={loading}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Trash2 size={14} />
                  <span>إلغاء هذا التثبيت فوراً واستئناف الخطة</span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: 1.5 }}>
              عند تفعيل هذا النظام، سيتم <strong>تجميد مؤشر الحفظ الحالي</strong> للطالب وإخفاء المهام الـ 6 الاعتيادية واستبدالها بمهمة التثبيت فقط بقيمة (30 نقطة و 15 جوهرة 💎). فور انتهاء التاريخ يستأنف النظام تلقائياً من حيث توقف.
            </p>

            {/* Dates Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  📅 تاريخ بدء التثبيت:
                </label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  📅 تاريخ انتهاء التثبيت:
                </label>
                <input
                  type="date"
                  required
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            {/* Pages Description */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                📖 المقدار المطلوب (نص حر يظهر للطالب):
              </label>
              <input
                type="text"
                required
                placeholder="مثال: من ص 1 إلى ص 10، أو: سورة الكهف كاملة"
                value={form.pages_description}
                onChange={e => setForm({ ...form, pages_description: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                }}
              />
            </div>

            {/* Repetitions Count */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  📿 عدد مرات التكرار المطلوبة يومياً:
                </label>
                <span style={{ fontWeight: 900, color: "#4f46e5", fontSize: "1rem" }}>
                  {form.repetitions_count} تكرارات
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={form.repetitions_count}
                onChange={e => setForm({ ...form, repetitions_count: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "#4f46e5" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
                <span>1 تكرار</span>
                <span>5</span>
                <span>10</span>
                <span>20 تكرار</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.85rem",
                  borderRadius: "0.85rem",
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                  color: "white",
                  fontWeight: 900,
                  fontSize: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <Shield size={18} />
                <span>{loading ? "جاري الحفظ..." : form.id ? "تحديث نظام التثبيت 💾" : "تفعيل نظام التثبيت اليدوي 🛡️"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "0.85rem 1.25rem",
                  borderRadius: "0.85rem",
                  border: "1.5px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#475569",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                إغلاق
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
