"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { StudentPlan, getDailyPlanDetails, calculateProjectedPlan } from "@/lib/plan-utils"

interface StudentPlanViewProps {
  plan: StudentPlan
  studentName: string
  todayStr: string
}

export default function StudentPlanView({ plan, studentName, todayStr }: StudentPlanViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  const isProjected = selectedDate > todayStr

  const { activePlan, planDetails, diffDays } = useMemo(() => {
    if (isProjected) {
      const res = calculateProjectedPlan(plan, selectedDate, todayStr)
      return {
        activePlan: res.projectedPlan,
        planDetails: res.planDetails,
        diffDays: res.diffDays,
      }
    }
    return {
      activePlan: plan,
      planDetails: getDailyPlanDetails(plan, selectedDate),
      diffDays: 0,
    }
  }, [plan, selectedDate, todayStr, isProjected])

  const percentComplete = Math.min(100, Math.round((activePlan.current_page / 604) * 100))

  function addDaysToSelected(days: number) {
    const [y, m, d] = todayStr.split("-").map(Number)
    const base = new Date(y, m - 1, d)
    base.setDate(base.getDate() + days)
    const yyyy = base.getFullYear()
    const mm = String(base.getMonth() + 1).padStart(2, "0")
    const dd = String(base.getDate()).padStart(2, "0")
    setSelectedDate(`${yyyy}-${mm}-${dd}`)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Banner */}
      <div style={{ textAlign: "center" }} className="fade-in-down">
        <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 15px rgba(0,0,0,0.2)" }}>
          خطة الحفظ اليومية 📖
        </h1>
        <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.25rem 0 0.75rem", fontSize: "0.95rem" }}>
          متابعة واستشراف ورد الحفظ والمراجعة للطالب: <strong>{studentName}</strong>
        </p>
      </div>

      {/* 1. Future Projection Calendar Card */}
      <div
        className="card"
        style={{
          background: "white",
          borderRadius: "1.25rem",
          padding: "1.1rem 1.35rem",
          border: isProjected ? "2px solid #0284c7" : "1px solid #e5e7eb",
          boxShadow: isProjected ? "0 8px 25px rgba(2,132,199,0.18)" : "0 4px 15px rgba(0,0,0,0.05)",
          transition: "all 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>📅</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#1f2937" }}>
                تقويم استشراف الخطة المستقبلية
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                اختر تاريخاً مستقبلياً لمعاينة المهام وموقع الحفظ بافتراض التزامك التام اليومي
              </span>
            </div>
          </div>

          {/* Date Picker Input */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="date"
              min={todayStr}
              max="2027-12-31"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value || todayStr)}
              style={{
                padding: "0.55rem 0.85rem",
                borderRadius: "0.65rem",
                border: "2px solid #0284c7",
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "#0369a1",
                outline: "none",
                background: "#f0f9ff",
                cursor: "pointer",
              }}
            />
            {isProjected && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                style={{
                  padding: "0.55rem 0.85rem",
                  borderRadius: "0.65rem",
                  background: "#e0f2fe",
                  color: "#0284c7",
                  border: "1px solid #bae6fd",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                اليوم ↩️
              </button>
            )}
          </div>
        </div>

        {/* Quick Projection Presets */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", marginLeft: "0.25rem" }}>
            قفز سريع:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            style={{
              padding: "0.3rem 0.65rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 800,
              cursor: "pointer",
              border: selectedDate === todayStr ? "2px solid #7c3aed" : "1px solid #cbd5e1",
              background: selectedDate === todayStr ? "#f3e8ff" : "white",
              color: selectedDate === todayStr ? "#6d28d9" : "#475569",
            }}
          >
            اليوم (الفعلي)
          </button>
          <button
            type="button"
            onClick={() => addDaysToSelected(7)}
            style={{ padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", border: "1px solid #cbd5e1", background: "white", color: "#475569" }}
          >
            + أسبوع (7 أيام)
          </button>
          <button
            type="button"
            onClick={() => addDaysToSelected(14)}
            style={{ padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", border: "1px solid #cbd5e1", background: "white", color: "#475569" }}
          >
            + أسبوعين (14 يوماً)
          </button>
          <button
            type="button"
            onClick={() => addDaysToSelected(30)}
            style={{ padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", border: "1px solid #cbd5e1", background: "white", color: "#475569" }}
          >
            + شهر (30 يوماً)
          </button>
          <button
            type="button"
            onClick={() => addDaysToSelected(90)}
            style={{ padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", border: "1px solid #cbd5e1", background: "white", color: "#475569" }}
          >
            + 3 أشهر (90 يوماً)
          </button>
          <button
            type="button"
            onClick={() => addDaysToSelected(180)}
            style={{ padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", border: "1px solid #cbd5e1", background: "white", color: "#475569" }}
          >
            + 6 أشهر
          </button>
          <button
            type="button"
            onClick={() => addDaysToSelected(365)}
            style={{ padding: "0.3rem 0.65rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", border: "1px solid #cbd5e1", background: "white", color: "#475569" }}
          >
            + سنة كاملة
          </button>
        </div>
      </div>

      {/* 2. Projected Mode Banner (Gold/Blue) */}
      {isProjected && (
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)",
            borderRadius: "1.25rem",
            padding: "1rem 1.35rem",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            border: "2px solid #38bdf8",
            boxShadow: "0 8px 25px rgba(2,132,199,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "2rem" }}>🌟</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.15rem", color: "#fef08a" }}>
                خطة مستقبلية متوقعة (بناءً على التزامك اليومي)
              </div>
              <div style={{ fontSize: "0.85rem", color: "#e0f2fe", marginTop: "0.15rem" }}>
                تاريخ العرض: <strong>{selectedDate}</strong> (بعد {diffDays} يوماً) • المهام المعروضة أدناه للمعاينة والاستشراف فقط (Read-only)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            style={{
              background: "#fef08a",
              color: "#854d0e",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.6rem",
              fontWeight: 900,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            العودة لمهام اليوم ↩️
          </button>
        </div>
      )}

      {/* 3. Main Quran Position Card */}
      <div
        className="card"
        style={{
          background: isProjected
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
            : "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "white",
          borderRadius: "1.5rem",
          padding: "1.5rem",
          boxShadow: isProjected
            ? "0 12px 30px rgba(15,23,42,0.4)"
            : "0 12px 30px rgba(49,46,129,0.4)",
          border: isProjected
            ? "2px solid rgba(56,189,248,0.4)"
            : "2px solid rgba(199,210,254,0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem" }}>🕌</span>
            <div>
              <span style={{ fontSize: "0.8rem", color: "#c7d2fe", fontWeight: 700 }}>
                {isProjected ? "الموقع المتوقع بالمصحف بحلول ذلك التاريخ" : "موقع الحفظ الحالي بالمصحف"}
              </span>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fef08a" }}>
                صفحة {activePlan.current_page} من 604
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {activePlan.is_in_consolidation && (
              <span
                style={{
                  background: "rgba(239,68,68,0.3)",
                  border: "1px solid #f87171",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: "#fecaca",
                }}
              >
                🛡️ في أسبوع التثبيت (الجزء {activePlan.consolidation_juz || planDetails.juz})
              </span>
            )}
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                fontWeight: 800,
                color: "#e0e7ff",
              }}
            >
              {activePlan.page_part === "top" ? "📌 النصف العلوي" : "📌 النصف السفلي"}
            </span>
          </div>
        </div>

        {/* 3 Metric Badges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", margin: "1rem 0" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#38bdf8" }}>الجزء {planDetails.juz}</div>
            <div style={{ fontSize: "0.75rem", color: "#c7d2fe", marginTop: "0.15rem" }}>📖 الجزء القرآني</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#4ade80", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={planDetails.hizbName}>
              {planDetails.hizbName}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#c7d2fe", marginTop: "0.15rem" }}>
              🔄 المراجعة ({planDetails.hizbIndex + 1} من {planDetails.totalCycleHizbs})
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#facc15" }}>%{percentComplete}</div>
            <div style={{ fontSize: "0.75rem", color: "#c7d2fe", marginTop: "0.15rem" }}>🌟 نسبة ختم المصحف</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#c7d2fe", marginBottom: "0.35rem" }}>
            <span>مسار ختم المصحف الشريف</span>
            <span>{activePlan.current_page} / 604 صفحة</span>
          </div>
          <div style={{ width: "100%", height: "0.65rem", background: "rgba(255,255,255,0.2)", borderRadius: "9999px", overflow: "hidden" }}>
            <div
              style={{
                width: `${percentComplete}%`,
                height: "100%",
                background: "linear-gradient(90deg, #38bdf8, #4ade80, #facc15)",
                borderRadius: "9999px",
                transition: "width 0.6s ease",
              }}
            />
          </div>
        </div>

        {/* Duration badge */}
        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#a5b4fc", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem" }}>
          <span>⏳ الخطة القرآنية مستمرة حتى نهاية شهر 12 لعام 2027 م</span>
        </div>
      </div>

      {/* Friday Rest Banner */}
      {planDetails.isFriday ? (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
            color: "white",
            textAlign: "center",
            padding: "2rem",
            borderRadius: "1.25rem",
            border: "2px solid #34d399",
            boxShadow: "0 10px 25px rgba(4,120,87,0.3)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🕌</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 900, color: "#fef08a" }}>
            جمعة مباركة - إجازة قرآنية
          </h2>
          <p style={{ margin: "0 auto", maxWidth: "450px", fontSize: "1rem", lineHeight: 1.6, opacity: 0.95 }}>
            {isProjected
              ? `يوافق تاريخ ${selectedDate} يوم جمعة، وهو يوم إجازة أسبوعية لا توجد فيه مهام حفظ مقررة.`
              : "اليوم الجمعة لا توجد مهام حفظ أو مراجعة مقررة. استمتع بقراءة سورة الكهف والصلاة على النبي ﷺ، وتقبل الله طاعاتكم!"}
          </p>
        </div>
      ) : planDetails.isInConsolidation ? (
        /* Auto-Consolidation Week Active View */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
              border: "2px solid #f87171",
              borderRadius: "1.25rem",
              padding: "1.25rem",
              color: "white",
              boxShadow: "0 8px 25px rgba(153,27,27,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "2rem" }}>🛡️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#fef08a" }}>
                  أسبوع التثبيت التلقائي - الجزء {planDetails.consolidationJuz}
                </h3>
                <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                  اليوم {planDetails.consolidationDay} من أصل 7 أيام تثبيت مكثف
                </span>
              </div>
            </div>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", color: "#fecaca", lineHeight: 1.5 }}>
              تهانينا بإتمام الجزء! تم تعليق مهام الدرس الخمس للتركيز التام على إتقان هذا الجزء، وتستمر مهمة المراجعة كالمعتاد.
            </p>
          </div>

          {/* Consolidation Task Card */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", borderLeft: "5px solid #dc2626" }}>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "0.85rem", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>
              🎯
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#1f2937" }}>
                  مهمة التثبيت المقررة (اليوم {planDetails.consolidationDay})
                </span>
                <span style={{ fontSize: "0.75rem", background: "#fee2e2", color: "#991b1b", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 800 }}>
                  الهدف: {planDetails.consolidationTask?.target} تكرارات
                </span>
                {isProjected && (
                  <span style={{ fontSize: "0.75rem", background: "#f0f9ff", color: "#0369a1", padding: "0.2rem 0.5rem", borderRadius: "9999px", fontWeight: 700 }}>
                    للقراءة فقط (محاكاة)
                  </span>
                )}
              </div>
              <p style={{ margin: "0.35rem 0 0", color: "#374151", fontSize: "1rem", fontWeight: 800 }}>
                {planDetails.consolidationTask?.title}
              </p>
            </div>
          </div>

          {/* Revision Task Card (remains active!) */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", borderLeft: "5px solid #ec4899" }}>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "0.85rem", background: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>
              🔄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#1f2937" }}>المراجعة</span>
                <span style={{ fontSize: "0.75rem", background: "#fce7f3", color: "#db2777", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>حزب كامل</span>
              </div>
              <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "1rem", fontWeight: 700 }}>
                {planDetails.tasks.revision}
              </p>
              <span style={{ display: "inline-block", fontSize: "0.75rem", color: "#db2777", marginTop: "0.2rem", fontWeight: 700 }}>
                الحزب {planDetails.hizbIndex + 1} من أصل {planDetails.totalCycleHizbs} في دورة المراجعة الخاصة بك
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* The 6 Interconnected Daily Tasks Cards */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "white", padding: "0 0.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900 }}>
              {isProjected ? `📋 مهام الورد المتوقعة لتاريخ ${selectedDate}` : "📋 ورد اليوم المترابط (6 مهام)"}
            </h3>
            <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
              {isProjected ? "مُولدة عبر محرك المحاكاة" : "مُولدة تلقائياً بحسب الخطة"}
            </span>
          </div>

          {/* 1. الدرس */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderLeft: "5px solid #7c3aed" }}>
            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              📖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#1f2937" }}>الدرس (الحفظ الجديد)</span>
                <span style={{ fontSize: "0.75rem", background: "#f3e8ff", color: "#7c3aed", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>نصف صفحة</span>
              </div>
              <p style={{ margin: "0.2rem 0 0", color: "#6b7280", fontSize: "0.95rem", fontWeight: 700 }}>
                {planDetails.tasks.lesson}
              </p>
            </div>
          </div>

          {/* 2. السماع */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderLeft: "5px solid #3b82f6" }}>
            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              🎧
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#1f2937" }}>السماع</span>
                <span style={{ fontSize: "0.75rem", background: "#dbeafe", color: "#2563eb", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>استماع للشيخ</span>
              </div>
              <p style={{ margin: "0.2rem 0 0", color: "#6b7280", fontSize: "0.95rem", fontWeight: 700 }}>
                {planDetails.tasks.listening}
              </p>
            </div>
          </div>

          {/* 3. جنب الدرس */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderLeft: "5px solid #f59e0b" }}>
            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              🔗
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#1f2937" }}>جنب الدرس (الربط)</span>
                <span style={{ fontSize: "0.75rem", background: "#fef3c7", color: "#d97706", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>صفحتين سابقتين</span>
              </div>
              <p style={{ margin: "0.2rem 0 0", color: "#6b7280", fontSize: "0.95rem", fontWeight: 700 }}>
                {planDetails.tasks.adjacentLesson}
              </p>
            </div>
          </div>

          {/* 4. التفسير */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderLeft: "5px solid #10b981" }}>
            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              📜
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#1f2937" }}>التفسير</span>
                <span style={{ fontSize: "0.75rem", background: "#d1fae5", color: "#059669", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>فهم وتدبر</span>
              </div>
              <p style={{ margin: "0.2rem 0 0", color: "#6b7280", fontSize: "0.95rem", fontWeight: 700 }}>
                {planDetails.tasks.tafsir}
              </p>
            </div>
          </div>

          {/* 5. المراجعة */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderLeft: "5px solid #ec4899" }}>
            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              🔄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#1f2937" }}>المراجعة</span>
                <span style={{ fontSize: "0.75rem", background: "#fce7f3", color: "#db2777", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>حزب كامل</span>
              </div>
              <p style={{ margin: "0.2rem 0 0", color: "#6b7280", fontSize: "0.95rem", fontWeight: 700 }}>
                {planDetails.tasks.revision}
              </p>
              <span style={{ display: "inline-block", fontSize: "0.75rem", color: "#db2777", marginTop: "0.2rem", fontWeight: 700 }}>
                الحزب {planDetails.hizbIndex + 1} من أصل {planDetails.totalCycleHizbs} في دورة المراجعة الخاصة بك
              </span>
            </div>
          </div>

          {/* 6. قيام الليل */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", borderLeft: "5px solid #6366f1" }}>
            <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              🌙
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 900, fontSize: "1.05rem", color: "#1f2937" }}>قيام الليل</span>
                <span style={{ fontSize: "0.75rem", background: "#e0e7ff", color: "#4f46e5", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 800 }}>تثبيت بالصلاة</span>
              </div>
              <p style={{ margin: "0.2rem 0 0", color: "#6b7280", fontSize: "0.95rem", fontWeight: 700 }}>
                {planDetails.tasks.nightPrayer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {isProjected ? (
        <button
          type="button"
          onClick={() => setSelectedDate(todayStr)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "white",
            padding: "1rem",
            borderRadius: "1rem",
            fontWeight: 900,
            fontSize: "1.1rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 25px rgba(2,132,199,0.35)",
            textAlign: "center",
          }}
        >
          <span>↩️</span>
          <span>العودة لمهام اليوم لتسجيل الإنجاز التفاعلي</span>
        </button>
      ) : (
        <Link
          href="/student"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            color: "white",
            padding: "1rem",
            borderRadius: "1rem",
            fontWeight: 900,
            fontSize: "1.1rem",
            textDecoration: "none",
            boxShadow: "0 8px 25px rgba(124,58,237,0.35)",
            textAlign: "center",
            transition: "transform 0.2s",
          }}
        >
          <span>🎯</span>
          <span>الانتقال لتسجيل إنجاز المهام اليومية</span>
        </Link>
      )}
    </div>
  )
}

