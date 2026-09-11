"use client"

import { useState } from "react"
import { StudentBankSummary, BankTransaction } from "@/lib/bank-types"
import toast from "react-hot-toast"
import { Search, PlusCircle, MinusCircle, History, Sparkles, RefreshCw, AlertCircle } from "lucide-react"

interface TeacherBankManagerProps {
  initialSummaries: StudentBankSummary[]
}

export default function TeacherBankManager({ initialSummaries }: TeacherBankManagerProps) {
  const [summaries, setSummaries] = useState<StudentBankSummary[]>(initialSummaries)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "has_balance" | "has_spent">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAwardingStars, setIsAwardingStars] = useState(false)

  // Modals state
  const [activeSpendStudent, setActiveSpendStudent] = useState<StudentBankSummary | null>(null)
  const [spendAmount, setSpendAmount] = useState<string>("1")
  const [spendDescription, setSpendDescription] = useState<string>("")
  const [isSubmittingSpend, setIsSubmittingSpend] = useState(false)

  const [activeOverrideStudent, setActiveOverrideStudent] = useState<StudentBankSummary | null>(null)
  const [overrideField, setOverrideField] = useState<"current_balance" | "total_earned">("current_balance")
  const [overrideValue, setOverrideValue] = useState<string>("")
  const [overrideReason, setOverrideReason] = useState<string>("")
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false)

  const [activeHistoryStudent, setActiveHistoryStudent] = useState<StudentBankSummary | null>(null)

  // Refresh data from API
  async function refreshData() {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/bank?all=true")
      const data = await res.json()
      if (data.success && data.summaries) {
        setSummaries(data.summaries)
        toast.success("تم تحديث البيانات بنجاح")
      } else {
        toast.error(data.error || "فشل تحديث البيانات")
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Check and award star rewards
  async function handleAwardStars() {
    setIsAwardingStars(true)
    toast.loading("جاري فحص وتوزيع مكافآت نجوم الأسبوع والشهر...", { id: "award-stars" })
    try {
      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "award_stars" }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.awardedCount > 0) {
          toast.success(`تم توزيع مكافآت النجوم بنجاح لـ ${data.awardedCount} مركزاً! 🌟`, { id: "award-stars" })
        } else {
          toast.success("تم الفحص: جميع مكافآت النجوم السابقة موزعة مسبقاً ولا توجد مكافآت معلقة حالياً.", { id: "award-stars" })
        }
        await refreshData()
      } else {
        toast.error(data.error || "فشل توزيع المكافآت", { id: "award-stars" })
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء محاولة توزيع المكافآت", { id: "award-stars" })
    } finally {
      setIsAwardingStars(false)
    }
  }

  // Handle Spend Submit
  async function handleSpendSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeSpendStudent) return

    const amountNum = parseFloat(spendAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح أكبر من 0")
      return
    }

    if (!spendDescription.trim()) {
      toast.error("يرجى كتابة وصف لعملية الصرف")
      return
    }

    setIsSubmittingSpend(true)
    try {
      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "spend",
          studentId: activeSpendStudent.student_id,
          amount: amountNum,
          description: spendDescription.trim(),
        }),
      })

      const data = await res.json()
      if (data.success && data.summary) {
        toast.success(`تم تسجيل صرف ${amountNum} دينار للطالب ${activeSpendStudent.student_name} بنجاح 🛍️`)
        setSummaries(prev =>
          prev.map(s => (s.student_id === activeSpendStudent.student_id ? data.summary : s))
        )
        setActiveSpendStudent(null)
        setSpendAmount("1")
        setSpendDescription("")
      } else {
        toast.error(data.error || "فشل تسجيل عملية الصرف")
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء تسجيل عملية الصرف")
    } finally {
      setIsSubmittingSpend(false)
    }
  }

  // Handle Manual Override Submit
  async function handleOverrideSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOverrideStudent) return

    const targetValNum = parseFloat(overrideValue)
    if (isNaN(targetValNum) || targetValNum < 0) {
      toast.error("يرجى إدخال قيمة عددية صحيحة أكبر من أو تساوي 0")
      return
    }

    if (!overrideReason.trim()) {
      toast.error("يرجى ذكر سبب التعديل الإداري")
      return
    }

    setIsSubmittingOverride(true)
    try {
      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override",
          studentId: activeOverrideStudent.student_id,
          targetField: overrideField,
          targetValue: targetValNum,
          reason: overrideReason.trim(),
        }),
      })

      const data = await res.json()
      if (data.success && data.summary) {
        toast.success(`تم تحديث الحساب المالي للطالب ${activeOverrideStudent.student_name} بنجاح ⚖️`)
        setSummaries(prev =>
          prev.map(s => (s.student_id === activeOverrideStudent.student_id ? data.summary : s))
        )
        setActiveOverrideStudent(null)
        setOverrideValue("")
        setOverrideReason("")
      } else {
        toast.error(data.error || "فشل إجراء التعديل")
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالخادم")
    } finally {
      setIsSubmittingOverride(false)
    }
  }

  // Quick preset description helper
  function applyPreset(amt: number, desc: string) {
    setSpendAmount(amt.toString())
    setSpendDescription(desc)
  }

  // Filtered students
  const filteredSummaries = summaries.filter(s => {
    const matchesSearch = s.student_name.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (filterType === "has_balance") return s.current_balance > 0
    if (filterType === "has_spent") return s.total_spent > 0
    return true
  })

  // Global calculations
  const totalEarnedAll = summaries.reduce((acc, s) => acc + s.total_earned, 0)
  const totalSpentAll = summaries.reduce((acc, s) => acc + s.total_spent, 0)
  const currentBalanceAll = summaries.reduce((acc, s) => acc + s.current_balance, 0)
  const studentsWithBalance = summaries.filter(s => s.current_balance > 0).length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        padding: "1.5rem 2rem",
        borderRadius: "1.5rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div>
          <h1 style={{ color: "white", fontSize: "1.85rem", fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🏦</span> بنك الدنانير
          </h1>
          <p style={{ color: "#c7d2fe", margin: "0.4rem 0 0 0", fontSize: "0.95rem" }}>
            إدارة الحسابات المالية الواقعية، صرف المكافآت، وفحص وتوزيع مكافآت نجوم الأسبوع والشهر
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              padding: "0.6rem 1.1rem",
              borderRadius: "0.85rem",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
              transition: "all 0.2s"
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <button
            onClick={handleAwardStars}
            disabled={isAwardingStars}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              border: "none",
              padding: "0.6rem 1.25rem",
              borderRadius: "0.85rem",
              cursor: isAwardingStars ? "not-allowed" : "pointer",
              fontWeight: 800,
              fontSize: "0.9rem",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.35)",
              transition: "transform 0.15s, box-shadow 0.15s"
            }}
          >
            <Sparkles size={18} />
            فحص وتوزيع جوائز النجوم 🌟
          </button>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem"
      }}>
        {/* Total Earned */}
        <div style={{
          background: "white",
          borderRadius: "1.25rem",
          padding: "1.25rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "1rem",
            background: "#dcfce7",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem"
          }}>
            💰
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>إجمالي الدنانير الممنوحة</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#16a34a" }}>
              {totalEarnedAll} <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>دينار</span>
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div style={{
          background: "white",
          borderRadius: "1.25rem",
          padding: "1.25rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "1rem",
            background: "#ffe4e6",
            color: "#e11d48",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem"
          }}>
            🛍️
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>إجمالي الدنانير المصروفة</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#e11d48" }}>
              {totalSpentAll} <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>دينار</span>
            </div>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          borderRadius: "1.25rem",
          padding: "1.25rem",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)",
          border: "1px solid #bfdbfe",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "1rem",
            background: "#3b82f6",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem"
          }}>
            💳
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#1e40af", fontWeight: 700 }}>إجمالي الأرصدة المستحقة</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1d4ed8" }}>
              {currentBalanceAll} <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>دينار</span>
            </div>
          </div>
        </div>

        {/* Active Students */}
        <div style={{
          background: "white",
          borderRadius: "1.25rem",
          padding: "1.25rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "1rem",
            background: "#fef3c7",
            color: "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem"
          }}>
            👨‍🎓
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>طلاب لديهم رصيد متاح</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#d97706" }}>
              {studentsWithBalance} <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>/ {summaries.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: "white",
        borderRadius: "1.25rem",
        padding: "1rem 1.25rem",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem"
      }}>
        <div style={{ position: "relative", minWidth: "260px", flex: "1 1 300px" }}>
          <Search size={18} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="بحث باسم الطالب..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem 2.75rem 0.65rem 1rem",
              borderRadius: "0.75rem",
              border: "1px solid #cbd5e1",
              fontSize: "0.9rem",
              outline: "none",
              transition: "border-color 0.2s"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setFilterType("all")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "0.65rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: filterType === "all" ? "#4f46e5" : "#f1f5f9",
              color: filterType === "all" ? "white" : "#475569"
            }}
          >
            الكل ({summaries.length})
          </button>
          <button
            onClick={() => setFilterType("has_balance")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "0.65rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: filterType === "has_balance" ? "#16a34a" : "#f1f5f9",
              color: filterType === "has_balance" ? "white" : "#475569"
            }}
          >
            يملكون رصيداً ({studentsWithBalance})
          </button>
          <button
            onClick={() => setFilterType("has_spent")}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "0.65rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
              background: filterType === "has_spent" ? "#e11d48" : "#f1f5f9",
              color: filterType === "has_spent" ? "white" : "#475569"
            }}
          >
            قاموا بالصرف ({summaries.filter(s => s.total_spent > 0).length})
          </button>
        </div>
      </div>

      {/* Students List / Table */}
      <div style={{
        background: "white",
        borderRadius: "1.25rem",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.04)",
        border: "1px solid #e2e8f0",
        overflow: "hidden"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#1e293b" }}>
            قائمة حسابات الطلاب المالية ({filteredSummaries.length})
          </h2>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            جميع الأرصدة محسوبة تلقائياً من دفتر المعاملات
          </span>
        </div>

        {filteredSummaries.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔍</div>
            <p style={{ margin: 0, fontWeight: 700 }}>لا توجد نتائج مطابقة لبحثك</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.9rem 1.25rem", color: "#475569", fontSize: "0.85rem", fontWeight: 800 }}>الطالب</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#475569", fontSize: "0.85rem", fontWeight: 800, textAlign: "center" }}>الرصيد المتبقي</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#475569", fontSize: "0.85rem", fontWeight: 800, textAlign: "center" }}>المجموع المكتسب</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#475569", fontSize: "0.85rem", fontWeight: 800, textAlign: "center" }}>المصروف الكلي</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#475569", fontSize: "0.85rem", fontWeight: 800 }}>آخر حركة</th>
                  <th style={{ padding: "0.9rem 1.25rem", color: "#475569", fontSize: "0.85rem", fontWeight: 800, textAlign: "center" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.map(student => {
                  const lastTx = student.transactions && student.transactions.length > 0 ? student.transactions[0] : null

                  return (
                    <tr key={student.student_id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }}>
                      {/* Name */}
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "1rem"
                          }}>
                            {student.student_name.slice(0, 1)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.95rem" }}>{student.student_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{student.transactions.length} حركة مسجلة</div>
                          </div>
                        </div>
                      </td>

                      {/* Current Balance */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          background: student.current_balance > 0 ? "#eff6ff" : "#f1f5f9",
                          color: student.current_balance > 0 ? "#1d4ed8" : "#94a3b8",
                          border: `1px solid ${student.current_balance > 0 ? "#bfdbfe" : "#e2e8f0"}`,
                          padding: "0.35rem 0.85rem",
                          borderRadius: "1rem",
                          fontWeight: 900,
                          fontSize: "1.05rem"
                        }}>
                          <span>💰</span>
                          <span>{student.current_balance}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>دينار</span>
                        </div>
                      </td>

                      {/* Total Earned */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "0.95rem" }}>
                          +{student.total_earned} دينار
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, color: student.total_spent > 0 ? "#e11d48" : "#94a3b8", fontSize: "0.95rem" }}>
                          {student.total_spent > 0 ? `-${student.total_spent}` : "0"} دينار
                        </span>
                      </td>

                      {/* Last Transaction */}
                      <td style={{ padding: "1rem", maxWidth: "220px" }}>
                        {lastTx ? (
                          <div>
                            <div style={{
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: lastTx.type === "earn" ? "#15803d" : lastTx.type === "spend" ? "#be123c" : "#1d4ed8",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {lastTx.description}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                              {new Date(lastTx.created_at).toLocaleDateString("ar-EG")}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>لا توجد حركات</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                          {/* Spend Button */}
                          <button
                            onClick={() => {
                              setActiveSpendStudent(student)
                              setSpendAmount("1")
                              setSpendDescription("")
                            }}
                            title="تسجيل صرف دنانير"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "#ffe4e6",
                              color: "#e11d48",
                              border: "1px solid #fecdd3",
                              padding: "0.4rem 0.65rem",
                              borderRadius: "0.6rem",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                          >
                            <MinusCircle size={14} />
                            صرف
                          </button>

                          {/* Override Button */}
                          <button
                            onClick={() => {
                              setActiveOverrideStudent(student)
                              setOverrideField("current_balance")
                              setOverrideValue(student.current_balance.toString())
                              setOverrideReason("")
                            }}
                            title="تعديل إداري في الرصيد أو المجموع"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              padding: "0.4rem 0.65rem",
                              borderRadius: "0.6rem",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                          >
                            تعديل ⚖️
                          </button>

                          {/* History Button */}
                          <button
                            onClick={() => setActiveHistoryStudent(student)}
                            title="عرض سجل الحركات الكامل"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              background: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #e2e8f0",
                              padding: "0.4rem 0.65rem",
                              borderRadius: "0.6rem",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              transition: "all 0.15s"
                            }}
                          >
                            <History size={14} />
                            السجل
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: SPEND MODAL ================= */}
      {activeSpendStudent && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 999
        }}>
          <div style={{
            background: "white",
            borderRadius: "1.5rem",
            maxWidth: "480px",
            width: "100%",
            padding: "1.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.75rem" }}>🛍️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#1e293b" }}>تسجيل صرف دنانير</h3>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    للطالب: <span style={{ fontWeight: 800, color: "#4f46e5" }}>{activeSpendStudent.student_name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveSpendStudent(null)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Current Balance Banner */}
            <div style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "0.85rem",
              padding: "0.75rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem"
            }}>
              <span style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 700 }}>الرصيد الحالي المتاح للطالب:</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#15803d" }}>
                {activeSpendStudent.current_balance} دينار
              </span>
            </div>

            <form onSubmit={handleSpendSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Quick Presets */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#475569", marginBottom: "0.4rem" }}>
                  خيارات سريعة للمكافآت الواقعية:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => applyPreset(3, "صرف 3 دنانير على وجبة شاورما 🌯")}
                    style={{
                      padding: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "right"
                    }}
                  >
                    🌯 وجبة شاورما (3 دنانير)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(2, "صرف 2 دنانير على هدية رمزية 🎁")}
                    style={{
                      padding: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "right"
                    }}
                  >
                    🎁 هدية رمزية (2 دنانير)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(1, "صرف 1 دينار على ساعة لعب 🎮")}
                    style={{
                      padding: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "right"
                    }}
                  >
                    🎮 ساعة لعب (1 دينار)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(5, "صرف 5 دنانير مكافأة نقدية كاش 💵")}
                    style={{
                      padding: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      cursor: "pointer",
                      textAlign: "right"
                    }}
                  >
                    💵 مكافأة نقدية (5 دنانير)
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.3rem" }}>
                  مبلغ الصرف (بالدنانير):
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={spendAmount}
                  onChange={e => setSpendAmount(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "1rem",
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Description input */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.3rem" }}>
                  وصف وسبب الصرف (سيظهر في كشف حساب الطالب):
                </label>
                <input
                  type="text"
                  placeholder="مثال: صرف 3 دنانير على وجبة شاورما"
                  value={spendDescription}
                  onChange={e => setSpendDescription(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              {/* Warning if amount exceeds balance */}
              {parseFloat(spendAmount) > activeSpendStudent.current_balance && (
                <div style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "0.65rem",
                  padding: "0.6rem 0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "#be123c",
                  fontSize: "0.8rem",
                  fontWeight: 700
                }}>
                  <AlertCircle size={16} />
                  <span>تنبيه: المبلغ المراد صرفه أكبر من الرصيد الحالي للطالب!</span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={isSubmittingSpend}
                  style={{
                    flex: 1,
                    background: "#e11d48",
                    color: "white",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: isSubmittingSpend ? "not-allowed" : "pointer"
                  }}
                >
                  {isSubmittingSpend ? "جاري الخصم..." : "تأكيد وخصم الدنانير 🛍️"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSpendStudent(null)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: MANUAL OVERRIDE MODAL ================= */}
      {activeOverrideStudent && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 999
        }}>
          <div style={{
            background: "white",
            borderRadius: "1.5rem",
            maxWidth: "480px",
            width: "100%",
            padding: "1.75rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.75rem" }}>⚖️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#1e293b" }}>تعديل إداري في الحساب المالي</h3>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    للطالب: <span style={{ fontWeight: 800, color: "#4f46e5" }}>{activeOverrideStudent.student_name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveOverrideStudent(null)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "0.85rem",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.8rem",
              color: "#1e40af",
              lineHeight: 1.5
            }}>
              ℹ️ <strong>حفاظاً على سلامة الدفتر المحاسبي:</strong> التعديل المباشر لا يمسح العمليات السابقة، بل يُنشئ تلقائياً حركة تسوية محاسبية (Adjustment) بفارق القيمة تسجل في كشف الحساب.
            </div>

            <form onSubmit={handleOverrideSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Choose target field */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.3rem" }}>
                  ما الذي ترغب بتعديله؟
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideField("current_balance")
                      setOverrideValue(activeOverrideStudent.current_balance.toString())
                    }}
                    style={{
                      padding: "0.6rem",
                      borderRadius: "0.65rem",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: overrideField === "current_balance" ? "#2563eb" : "#cbd5e1",
                      background: overrideField === "current_balance" ? "#eff6ff" : "white",
                      color: overrideField === "current_balance" ? "#1d4ed8" : "#475569"
                    }}
                  >
                    الرصيد الحالي المتبقي
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOverrideField("total_earned")
                      setOverrideValue(activeOverrideStudent.total_earned.toString())
                    }}
                    style={{
                      padding: "0.6rem",
                      borderRadius: "0.65rem",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: overrideField === "total_earned" ? "#16a34a" : "#cbd5e1",
                      background: overrideField === "total_earned" ? "#f0fdf4" : "white",
                      color: overrideField === "total_earned" ? "#15803d" : "#475569"
                    }}
                  >
                    المجموع الكلي المكتسب
                  </button>
                </div>
              </div>

              {/* Current Value Display */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b" }}>
                <span>القيمة الحالية:</span>
                <span style={{ fontWeight: 800, color: "#1e293b" }}>
                  {overrideField === "current_balance" ? activeOverrideStudent.current_balance : activeOverrideStudent.total_earned} دينار
                </span>
              </div>

              {/* Target Value Input */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.3rem" }}>
                  القيمة الجديدة المرغوبة (دينار):
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={overrideValue}
                  onChange={e => setOverrideValue(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "1.05rem",
                    fontWeight: 700
                  }}
                />
              </div>

              {/* Reason Input */}
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.3rem" }}>
                  سبب التعديل الإداري:
                </label>
                <input
                  type="text"
                  placeholder="مثال: تصحيح خطأ حسابي / مكافأة تميز إضافية"
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={isSubmittingOverride}
                  style={{
                    flex: 1,
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: isSubmittingOverride ? "not-allowed" : "pointer"
                  }}
                >
                  {isSubmittingOverride ? "جاري الحفظ..." : "حفظ التعديل المحاسبي ⚖️"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOverrideStudent(null)}
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: FULL HISTORY MODAL ================= */}
      {activeHistoryStudent && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 999
        }}>
          <div style={{
            background: "white",
            borderRadius: "1.5rem",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.75rem" }}>📜</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: "#1e293b" }}>كشف حساب الدنانير</h3>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    للطالب: <strong style={{ color: "#4f46e5" }}>{activeHistoryStudent.student_name}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveHistoryStudent(null)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", color: "#94a3b8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Summary Bar inside modal */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>المكتسب</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#16a34a" }}>+{activeHistoryStudent.total_earned}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>المصروف</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#e11d48" }}>-{activeHistoryStudent.total_spent}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>الرصيد المتبقي</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#2563eb" }}>{activeHistoryStudent.current_balance}</div>
              </div>
            </div>

            {/* Scrollable list */}
            <div style={{ padding: "1rem 1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {activeHistoryStudent.transactions.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                  لا توجد حركات مسجلة لهذا الطالب حتى الآن
                </div>
              ) : (
                activeHistoryStudent.transactions.map(tx => {
                  const isEarn = tx.type === "earn"
                  const isSpend = tx.type === "spend"
                  const isAdj = tx.type === "adjustment"

                  let badgeColor = "#16a34a"
                  let badgeBg = "#dcfce7"
                  let sign = "+"

                  if (isSpend) {
                    badgeColor = "#e11d48"
                    badgeBg = "#ffe4e6"
                    sign = "-"
                  } else if (isAdj) {
                    badgeColor = tx.amount >= 0 ? "#2563eb" : "#d97706"
                    badgeBg = tx.amount >= 0 ? "#eff6ff" : "#fef3c7"
                    sign = tx.amount >= 0 ? "+" : ""
                  }

                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.85rem",
                        border: "1px solid #e2e8f0",
                        background: "#ffffff"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: badgeBg,
                          color: badgeColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.1rem"
                        }}>
                          {isEarn ? "💰" : isSpend ? "🛍️" : "⚖️"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "#1e293b" }}>{tx.description}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            {new Date(tx.created_at).toLocaleString("ar-EG")}
                          </div>
                        </div>
                      </div>

                      <div style={{
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        color: badgeColor,
                        direction: "ltr"
                      }}>
                        {sign}{tx.amount} دينار
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", textAlign: "left" }}>
              <button
                onClick={() => setActiveHistoryStudent(null)}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.65rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
