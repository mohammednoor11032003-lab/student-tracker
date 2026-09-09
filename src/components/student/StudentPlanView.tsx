"use client"
import Link from "next/link"
import { StudentPlan, getDailyPlanDetails } from "@/lib/plan-utils"

interface StudentPlanViewProps {
  plan: StudentPlan
  studentName: string
  todayStr: string
}

export default function StudentPlanView({ plan, studentName, todayStr }: StudentPlanViewProps) {
  const planDetails = getDailyPlanDetails(plan, todayStr)
  const percentComplete = Math.min(100, Math.round((plan.current_page / 604) * 100))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Banner */}
      <div style={{ textAlign: "center" }} className="fade-in-down">
        <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 15px rgba(0,0,0,0.2)" }}>
          خطة الحفظ اليومية 📖
        </h1>
        <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.25rem 0 0.75rem", fontSize: "0.95rem" }}>
          متابعة ورد الحفظ والمراجعة للطالب: <strong>{studentName}</strong>
        </p>
      </div>

      {/* Main Quran Position Card */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "white",
          borderRadius: "1.5rem",
          padding: "1.5rem",
          boxShadow: "0 12px 30px rgba(49,46,129,0.4)",
          border: "2px solid rgba(199,210,254,0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem" }}>🕌</span>
            <div>
              <span style={{ fontSize: "0.8rem", color: "#c7d2fe", fontWeight: 700 }}>موقع الحفظ الحالي بالمصحف</span>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fef08a" }}>
                صفحة {plan.current_page} من 604
              </h2>
            </div>
          </div>
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
            {plan.page_part === "top" ? "📌 النصف العلوي" : "📌 النصف السفلي"}
          </span>
        </div>

        {/* 3 Metric Badges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", margin: "1rem 0" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#38bdf8" }}>الجزء {planDetails.juz}</div>
            <div style={{ fontSize: "0.75rem", color: "#c7d2fe", marginTop: "0.15rem" }}>📖 الجزء الحالي</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#4ade80" }}>الحزب {plan.current_review_hizb}</div>
            <div style={{ fontSize: "0.75rem", color: "#c7d2fe", marginTop: "0.15rem" }}>🔄 حزب المراجعة</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "1rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#facc15" }}>%{percentComplete}</div>
            <div style={{ fontSize: "0.75rem", color: "#c7d2fe", marginTop: "0.15rem" }}>🌟 نسبة إنجاز المصحف</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#c7d2fe", marginBottom: "0.35rem" }}>
            <span>مسار ختم المصحف الشريف</span>
            <span>{plan.current_page} / 604 صفحة</span>
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
            اليوم الجمعة لا توجد مهام حفظ أو مراجعة مقررة. استمتع بقراءة سورة الكهف والصلاة على النبي ﷺ، وتقبل الله طاعاتكم!
          </p>
        </div>
      ) : (
        /* The 6 Interconnected Daily Tasks Cards */
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "white", padding: "0 0.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900 }}>📋 ورد اليوم المترابط (6 مهام)</h3>
            <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>مُولدة تلقائياً بحسب الخطة</span>
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

      {/* Action Button to My Tasks */}
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
    </div>
  )
}
