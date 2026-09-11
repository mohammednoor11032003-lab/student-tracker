"use client"
import React, { useState, useEffect } from "react"
import { Swords, Shield, Sparkles, Trophy, X, Zap } from "lucide-react"
import { BattleOutcome } from "@/lib/arena-utils"

interface BattleModalProps {
  outcome: BattleOutcome | null
  isOpen: boolean
  onClose: () => void
}

export default function BattleModal({ outcome, isOpen, onClose }: BattleModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [showResult, setShowResult] = useState<boolean>(false)

  // Auto-play the 3 rounds simulation when opened
  useEffect(() => {
    if (!isOpen || !outcome) {
      setCurrentStep(0)
      setShowResult(false)
      return
    }

    // Step 0: Face-off (1 second)
    const t1 = setTimeout(() => setCurrentStep(1), 1000)
    // Step 1: Round 1 (1.8s)
    const t2 = setTimeout(() => setCurrentStep(2), 2200)
    // Step 2: Round 2 (1.8s)
    const t3 = setTimeout(() => setCurrentStep(3), 3400)
    // Step 3: Round 3 & Result (1.5s)
    const t4 = setTimeout(() => {
      setShowResult(true)
    }, 4600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [isOpen, outcome])

  if (!isOpen || !outcome) return null

  // Calculate simulated HP for current step
  const maxAttackerHp = 100 + outcome.attacker_defense * 2
  const maxDefenderHp = 100 + outcome.defender_defense * 2

  let currentAttackerHp = maxAttackerHp
  let currentDefenderHp = maxDefenderHp

  if (currentStep >= 1 && outcome.rounds[0]) {
    currentAttackerHp = outcome.rounds[0].attacker_remaining_hp
    currentDefenderHp = outcome.rounds[0].defender_remaining_hp
  }
  if (currentStep >= 2 && outcome.rounds[1]) {
    currentAttackerHp = outcome.rounds[1].attacker_remaining_hp
    currentDefenderHp = outcome.rounds[1].defender_remaining_hp
  }
  if (currentStep >= 3 && outcome.rounds[2]) {
    currentAttackerHp = outcome.rounds[2].attacker_remaining_hp
    currentDefenderHp = outcome.rounds[2].defender_remaining_hp
  }

  const attackerHpPct = Math.max(0, Math.min(100, Math.round((currentAttackerHp / maxAttackerHp) * 100)))
  const defenderHpPct = Math.max(0, Math.min(100, Math.round((currentDefenderHp / maxDefenderHp) * 100)))

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={e => {
        if (e.target === e.currentTarget && showResult) onClose()
      }}
    >
      <div
        className="max-h-[90vh] overflow-y-auto flex flex-col"
        style={{
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          borderRadius: "1.5rem",
          border: outcome.is_quran_boosted ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.15)",
          boxShadow: outcome.is_quran_boosted
            ? "0 20px 50px rgba(251, 191, 36, 0.3)"
            : "0 20px 50px rgba(0, 0, 0, 0.5)",
          color: "white",
          position: "relative",
          animation: "modalFadeIn 0.3s ease-out",
          fontFamily: "'Tajawal', 'Cairo', sans-serif",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            background: "rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Swords size={20} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900 }}>
              ميدان التنافس • محاكاة المبارزة
            </h3>
          </div>
          {showResult && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#cbd5e1",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quran Boost Banner (If active) */}
        {outcome.is_quran_boosted && (
          <div
            style={{
              background: "linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #b45309 100%)",
              color: "#fff",
              padding: "0.45rem 1rem",
              textAlign: "center",
              fontSize: "0.85rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 10px rgba(245, 158, 11, 0.4)",
            }}
          >
            <Sparkles size={16} />
            <span>بركة إتمام الورد القرآني: مضاعفة قوة الهجوم 1.5x نشطة! ✨</span>
          </div>
        )}

        <div style={{ padding: "1.25rem", flex: 1 }}>
          {/* Combatants VS Display */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            {/* Attacker (Current Student) */}
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: outcome.is_quran_boosted ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "1rem",
                padding: "0.85rem",
                textAlign: "center",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                color: "white",
                fontWeight: 900,
                fontSize: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.4rem",
                border: outcome.is_quran_boosted ? "2px solid #fbbf24" : "2px solid rgba(255,255,255,0.3)",
                boxShadow: outcome.is_quran_boosted ? "0 0 15px rgba(251, 191, 36, 0.5)" : "0 4px 12px rgba(0,0,0,0.3)",
              }}>
                {outcome.attacker_name?.trim().charAt(0) || "⚔️"}
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#f8fafc" }}>
                {outcome.attacker_name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                (أنت)
              </div>

              {/* Stats */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", fontSize: "0.75rem" }}>
                <span style={{ color: "#f87171", fontWeight: 700 }}>
                  ⚔️ {outcome.effective_attacker_attack}
                  {outcome.is_quran_boosted && <small style={{ color: "#fbbf24" }}> (1.5x)</small>}
                </span>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>🛡️ {outcome.attacker_defense}</span>
              </div>

              {/* HP Bar */}
              <div style={{ marginTop: "0.6rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color: "#cbd5e1",
                    marginBottom: "0.2rem",
                  }}
                >
                  <span>الصحة (HP)</span>
                  <span>{currentAttackerHp}</span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${attackerHpPct}%`,
                      background: attackerHpPct > 40 ? "#10b981" : attackerHpPct > 20 ? "#f59e0b" : "#ef4444",
                      transition: "width 0.4s ease, background 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "0.85rem",
                boxShadow: "0 0 15px rgba(239, 68, 68, 0.5)",
              }}
            >
              VS
            </div>

            {/* Defender */}
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "1rem",
                padding: "0.85rem",
                textAlign: "center",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                color: "white",
                fontWeight: 900,
                fontSize: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.4rem",
                border: "2px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
              }}>
                {outcome.defender_name?.trim().charAt(0) || "⚔️"}
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#f8fafc" }}>
                {outcome.defender_name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                المنافس
              </div>

              {/* Stats - Hidden for Opponent Privacy */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", fontSize: "0.75rem" }}>
                <span style={{ color: "#fbbf24", fontWeight: 800, fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
                  فارس المنافسة ⚔️
                </span>
              </div>

              {/* HP Bar */}
              <div style={{ marginTop: "0.6rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color: "#cbd5e1",
                    marginBottom: "0.2rem",
                  }}
                >
                  <span>الصحة (HP)</span>
                  <span>{currentDefenderHp}</span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${defenderHpPct}%`,
                      background: defenderHpPct > 40 ? "#10b981" : defenderHpPct > 20 ? "#f59e0b" : "#ef4444",
                      transition: "width 0.4s ease, background 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rounds Progression Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "140px" }}>
            {outcome.rounds.map((round, idx) => {
              const isVisible = currentStep >= round.round_number
              if (!isVisible) return null

              return (
                <div
                  key={round.round_number}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0.85rem",
                    padding: "0.65rem 0.85rem",
                    animation: "slideIn 0.3s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "#fbbf24",
                        background: "rgba(251, 191, 36, 0.15)",
                        padding: "0.15rem 0.4rem",
                        borderRadius: "0.3rem",
                      }}
                    >
                      الجولة {round.round_number}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      ضرر متبادل: -{round.attacker_damage} 💥 / -{round.defender_damage} 🛡️
                    </span>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>
                    <div>{round.attacker_action}</div>
                  </div>
                </div>
              )
            })}

            {!showResult && currentStep < 3 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1rem",
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  gap: "0.4rem",
                }}
              >
                <Zap size={16} className="animate-spin" color="#f59e0b" />
                <span>النزال مستمر واشتباك السيوف يشتعل...</span>
              </div>
            )}
          </div>

          {/* Final Outcome Screen */}
          {showResult && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1.25rem",
                background: outcome.is_draw
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.3) 100%)"
                  : outcome.is_victory
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.4) 100%)"
                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)",
                border: outcome.is_draw
                  ? "2px solid #f59e0b"
                  : outcome.is_victory
                  ? "2px solid #10b981"
                  : "1px solid #ef4444",
                borderRadius: "1rem",
                textAlign: "center",
                animation: "scaleIn 0.3s ease-out",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}>
                {outcome.is_draw ? "🤝" : outcome.is_victory ? "🏆" : "🛡️"}
              </div>
              <h2
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "1.35rem",
                  fontWeight: 900,
                  color: outcome.is_draw ? "#fbbf24" : outcome.is_victory ? "#34d399" : "#fca5a5",
                }}
              >
                {outcome.is_draw
                  ? "تعادل بطولي مشرف! 🤝"
                  : outcome.is_victory
                  ? "نصر مبين ومظفر! 🎉"
                  : "نزال بطولي مشرف!"}
              </h2>

              <p style={{ margin: "0 0 0.85rem", fontSize: "0.85rem", color: "#f1f5f9", lineHeight: 1.5 }}>
                {outcome.summary_message}
              </p>

              {outcome.is_draw ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "rgba(245, 158, 11, 0.2)",
                    border: "1px solid #f59e0b",
                    borderRadius: "0.6rem",
                    padding: "0.4rem 0.85rem",
                    color: "#fef08a",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  <span>تساوت القوى في الميدان • لم يحصل أي طرف على جواهر النصر</span>
                </div>
              ) : outcome.is_victory ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "rgba(251, 191, 36, 0.2)",
                    border: "1px solid #fbbf24",
                    borderRadius: "0.6rem",
                    padding: "0.4rem 0.85rem",
                    color: "#fef08a",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    marginBottom: "1rem",
                  }}
                >
                  <Trophy size={18} color="#fbbf24" />
                  <span>+10 جواهر 💎 أضيفت إلى رصيدك!</span>
                </div>
              ) : null}

              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: outcome.is_draw
                      ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
                      : outcome.is_victory
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #475569 0%, #334155 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 2rem",
                    fontSize: "0.95rem",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontFamily: "'Tajawal', 'Cairo', sans-serif",
                  }}
                >
                  <span>المتابعة إلى الميدان</span>
                  <Swords size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
