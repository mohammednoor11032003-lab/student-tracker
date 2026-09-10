"use client"
import React, { useState, useEffect } from "react"
import { Shield, X, Calendar, BookOpen, AlertCircle, CheckCircle2, Trash2, Sparkles, Clock, ArrowRight } from "lucide-react"
import toast from "react-hot-toast"
import { ManualConsolidation, countWorkingDays, calculateEndDateForWorkingDays } from "@/lib/manual-consolidation-utils"

interface ManualConsolidationModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  todayStr: string
  suggestedResumePointer?: string
  initialEditItem?: ManualConsolidation | null
  onSaved?: () => void
}

export default function ManualConsolidationModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  todayStr,
  suggestedResumePointer,
  initialEditItem,
  onSaved,
}: ManualConsolidationModalProps) {
  const [loading, setLoading] = useState(false)
  const [existingList, setExistingList] = useState<ManualConsolidation[]>([])
  
  // Form State
  const [id, setId] = useState<string>("")
  const [startPage, setStartPage] = useState<number>(1)
  const [endPage, setEndPage] = useState<number>(20)
  const [dailyPagesCount, setDailyPagesCount] = useState<number>(4)
  const [startDate, setStartDate] = useState<string>(todayStr)
  const [endDate, setEndDate] = useState<string>("")
  const [includeFridays, setIncludeFridays] = useState<boolean>(false)
  const [hasHarvestDay, setHasHarvestDay] = useState<boolean>(false)
  const [harvestDaysCount, setHarvestDaysCount] = useState<number>(1)
  const [resumePagePointer, setResumePagePointer] = useState<string>(suggestedResumePointer || "ص 1 النصف العلوي")
  const [repetitionsCount, setRepetitionsCount] = useState<number>(5)

  // Calculations
  const totalPages = Math.max(0, endPage - startPage + 1)
  const reviewDays = dailyPagesCount > 0 ? Math.ceil(totalPages / dailyPagesCount) : 0
  const harvestDays = hasHarvestDay ? Number(harvestDaysCount) : 0
  const totalRequiredDays = reviewDays + harvestDays

  // Calculate actual available working days between startDate and endDate (Fridays handled)
  const availableDays = countWorkingDays(startDate, endDate, includeFridays)

  const isDurationInsufficient = Boolean(
    startDate && endDate && totalRequiredDays > 0 && availableDays < totalRequiredDays
  )

  // Calculate recommended end date based on startDate + totalRequiredDays working days
  const recommendedEndDate = calculateEndDateForWorkingDays(startDate, totalRequiredDays, includeFridays)

  // Calculate next day after end date for normal plan resumption date
  const resumptionDate = (() => {
    if (!endDate) return ""
    const d = new Date(endDate + "T00:00:00")
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
  })()

  // Load existing consolidations when opened
  useEffect(() => {
    if (!isOpen || !studentId) return

    let isMounted = true
    async function fetchConsolidations() {
      try {
        const res = await fetch(`/api/manual-consolidation?studentId=${studentId}`)
        const data = await res.json()
        if (isMounted && data.success && data.consolidations) {
          setExistingList(data.consolidations)
        }
      } catch (err) {
        console.error("Failed to load manual consolidations:", err)
      }
    }

    fetchConsolidations()

    // Setup initial form
    if (initialEditItem) {
      setId(initialEditItem.id)
      setStartPage(initialEditItem.start_page)
      setEndPage(initialEditItem.end_page)
      setDailyPagesCount(initialEditItem.daily_pages_count)
      setStartDate(initialEditItem.start_date)
      setEndDate(initialEditItem.end_date)
      setIncludeFridays(Boolean(initialEditItem.include_fridays))
      setHasHarvestDay(initialEditItem.has_harvest_day)
      setHarvestDaysCount(initialEditItem.harvest_days_count || 1)
      setResumePagePointer(initialEditItem.resume_page_pointer || suggestedResumePointer || "ص 1 النصف العلوي")
      setRepetitionsCount(initialEditItem.repetitions_count || 5)
    } else {
      setId("")
      setStartPage(1)
      setEndPage(20)
      setDailyPagesCount(4)
      setStartDate(todayStr)
      setIncludeFridays(false)
      setHasHarvestDay(false)
      setHarvestDaysCount(1)
      setResumePagePointer(suggestedResumePointer || "ص 1 النصف العلوي")
      setRepetitionsCount(5)
      
      // Auto set end date: 20 pages / 4 = 5 working days (skipping Fridays by default)
      const initialEnd = calculateEndDateForWorkingDays(todayStr, 5, false)
      setEndDate(initialEnd)
    }

    return () => {
      isMounted = false
    }
  }, [isOpen, studentId, todayStr, initialEditItem, suggestedResumePointer])

  function handleAutoFixEndDate() {
    if (recommendedEndDate) {
      setEndDate(recommendedEndDate)
      toast.success(`تم ضبط تاريخ الانتهاء تلقائياً إلى ${recommendedEndDate} (${totalRequiredDays} أيام عمل فعلية) ✓`)
    }
  }

  function handleResetNewForm() {
    setId("")
    setStartPage(1)
    setEndPage(20)
    setDailyPagesCount(4)
    setStartDate(todayStr)
    setIncludeFridays(false)
    setHasHarvestDay(false)
    setHarvestDaysCount(1)
    setResumePagePointer(suggestedResumePointer || "ص 1 النصف العلوي")
    setRepetitionsCount(5)
    const initialEnd = calculateEndDateForWorkingDays(todayStr, 5, false)
    setEndDate(initialEnd)
  }

  function handleSelectToEdit(item: ManualConsolidation) {
    setId(item.id)
    setStartPage(item.start_page)
    setEndPage(item.end_page)
    setDailyPagesCount(item.daily_pages_count)
    setStartDate(item.start_date)
    setEndDate(item.end_date)
    setIncludeFridays(Boolean(item.include_fridays))
    setHasHarvestDay(item.has_harvest_day)
    setHarvestDaysCount(item.harvest_days_count || 1)
    setResumePagePointer(item.resume_page_pointer)
    setRepetitionsCount(item.repetitions_count || 5)
  }

  async function handleDeleteConsolidation(consolidationId: string) {
    if (!confirm("هل أنت متأكد من حذف نظام التثبيت هذا؟")) return
    try {
      const res = await fetch("/api/manual-consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: consolidationId, studentId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("تم حذف نظام التثبيت بنجاح")
        setExistingList(prev => prev.filter(x => x.id !== consolidationId))
        if (id === consolidationId) {
          handleResetNewForm()
        }
        if (onSaved) onSaved()
      } else {
        toast.error(data.error || "فشل الحذف")
      }
    } catch {
      toast.error("حدث خطأ أثناء الحذف")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (startPage < 1 || endPage < startPage) {
      toast.error("نطاق الصفحات غير صحيح!")
      return
    }

    if (dailyPagesCount < 1) {
      toast.error("المقدار اليومي يجب أن يكون صفحة واحدة على الأقل")
      return
    }

    if (!startDate || !endDate) {
      toast.error("يرجى تحديد تاريخ البدء وتاريخ الانتهاء")
      return
    }

    if (startDate > endDate) {
      toast.error("تاريخ البدء يجب أن يكون قبل أو يساوي تاريخ الانتهاء")
      return
    }

    if (isDurationInsufficient) {
      toast.error(`المدة الزمنية المحددة لا تكفي لإنجاز هذه الصفحات بهذا المقدار اليومي! (المطلوب: ${totalRequiredDays} أيام، المتاح: ${availableDays} أيام)`)
      return
    }

    if (!resumePagePointer.trim()) {
      toast.error("يرجى تحديد مكان استئناف الحفظ بعد انتهاء النظام")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/manual-consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id || undefined,
          studentId,
          start_page: startPage,
          end_page: endPage,
          daily_pages_count: dailyPagesCount,
          start_date: startDate,
          end_date: endDate,
          include_fridays: includeFridays,
          has_harvest_day: hasHarvestDay,
          harvest_days_count: hasHarvestDay ? harvestDaysCount : 0,
          resume_page_pointer: resumePagePointer.trim(),
          repetitions_count: repetitionsCount || 5,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(id ? "تم تحديث نظام التثبيت بنجاح 🛡️" : "تم إنشاء نظام التثبيت بنجاح 🛡️✨")
        if (onSaved) onSaved()
        onClose()
      } else {
        toast.error(data.error || "فشل في حفظ البيانات")
      }
    } catch (err) {
      console.error(err)
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1e1b4b 0%, #31104b 100%)",
            color: "white",
            borderTopLeftRadius: "1.5rem",
            borderTopRightRadius: "1.5rem",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #f43f5e, #be123c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(244, 63, 94, 0.4)",
              }}
            >
              <Shield size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                {id ? "تعديل نظام التثبيت اليدوي الذكي" : "إنشاء نظام تثبيت يدوي ذكي"}
              </h2>
              <span style={{ fontSize: "0.85rem", color: "#fca5a5" }}>
                للطالب: <strong>{studentName}</strong> (حساب الصفحات والأيام تلقائياً)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Top Info Banner */}
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "0.85rem",
              padding: "0.9rem 1.1rem",
              fontSize: "0.88rem",
              color: "#1e40af",
              display: "flex",
              gap: "0.6rem",
              alignItems: "flex-start",
            }}
          >
            <Sparkles size={20} style={{ flexShrink: 0, marginTop: "2px", color: "#2563eb" }} />
            <div>
              <strong>نظام التثبيت الذكي:</strong> يقوم بحساب الأيام اللازمة وتقسيم الصفحات اليومية على الطالب تلقائياً، مع تجميد خطة الحفظ الاعتيادية، وإتاحة خيار يوم الحصاد الشامل، ثم استئناف الخطة بسلاسة من الصفحة المحددة.
            </div>
          </div>

          {/* Existing consolidations quick-switch if multiple exist */}
          {existingList.length > 0 && (
            <div style={{ background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>
                  📋 أنظمة التثبيت المسجلة لهذا الطالب ({existingList.length}):
                </span>
                {id && (
                  <button
                    type="button"
                    onClick={handleResetNewForm}
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + إنشاء نظام جديد منفصل
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {existingList.map(c => {
                  const isSelected = c.id === id
                  const isCurrentlyActive = todayStr >= c.start_date && todayStr <= c.end_date
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectToEdit(c)}
                      style={{
                        padding: "0.4rem 0.75rem",
                        borderRadius: "0.5rem",
                        background: isSelected ? "#e0e7ff" : "white",
                        border: isSelected ? "1.5px solid #4f46e5" : "1px solid #cbd5e1",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span>{isCurrentlyActive ? "🟢" : c.start_date > todayStr ? "⏳" : "🏁"}</span>
                      <span style={{ fontWeight: 700 }}>
                        من ص {c.start_page} إلى {c.end_page}
                      </span>
                      <span style={{ color: "#64748b" }}>({c.start_date} إلى {c.end_date})</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section 1: Pages Range & Daily Count */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              background: "#fafafa",
              padding: "1rem",
              borderRadius: "1rem",
              border: "1px solid #f1f5f9",
            }}
          >
            {/* Start Page */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                📖 من صفحة:
              </label>
              <input
                type="number"
                min={1}
                max={604}
                value={startPage}
                onChange={e => setStartPage(Math.max(1, Math.min(604, Number(e.target.value))))}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  border: "1px solid #cbd5e1",
                  fontSize: "1rem",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            {/* End Page */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                📖 إلى صفحة:
              </label>
              <input
                type="number"
                min={startPage}
                max={604}
                value={endPage}
                onChange={e => setEndPage(Math.max(1, Math.min(604, Number(e.target.value))))}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  border: "1px solid #cbd5e1",
                  fontSize: "1rem",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            {/* Daily Pages Count */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                ⚡ المقدار اليومي (صفحات/يوم):
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={dailyPagesCount}
                onChange={e => setDailyPagesCount(Math.max(1, Number(e.target.value)))}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  border: "1px solid #cbd5e1",
                  fontSize: "1rem",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Live Pages & Review Calculation Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "0.65rem 1rem",
              borderRadius: "0.75rem",
              fontSize: "0.85rem",
              color: "#166534",
              fontWeight: 700,
            }}
          >
            <div>
              إجمالي الصفحات المطلوبة: <strong>{totalPages} صفحة</strong>
            </div>
            <div>
              أيام المراجعة المطلوبة: <strong>{reviewDays} أيام</strong> ({dailyPagesCount} صفحات يومياً)
            </div>
          </div>

          {/* Section 2: Harvest Day Option */}
          <div
            style={{
              background: hasHarvestDay ? "#fffbeb" : "#f8fafc",
              border: hasHarvestDay ? "1.5px solid #f59e0b" : "1px solid #e2e8f0",
              borderRadius: "1rem",
              padding: "1rem",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hasHarvestDay}
                  onChange={e => setHasHarvestDay(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#f59e0b" }}
                />
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#92400e" }}>
                  🌾 تفعيل "يوم حصاد التثبيت" (تسميع كل ما سبق دفعة واحدة في نهاية الفترة)
                </span>
              </label>

              {hasHarvestDay && (
                <span style={{ fontSize: "0.8rem", background: "#fef3c7", color: "#b45309", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 800 }}>
                  مفعّل 🌾
                </span>
              )}
            </div>

            {hasHarvestDay && (
              <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px dashed #fde68a" }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#78350f", marginBottom: "0.5rem" }}>
                  كم عدد أيام الحصاد المطلوبة في نهاية الفترة؟
                </span>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {[
                    { count: 1, label: "يوم واحد (1 يوم)" },
                    { count: 2, label: "يومان (2 يوم)" },
                    { count: 3, label: "3 أيام (3 أيام)" },
                  ].map(opt => {
                    const isSelected = harvestDaysCount === opt.count
                    return (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={() => setHarvestDaysCount(opt.count)}
                        style={{
                          padding: "0.45rem 1rem",
                          borderRadius: "0.65rem",
                          border: isSelected ? "2px solid #b45309" : "1px solid #d97706",
                          background: isSelected ? "#f59e0b" : "white",
                          color: isSelected ? "white" : "#92400e",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2.5: Friday Handling Option (استثناء أيام الجمعة) */}
          <div
            style={{
              background: includeFridays ? "#f0fdf4" : "#f8fafc",
              border: includeFridays ? "1.5px solid #22c55e" : "1px solid #e2e8f0",
              borderRadius: "1rem",
              padding: "1rem",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={includeFridays}
                  onChange={e => setIncludeFridays(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#16a34a" }}
                />
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>
                  تضمين يوم الجمعة في خطة التثبيت (إذا تُرك فارغاً سيكون الجمعة يوم إجازة)
                </span>
              </label>

              <span
                style={{
                  fontSize: "0.8rem",
                  background: includeFridays ? "#dcfce7" : "#e2e8f0",
                  color: includeFridays ? "#15803d" : "#475569",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  fontWeight: 800,
                }}
              >
                {includeFridays ? "الجمعة مشمول ⚡" : "الجمعة إجازة 🕌"}
              </span>
            </div>
            <p style={{ margin: "0.4rem 0 0 1.8rem", fontSize: "0.82rem", color: "#64748b" }}>
              {includeFridays
                ? "سيتم احتساب يوم الجمعة كيوم عمل وتوليد مهام تثبيت فيه."
                : "يوم الجمعة إجازة رسمية: لن يتم توليد أي مهام فيه، وتُحسب فقط أيام العمل الفعلية عند التحقق من كفاية المدة."}
            </p>
          </div>

          {/* Section 3: Time Period Dates */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              background: "#fafafa",
              padding: "1rem",
              borderRadius: "1rem",
              border: "1px solid #f1f5f9",
            }}
          >
            {/* Start Date */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                📅 تاريخ بدء التثبيت:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                📅 تاريخ انتهاء التثبيت:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "0.65rem",
                  border: isDurationInsufficient ? "2px solid #ef4444" : "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Strict Validation Alert if Duration is Insufficient */}
          {isDurationInsufficient && (
            <div
              style={{
                background: "#fef2f2",
                border: "2px solid #f87171",
                borderRadius: "0.85rem",
                padding: "1rem",
                color: "#991b1b",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, fontSize: "0.95rem" }}>
                <AlertCircle size={22} color="#dc2626" />
                <span>المدة الزمنية المحددة لا تكفي لإنجاز هذه الصفحات بهذا المقدار اليومي!</span>
              </div>
              <div style={{ fontSize: "0.88rem", lineHeight: "1.4" }}>
                • الأيام المطلوبة لإنجاز المهمة: <strong>{totalRequiredDays} أيام عمل فعلية</strong> ({reviewDays} أيام مراجعة {hasHarvestDay ? `+ ${harvestDays} أيام حصاد` : ""}).
                <br />
                • الأيام المتاحة بين التاريخين: <strong>{availableDays} أيام عمل فعلية</strong> {!includeFridays ? "(مستثنياً أيام الجمعة كإجازة)" : "(شاملاً أيام الجمعة)"}.
              </div>
              
              {recommendedEndDate && (
                <button
                  type="button"
                  onClick={handleAutoFixEndDate}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: "0.25rem",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span>💡 ضبط تاريخ الانتهاء تلقائياً إلى {recommendedEndDate} ({totalRequiredDays} أيام)</span>
                </button>
              )}
            </div>
          )}

          {/* Section 4: Resume Page Pointer */}
          <div
            style={{
              background: "#f8fafc",
              padding: "1rem",
              borderRadius: "1rem",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 800, color: "#1e293b" }}>
              📌 موضع استئناف خطة الحفظ التلقائية بعد انتهاء النظام:
            </label>
            <input
              type="text"
              value={resumePagePointer}
              onChange={e => setResumePagePointer(e.target.value)}
              placeholder="مثال: ص 44 النصف العلوي"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "0.65rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem",
                fontWeight: 700,
                outline: "none",
              }}
            />
            {resumptionDate && (
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>
                📅 موعد استئناف خطة الحفظ التلقائية: <strong>{resumptionDate}</strong> بدءاً من <strong>{resumePagePointer || "..."}</strong>.
              </span>
            )}
          </div>

          {/* Repetitions Count Setting */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>
              🎯 هدف التكرار اليومي للعداد التفاعلي:
            </span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {[3, 5, 7, 10].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setRepetitionsCount(cnt)}
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "0.5rem",
                    border: repetitionsCount === cnt ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                    background: repetitionsCount === cnt ? "#4f46e5" : "white",
                    color: repetitionsCount === cnt ? "white" : "#475569",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {cnt} تكرارات
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
            {id && (
              <button
                type="button"
                onClick={() => handleDeleteConsolidation(id)}
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.75rem",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginRight: "auto",
                }}
              >
                <Trash2 size={16} />
                <span>حذف هذا النظام</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                padding: "0.75rem 1.25rem",
                borderRadius: "0.75rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={loading || isDurationInsufficient}
              style={{
                background: isDurationInsufficient
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #f43f5e, #be123c)",
                color: "white",
                border: "none",
                padding: "0.75rem 1.75rem",
                borderRadius: "0.75rem",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: isDurationInsufficient || loading ? "not-allowed" : "pointer",
                boxShadow: isDurationInsufficient ? "none" : "0 4px 14px rgba(244, 63, 94, 0.35)",
              }}
            >
              {loading ? "جاري الحفظ..." : id ? "تحديث نظام التثبيت 💾" : "اعتماد نظام التثبيت 🛡️"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
