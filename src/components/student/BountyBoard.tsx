"use client"
import React, { useState, useEffect } from "react"
import { BountyTask, BountyProgress } from "@/lib/bounty-utils"
import { Award, CheckCircle2, ChevronRight, Flame, Sparkles, Swords, Trophy } from "lucide-react"

interface BountyBoardProps {
  studentId: string
  weekStartStr: string
  todayStr: string
  bounties: BountyTask[]
  completedBountyTaskIds?: string[]
  onClaimBounty: (bounty: BountyTask) => Promise<void>
}

export default function BountyBoard({
  studentId,
  weekStartStr,
  todayStr,
  bounties,
  completedBountyTaskIds = [],
  onClaimBounty,
}: BountyBoardProps) {
  const storageKey = `bounties_${studentId}_${weekStartStr}`

  const [progressMap, setProgressMap] = useState<Record<string, BountyProgress>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.error("Failed to parse saved bounties:", e)
      }
    }
    return {}
  })

  const [claimingId, setClaimingId] = useState<string | null>(null)

  // Sync with completedBountyTaskIds from database if already completed
  useEffect(() => {
    if (!completedBountyTaskIds || completedBountyTaskIds.length === 0) return
    setProgressMap(prev => {
      let changed = false
      const updated = { ...prev }
      completedBountyTaskIds.forEach(id => {
        if (!updated[id] || !updated[id].completed) {
          updated[id] = {
            taskId: id,
            accepted: true,
            current: updated[id]?.target || 1,
            target: updated[id]?.target || 1,
            completed: true,
            completedAt: new Date().toISOString(),
          }
          changed = true
        }
      })
      if (changed && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated))
        } catch {}
      }
      return changed ? updated : prev
    })
  }, [completedBountyTaskIds, storageKey])

  function saveProgress(next: Record<string, BountyProgress>) {
    setProgressMap(next)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch (e) {
        console.error("Failed to save bounty progress:", e)
      }
    }
  }

  function handleAccept(bounty: BountyTask) {
    const next = {
      ...progressMap,
      [bounty.id]: {
        taskId: bounty.id,
        accepted: true,
        acceptedAt: new Date().toISOString(),
        current: 0,
        target: bounty.target,
        completed: false,
      },
    }
    saveProgress(next)
  }

  function handleIncrement(bounty: BountyTask) {
    const currentProg = progressMap[bounty.id]
    if (!currentProg || currentProg.completed) return
    const nextVal = Math.min(bounty.target, currentProg.current + 1)
    const next = {
      ...progressMap,
      [bounty.id]: {
        ...currentProg,
        current: nextVal,
      },
    }
    saveProgress(next)
  }

  function handleDecrement(bounty: BountyTask) {
    const currentProg = progressMap[bounty.id]
    if (!currentProg || currentProg.completed) return
    const nextVal = Math.max(0, currentProg.current - 1)
    const next = {
      ...progressMap,
      [bounty.id]: {
        ...currentProg,
        current: nextVal,
      },
    }
    saveProgress(next)
  }

  async function handleClaim(bounty: BountyTask) {
    setClaimingId(bounty.id)
    try {
      await onClaimBounty(bounty)

      const next = {
        ...progressMap,
        [bounty.id]: {
          taskId: bounty.id,
          accepted: true,
          current: bounty.target,
          target: bounty.target,
          completed: true,
          completedAt: new Date().toISOString(),
        },
      }
      saveProgress(next)
    } finally {
      setClaimingId(null)
    }
  }

  if (!bounties || bounties.length === 0) return null

  return (
    <div
      style={{
        marginTop: "2.5rem",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
        borderRadius: "1.5rem",
        padding: "1.75rem",
        border: "2px solid rgba(217, 119, 6, 0.4)",
        boxShadow: "0 12px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative ambient background glows */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "150px",
          height: "150px",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-50px",
          left: "-50px",
          width: "150px",
          height: "150px",
          background: "radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
            }}
          >
            <Trophy size={24} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "1.35rem",
                fontWeight: 900,
                letterSpacing: "-0.01em",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>🏆 تحديات الأسبوع الاختيارية</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#fbbf24",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  fontWeight: 800,
                }}
              >
                Bounty Board
              </span>
            </h3>
            <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              مهام إضافية اختيارية ذات مكافآت نقاط عالية لزيادة رصيدك دون أي مخاطرة أو خصم عند عدم إكمالها!
            </p>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "rgba(255,255,255,0.06)",
            padding: "0.4rem 0.85rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e2e8f0",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}
        >
          <Sparkles size={16} color="#fbbf24" />
          <span>تتجدد التحديات كل أسبوع تلقائياً</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {bounties.map(bounty => {
          const prog = progressMap[bounty.id]
          const isAccepted = Boolean(prog?.accepted)
          const isCompleted = Boolean(prog?.completed)
          const currentVal = prog?.current || 0
          const canClaim = isAccepted && !isCompleted && currentVal >= bounty.target
          const pct = Math.min(100, Math.round((currentVal / bounty.target) * 100))

          return (
            <div
              key={bounty.id}
              style={{
                background: isCompleted
                  ? "linear-gradient(135deg, rgba(6, 78, 59, 0.7) 0%, rgba(4, 47, 46, 0.8) 100%)"
                  : isAccepted
                  ? "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(30, 27, 75, 0.95) 100%)"
                  : "linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 100%)",
                borderRadius: "1.25rem",
                padding: "1.25rem",
                border: isCompleted
                  ? "2px solid #10b981"
                  : isAccepted
                  ? "2px solid #8b5cf6"
                  : "2px solid rgba(245, 158, 11, 0.35)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem",
                boxShadow: isCompleted
                  ? "0 8px 25px rgba(16, 185, 129, 0.2)"
                  : isAccepted
                  ? "0 8px 25px rgba(139, 92, 246, 0.2)"
                  : "0 8px 20px rgba(0,0,0,0.25)",
                position: "relative",
                transition: "all 0.25s ease",
              }}
            >
              {/* Top Row: Title + High Reward Badge */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.85rem", lineHeight: 1 }}>{bounty.emoji}</span>
                    <div>
                      <h4 style={{ margin: 0, color: "#ffffff", fontSize: "1.1rem", fontWeight: 900 }}>
                        {bounty.name}
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
                        {isCompleted ? "مكتمل ✓" : isAccepted ? "قيد التنفيذ ⚔️" : "متاح للقبول"}
                      </span>
                    </div>
                  </div>

                  {/* Large High Reward Dual Badge (Points + Gems) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #fbbf24",
                        boxShadow: "0 2px 10px rgba(245, 158, 11, 0.35)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "55px",
                      }}
                    >
                      <span style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 900, lineHeight: 1 }}>
                        +{bounty.points}
                      </span>
                      <span style={{ color: "#fef3c7", fontSize: "0.65rem", fontWeight: 700 }}>
                        نقطة
                      </span>
                    </div>

                    <div
                      style={{
                        background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #38bdf8",
                        boxShadow: "0 2px 10px rgba(14, 165, 233, 0.35)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "55px",
                      }}
                    >
                      <span style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 900, lineHeight: 1, display: "flex", alignItems: "center", gap: "0.15rem" }}>
                        +{bounty.gems || Math.max(10, Math.round(bounty.points * 0.4))}
                      </span>
                      <span style={{ color: "#e0f2fe", fontSize: "0.65rem", fontWeight: 700 }}>
                        💎 جوهرة
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details text */}
                <p
                  style={{
                    margin: "0.85rem 0 0",
                    color: "#cbd5e1",
                    fontSize: "0.85rem",
                    lineHeight: "1.45",
                    background: "rgba(0,0,0,0.2)",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {bounty.details}
                </p>
              </div>

              {/* Goal Requirement Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "#cbd5e1",
                  background: "rgba(255,255,255,0.05)",
                  padding: "0.45rem 0.75rem",
                  borderRadius: "0.6rem",
                }}
              >
                <span style={{ fontWeight: 700, color: "#e2e8f0" }}>🎯 الهدف المطلوب:</span>
                <span style={{ fontWeight: 800, color: "#fbbf24" }}>
                  {bounty.target} {bounty.unit || "مرات"}
                </span>
              </div>

              {/* Action Area depending on state */}
              <div>
                {!isAccepted ? (
                  /* State 1: Accept Button */
                  <button
                    type="button"
                    onClick={() => handleAccept(bounty)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.85rem",
                      border: "1px solid #f59e0b",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#ffffff",
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <Swords size={18} />
                    <span>قبول التحدي ⚔️</span>
                  </button>
                ) : isCompleted ? (
                  /* State 2: Completed Banner */
                  <div
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.85rem",
                      border: "1px solid #10b981",
                      background: "rgba(16, 185, 129, 0.2)",
                      color: "#34d399",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>تم إنجاز التحدي (+{bounty.points} نقطة و+{bounty.gems || Math.max(10, Math.round(bounty.points * 0.4))} 💎) ✓</span>
                  </div>
                ) : (
                  /* State 3: In Progress with Interactive Clicker Counters */
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {/* Clicker Counter */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: "0.75rem",
                        padding: "0.35rem 0.5rem",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDecrement(bounty)}
                        disabled={currentVal <= 0}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "0.5rem",
                          border: "none",
                          background: currentVal <= 0 ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.3)",
                          color: currentVal <= 0 ? "#64748b" : "#fca5a5",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          cursor: currentVal <= 0 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        -
                      </button>

                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "#ffffff" }}>
                          {currentVal}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0.3rem" }}>/</span>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#cbd5e1" }}>
                          {bounty.target} {bounty.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIncrement(bounty)}
                        disabled={currentVal >= bounty.target}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "0.5rem",
                          border: "none",
                          background: currentVal >= bounty.target ? "rgba(255,255,255,0.05)" : "rgba(16, 185, 129, 0.3)",
                          color: currentVal >= bounty.target ? "#64748b" : "#86efac",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          cursor: currentVal >= bounty.target ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "9999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: pct >= 100 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #8b5cf6, #ec4899)",
                          borderRadius: "9999px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    {/* Claim Button when target reached */}
                    {canClaim ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(bounty)}
                        disabled={claimingId === bounty.id}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "0.85rem",
                          border: "1px solid #10b981",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#ffffff",
                          fontWeight: 900,
                          fontSize: "0.95rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                          animation: "pulse 2s infinite",
                        }}
                      >
                        <Sparkles size={18} />
                        <span>{claimingId === bounty.id ? "جارٍ التوثيق..." : `🎉 استلام المكافأة (+${bounty.points} نقطة)`}</span>
                      </button>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#94a3b8",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        اضغط على العداد حتى تصل إلى {bounty.target} {bounty.unit} لاستلام المكافأة
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
