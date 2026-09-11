"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Zap, RefreshCw } from "lucide-react"

interface ForceGenerateTasksButtonProps {
  className?: string
  style?: React.CSSProperties
  compact?: boolean
}

export default function ForceGenerateTasksButton({
  className,
  style,
  compact = false,
}: ForceGenerateTasksButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    if (loading) return
    setLoading(true)
    const toastId = toast.loading("جاري فحص وتوليد مهام اليوم لجميع الطلاب...", { id: "force_gen_toast" })

    try {
      const res = await fetch("/api/teacher/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const { createdCount, existingCount, studentsCount } = data.result
        if (createdCount > 0) {
          toast.success(
            `⚡ تم بنجاح! تم إنشاء ${createdCount} مهمة جديدة لـ ${studentsCount} طلاب.`,
            { id: toastId, duration: 4000 }
          )
        } else {
          toast.success(
            `✓ جميع المهام اليومية معينة بالفعل (${existingCount} مهمة لـ ${studentsCount} طلاب).`,
            { id: toastId, duration: 3500 }
          )
        }
        router.refresh()
      } else {
        toast.error(data.error || "فشل توليد مهام اليوم", { id: toastId })
      }
    } catch (err: any) {
      console.error("Failed to generate tasks:", err)
      toast.error("حدث خطأ في الاتصال بالخادم", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className={className}
      title="توليد مهام اليوم لجميع الطلاب فوراً إذا لم تظهر تلقائياً"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4rem",
        padding: compact ? "0.4rem 0.75rem" : "0.55rem 1.15rem",
        borderRadius: "0.85rem",
        fontSize: compact ? "0.82rem" : "0.9rem",
        fontWeight: 800,
        color: "white",
        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: "0 4px 14px rgba(217, 119, 6, 0.4)",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.75 : 1,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        whiteSpace: "nowrap",
        fontFamily: "'Tajawal', 'Cairo', sans-serif",
        ...style,
      }}
    >
      {loading ? (
        <RefreshCw size={compact ? 15 : 17} className="animate-spin" />
      ) : (
        <Zap size={compact ? 15 : 17} fill="#fff" />
      )}
      <span>{loading ? "جاري التوليد..." : "توليد مهام اليوم ⚡"}</span>
    </button>
  )
}
