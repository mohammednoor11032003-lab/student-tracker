"use client"
import React, { useState, useEffect, useTransition } from "react"
import toast from "react-hot-toast"
import { Copy, ExternalLink, Calendar, RefreshCw, CheckCircle, AlertTriangle, XCircle, Search } from "lucide-react"
import { StudentDailyReportData } from "@/lib/whatsapp-reports-generator"

interface WhatsAppReportsManagerProps {
  initialReports: StudentDailyReportData[]
  initialDate: string
  todayStr: string
}

export default function WhatsAppReportsManager({
  initialReports,
  initialDate,
  todayStr,
}: WhatsAppReportsManagerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate)
  const [reportsCache, setReportsCache] = useState<Record<string, StudentDailyReportData[]>>({
    [initialDate]: initialReports,
  })
  const [reports, setReports] = useState<StudentDailyReportData[]>(initialReports)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch reports on date change with client-side cache
  useEffect(() => {
    if (reportsCache[selectedDate]) {
      setReports(reportsCache[selectedDate])
      return
    }

    let isCurrent = true
    setLoading(true)

    fetch(`/api/teacher/reports?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        if (isCurrent && data.success && data.reports) {
          setReports(data.reports)
          setReportsCache(prev => ({ ...prev, [selectedDate]: data.reports }))
        }
      })
      .catch(err => {
        console.error("Error fetching reports:", err)
        toast.error("حدث خطأ أثناء تحميل تقارير الطلاب")
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [selectedDate, reportsCache])

  function handleCopy(text: string, studentId: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(studentId)
        toast.success("تم نسخ التقرير بنجاح! 📋", { id: `copy_${studentId}`, duration: 2500 })
        setTimeout(() => setCopiedId(null), 2000)
      })
    } else {
      toast.error("تعذر النسخ التلقائي، يرجى تحديد النص ونسخه")
    }
  }

  function getYesterdayDateStr(): string {
    const [y, m, d] = todayStr.split("-").map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() - 1)
    const yyyy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, "0")
    const dd = String(dt.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const filteredReports = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return reports
    return reports.filter(r => r.studentName.toLowerCase().includes(q))
  }, [reports, searchQuery])

  const isSelectedDateToday = selectedDate === todayStr
  const isSelectedDateYesterday = selectedDate === getYesterdayDateStr()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Filter and Controls Card */}
      <div
        className="card"
        style={{
          borderRadius: "1.25rem",
          padding: "1.25rem 1.5rem",
          background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          border: "1px solid rgba(255,255,255,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.4rem",
                fontWeight: 900,
                color: "#1e1b4b",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontFamily: "'Tajawal', 'Cairo', sans-serif",
              }}
            >
              <span>📱</span>
              <span>تقارير الواتساب اليومية للطلاب</span>
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              توليد تقارير أداء الطلاب الذكية بصياغة جاهزة للنسخ أو الإرسال الفوري لولي الأمر عبر واتساب.
            </p>
          </div>

          {/* Date Picker & Presets */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {/* Quick buttons */}
            <button
              type="button"
              onClick={() => setSelectedDate(getYesterdayDateStr())}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "0.65rem",
                border: isSelectedDateYesterday ? "2px solid #2563eb" : "1px solid #cbd5e1",
                background: isSelectedDateYesterday ? "#dbeafe" : "white",
                color: isSelectedDateYesterday ? "#1d4ed8" : "#475569",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "'Tajawal', 'Cairo', sans-serif",
              }}
            >
              يوم الأمس (الموصى به)
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "0.65rem",
                border: isSelectedDateToday ? "2px solid #7c3aed" : "1px solid #cbd5e1",
                background: isSelectedDateToday ? "#f3e8ff" : "white",
                color: isSelectedDateToday ? "#6d28d9" : "#475569",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "'Tajawal', 'Cairo', sans-serif",
              }}
            >
              اليوم الحاضر
            </button>

            {/* Custom Date Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f8fafc", padding: "0.3rem 0.6rem", borderRadius: "0.75rem", border: "1.5px solid #cbd5e1" }}>
              <Calendar size={18} color="#64748b" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => e.target.value && setSelectedDate(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  color: "#1e293b",
                  cursor: "pointer",
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                }}
              />
            </div>
          </div>
        </div>

        {/* Search bar & info banner */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.85rem" }}>
          {/* Search box */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#f1f5f9", padding: "0.4rem 0.85rem", borderRadius: "0.75rem", flex: 1, maxWidth: "320px" }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.85rem",
                fontWeight: 700,
                width: "100%",
                color: "#1e293b",
                fontFamily: "'Tajawal', 'Cairo', sans-serif",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>
            <span>عدد الطلاب: {filteredReports.length}</span>
            {reports[0]?.isFriday && (
              <span style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                🕌 يوم جمعة (تفسير أسبوعي)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "white", fontSize: "1.1rem", fontWeight: 800 }}>
          جاري توليد وصياغة التقارير اليومية... ⏳
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
          لم يتم العثور على أي طلاب مطابقين للبحث.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {filteredReports.map(report => {
            const isCopied = copiedId === report.studentId
            const hasPhone = Boolean(report.parentPhone && report.parentPhone.length >= 10)

            return (
              <div
                key={report.studentId}
                className="card"
                style={{
                  borderRadius: "1.25rem",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                  background: "white",
                  border: report.status === "absent" ? "2px solid #fca5a5" : report.status === "present_unmemorized" ? "2px solid #fde68a" : "2px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Header info */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.5rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.15rem", color: "#1e1b4b", fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
                        {report.studentName}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.2rem" }}>
                        <span style={{ fontSize: "0.75rem", color: hasPhone ? "#15803d" : "#b45309", fontWeight: 700 }}>
                          📱 {hasPhone ? report.parentPhone : "لم يُسجل هاتف ولي الأمر"}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {report.status === "absent" ? (
                        <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                          ❌ غائب
                        </span>
                      ) : report.status === "present_unmemorized" ? (
                        <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                          ⚠️ حاضر (غير حافظ)
                        </span>
                      ) : (
                        <span style={{ background: "#dcfce7", color: "#166534", fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
                          ✅ حاضر وحافظ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mode / Plan tag */}
                  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                    {report.isFriday && (
                      <span style={{ fontSize: "0.7rem", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "0.1rem 0.45rem", borderRadius: "0.4rem", fontWeight: 700 }}>
                        🕌 مهام التفسير
                      </span>
                    )}
                    {report.hasConsolidation && (
                      <span style={{ fontSize: "0.7rem", background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe", padding: "0.1rem 0.45rem", borderRadius: "0.4rem", fontWeight: 700 }}>
                        🛡️ خطة تثبيت نشطة
                      </span>
                    )}
                    {!report.isFriday && !report.hasConsolidation && (
                      <span style={{ fontSize: "0.7rem", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "0.1rem 0.45rem", borderRadius: "0.4rem", fontWeight: 700 }}>
                        📖 خطة الحفظ العادية
                      </span>
                    )}
                  </div>

                  {/* Text Container with Preformatted Style */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.85rem",
                      padding: "0.9rem",
                      fontSize: "0.88rem",
                      lineHeight: "1.6",
                      color: "#1e293b",
                      whiteSpace: "pre-wrap",
                      fontFamily: "'Tajawal', 'Cairo', sans-serif",
                      maxHeight: "220px",
                      overflowY: "auto",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    {report.generatedText}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(report.generatedText, report.studentId)}
                    style={{
                      flex: 1,
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.75rem",
                      border: isCopied ? "1.5px solid #10b981" : "1.5px solid #cbd5e1",
                      background: isCopied ? "#ecfdf5" : "#f8fafc",
                      color: isCopied ? "#059669" : "#334155",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      transition: "all 0.15s",
                      fontFamily: "'Tajawal', 'Cairo', sans-serif",
                    }}
                  >
                    <Copy size={16} />
                    <span>{isCopied ? "تم النسخ ✓" : "نسخ النص"}</span>
                  </button>

                  {/* WhatsApp Direct Link Button */}
                  <a
                    href={report.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1.3,
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      background: hasPhone
                        ? "linear-gradient(135deg, #22c55e, #16a34a)"
                        : "#94a3b8",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      textDecoration: "none",
                      boxShadow: hasPhone ? "0 4px 12px rgba(22,163,74,0.3)" : "none",
                      transition: "all 0.15s",
                      fontFamily: "'Tajawal', 'Cairo', sans-serif",
                    }}
                    title={hasPhone ? "إرسال مباشر عبر واتساب" : "لم يتم تسجيل رقم ولي الأمر (سيفتح واتساب باختيار المستلم يدوياً)"}
                  >
                    <ExternalLink size={16} />
                    <span>إرسال عبر واتساب</span>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
