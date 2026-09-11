"use client"
import React, { useState, useEffect, useCallback } from "react"
import { Swords, Shield, Sparkles, Trophy, Zap, AlertCircle, History, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"
import BattleModal from "./BattleModal"
import { ArenaOpponent, BattleHistoryItem, BattleOutcome } from "@/lib/arena-utils"

interface ArenaViewProps {
  studentId: string
  studentName: string
  initialGems?: number
  isQuranCompletedToday?: boolean
}

export default function ArenaView({
  studentId,
  studentName,
  initialGems = 0,
  isQuranCompletedToday = false,
}: ArenaViewProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [challengingId, setChallengingId] = useState<string | null>(null)
  const [battleOutcome, setBattleOutcome] = useState<BattleOutcome | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // Student stats & arena state
  const [studentStats, setStudentStats] = useState({
    attack: 20,
    defense: 20,
    battle_power: 40,
    effective_attack: 20,
  })
  const [remainingChallenges, setRemainingChallenges] = useState<number>(3)
  const [isQuranBoosted, setIsQuranBoosted] = useState<boolean>(isQuranCompletedToday)
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([])
  const [recentBattles, setRecentBattles] = useState<BattleHistoryItem[]>([])

  // Load arena data
  const loadArenaData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/arena?studentId=${studentId}`)
      const data = await res.json()
      if (data.success) {
        setStudentStats({
          attack: data.student.attack,
          defense: data.student.defense,
          battle_power: data.student.battle_power,
          effective_attack: data.student.effective_attack,
        })
        setRemainingChallenges(data.remaining_challenges ?? 3)
        setIsQuranBoosted(Boolean(data.is_quran_boosted))
        setOpponents(data.opponents || [])
        setRecentBattles(data.recent_battles || [])
      }
    } catch (err) {
      console.error("Error loading arena data:", err)
      toast.error("تعذر تحميل بيانات الميدان")
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    loadArenaData()
  }, [loadArenaData])

  // Handle challenge click
  async function handleChallenge(opponent: ArenaOpponent) {
    if (remainingChallenges <= 0) {
      toast.error("لقد استهلكت جميع تحدياتك لليوم (3/3). يتجدد العداد غداً إن شاء الله!", {
        icon: "⏳",
      })
      return
    }

    setChallengingId(opponent.id)
    try {
      const res = await fetch("/api/arena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          defenderId: opponent.id,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في خوض النزال")
      }

      const outcome: BattleOutcome = data.outcome
      setBattleOutcome(outcome)
      setRemainingChallenges(data.remaining_challenges)
      setIsModalOpen(true)

      // If victory, notify application and dispatch gems event
      if (outcome.is_victory) {
        window.dispatchEvent(
          new CustomEvent("hero_gems_updated", {
            detail: { gems_balance: data.new_gems_balance, added: 10 },
          })
        )
      }

      // Refresh recent battles list
      setRecentBattles(prev => [
        {
          id: outcome.battle_id,
          battle_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          opponent_name: outcome.defender_name,
          opponent_id: outcome.defender_id,
          is_victory: outcome.is_victory,
          outcome: outcome.outcome,
          is_draw: outcome.is_draw,
          gems_awarded: outcome.gems_awarded,
          is_quran_boosted: outcome.is_quran_boosted,
          attacker_attack: outcome.attacker_attack,
          defender_attack: outcome.defender_attack,
        },
        ...prev.slice(0, 9),
      ])
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء بدء النزال")
    } finally {
      setChallengingId(null)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ARENA HEADER BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #431407 100%)",
          borderRadius: "1.5rem",
          padding: "1.75rem",
          color: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.15)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "0.85rem",
                  background: "rgba(251, 191, 36, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(251, 191, 36, 0.4)",
                }}
              >
                <Swords size={24} color="#fbbf24" />
              </div>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900 }}>ميدان التنافس</h1>
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.95rem" }}>
              تبارز مع زملائك بالعتاد المطوّر واربح 10 جواهر 💎 مع كل انتصار!
            </p>
          </div>

          <button
            onClick={loadArenaData}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.5rem 0.85rem",
              color: "white",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>تحديث</span>
          </button>
        </div>

        {/* CURRENT STUDENT HUD CARD */}
        <div
          style={{
            marginTop: "1.25rem",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
            borderRadius: "1.25rem",
            padding: "1.25rem",
            border: isQuranBoosted ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.15)",
            boxShadow: isQuranBoosted ? "0 0 25px rgba(251, 191, 36, 0.25)" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "1rem",
                  background: isQuranBoosted
                    ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.45rem",
                  fontWeight: 900,
                  color: "#ffffff",
                  border: isQuranBoosted ? "2px solid #fef08a" : "2px solid rgba(255,255,255,0.3)",
                  boxShadow: isQuranBoosted ? "0 0 15px rgba(251, 191, 36, 0.5)" : "0 4px 15px rgba(0,0,0,0.2)",
                }}
              >
                {studentName?.trim().charAt(0) || "⚔️"}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 900, fontSize: "1.1rem" }}>{studentName}</span>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "0.4rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    بطل الميدان
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginTop: "0.15rem" }}>
                  العتاد المجهز يحدد قوتك في المبارزة
                </div>
              </div>
            </div>

            {/* Daily Challenges Counter */}
            <div
              style={{
                background: "rgba(0,0,0,0.25)",
                padding: "0.6rem 1rem",
                borderRadius: "0.85rem",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.2rem" }}>
                التحديات المتبقية اليوم
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                {[1, 2, 3].map(i => {
                  const isAvailable = i <= remainingChallenges
                  return (
                    <span
                      key={i}
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: isAvailable ? "#10b981" : "#475569",
                        display: "inline-block",
                        boxShadow: isAvailable ? "0 0 8px #10b981" : "none",
                      }}
                    />
                  )
                })}
                <span style={{ fontWeight: 900, fontSize: "1rem", marginRight: "0.3rem", color: remainingChallenges > 0 ? "#34d399" : "#94a3b8" }}>
                  {remainingChallenges} / 3
                </span>
              </div>
            </div>
          </div>

          {/* COMBAT STATS ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Total Attack */}
            <div style={{ background: "rgba(239, 68, 68, 0.15)", borderRadius: "0.75rem", padding: "0.65rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#fca5a5", fontWeight: 700 }}>قوة الهجوم ⚔️</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#f87171" }}>
                {studentStats.effective_attack}
                {isQuranBoosted && <span style={{ fontSize: "0.75rem", color: "#fbbf24" }}> (1.5x ✨)</span>}
              </div>
            </div>

            {/* Total Defense */}
            <div style={{ background: "rgba(2, 132, 199, 0.15)", borderRadius: "0.75rem", padding: "0.65rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#bae6fd", fontWeight: 700 }}>قوة الحماية 🛡️</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#38bdf8" }}>
                {studentStats.defense}
              </div>
            </div>

            {/* Total Battle Power */}
            <div style={{ background: "rgba(245, 158, 11, 0.15)", borderRadius: "0.75rem", padding: "0.65rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "#fde68a", fontWeight: 700 }}>القدرة القتالية ⚡</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fbbf24" }}>
                {studentStats.battle_power}
              </div>
            </div>
          </div>

          {/* QURANIC BOOST BANNER (THE SACRED CONDITION) */}
          <div style={{ marginTop: "1rem" }}>
            {isQuranBoosted ? (
              <div
                style={{
                  background: "linear-gradient(90deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)",
                  border: "1px solid #fbbf24",
                  borderRadius: "0.85rem",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <Sparkles size={22} color="#fbbf24" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#fef08a" }}>
                    ✨ بركة القرآن مضاعفة: هجومك مضاعف بنسبة 1.5x!
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.85)" }}>
                    لأنك أتممت جميع مهامك القرآنية لليوم في "خطة الحفظ"، قوتك الهجومية في أوج تألقها!
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "0.85rem",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <AlertCircle size={22} color="#94a3b8" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#e2e8f0" }}>
                    📖 عزّز هجومك ببركة القرآن الكريم (+50% قوة هجوم)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    أكمل جميع مهامك اليومية في تبويب "الخطة" ليتضاعف هجومك تلقائياً في الميدان بنسبة 1.5x!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OPPONENTS LIST (قائمة المتحدين) */}
      <div className="card" style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#1e293b", margin: 0 }}>
              ⚔️ المتحدون في الميدان
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              اختر منافساً وخض مبارزة شريفة لربح الجواهر
            </p>
          </div>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              background: remainingChallenges > 0 ? "#ecfdf5" : "#fef2f2",
              color: remainingChallenges > 0 ? "#059669" : "#dc2626",
              padding: "0.3rem 0.65rem",
              borderRadius: "0.5rem",
            }}
          >
            {remainingChallenges > 0 ? `متبقي ${remainingChallenges} تحديات` : "استهلكت محاولات اليوم"}
          </span>
        </div>

        {opponents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
            لا يوجد منافسون متاحون حالياً
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {opponents.map(opp => {
              const isChallengingThis = challengingId === opp.id
              const canChallenge = remainingChallenges > 0 && !challengingId

              return (
                <div
                  key={opp.id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "1rem",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.85rem",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Opponent Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "0.85rem",
                        background: opp.is_bot
                          ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                          : "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                        color: opp.is_bot ? "#d97706" : "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: opp.is_bot ? "1.4rem" : "1.2rem",
                        fontWeight: 900,
                        border: opp.is_bot ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.25)",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                      }}
                    >
                      {opp.is_bot ? (opp.avatar_icon || "⚔️") : (opp.full_name?.trim().charAt(0) || "👦")}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1e293b" }}>
                        {opp.full_name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {opp.is_bot ? "فارس مبارز في الميدان" : "طالب منافس"}
                      </div>
                    </div>
                  </div>

                  {/* Opponent Stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.4rem",
                      background: "white",
                      padding: "0.6rem 0.5rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #f1f5f9",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>الهجوم</div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#ef4444" }}>
                        ⚔️ {opp.attack}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>الحماية</div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#0284c7" }}>
                        🛡️ {opp.defense}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>القدرة</div>
                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#d97706" }}>
                        ⚡ {opp.battle_power}
                      </div>
                    </div>
                  </div>

                  {/* Challenge Button */}
                  <button
                    type="button"
                    disabled={!canChallenge}
                    onClick={() => handleChallenge(opp)}
                    style={{
                      width: "100%",
                      padding: "0.65rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      background: canChallenge
                        ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                        : "#cbd5e1",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: canChallenge ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      boxShadow: canChallenge ? "0 4px 12px rgba(124, 58, 237, 0.25)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isChallengingThis ? (
                      <>
                        <Zap size={16} className="animate-spin" />
                        <span>جاري بدء النزال...</span>
                      </>
                    ) : (
                      <>
                        <Swords size={16} />
                        <span>{canChallenge ? "تحدي ⚔️" : "استهلكت المحاولات"}</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RECENT BATTLES HISTORY (سجل المعارك الأخيرة) */}
      <div className="card" style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <History size={20} color="#6366f1" />
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            سجل المبارزات الأخيرة
          </h2>
        </div>

        {recentBattles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: "0.9rem" }}>
            لم تخض أي مبارزة بعد. ابدأ أول تحدٍ في الميدان الآن!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.65rem 0.75rem", fontSize: "0.8rem", color: "#64748b" }}>الخصم</th>
                  <th style={{ padding: "0.65rem 0.75rem", fontSize: "0.8rem", color: "#64748b" }}>النتيجة</th>
                  <th style={{ padding: "0.65rem 0.75rem", fontSize: "0.8rem", color: "#64748b" }}>الجواهر 💎</th>
                  <th style={{ padding: "0.65rem 0.75rem", fontSize: "0.8rem", color: "#64748b" }}>بركة القرآن</th>
                  <th style={{ padding: "0.65rem 0.75rem", fontSize: "0.8rem", color: "#64748b" }}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentBattles.map(battle => (
                  <tr key={battle.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.65rem 0.75rem", fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>
                      {battle.opponent_name}
                    </td>
                    <td style={{ padding: "0.65rem 0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.35rem",
                          background:
                            battle.outcome === "draw" || (battle as any).is_draw
                              ? "#fffbeb"
                              : battle.is_victory
                              ? "#ecfdf5"
                              : "#fef2f2",
                          color:
                            battle.outcome === "draw" || (battle as any).is_draw
                              ? "#d97706"
                              : battle.is_victory
                              ? "#059669"
                              : "#dc2626",
                        }}
                      >
                        {battle.outcome === "draw" || (battle as any).is_draw
                          ? "🤝 تعادل"
                          : battle.is_victory
                          ? "🏆 نصر"
                          : "🛡️ هزيمة"}
                      </span>
                    </td>
                    <td style={{ padding: "0.65rem 0.75rem", fontWeight: 800, fontSize: "0.85rem", color: battle.is_victory ? "#059669" : "#94a3b8" }}>
                      {battle.is_victory ? `+${battle.gems_awarded || 10} 💎` : "0 💎"}
                    </td>
                    <td style={{ padding: "0.65rem 0.75rem" }}>
                      {battle.is_quran_boosted ? (
                        <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700 }}>✨ مفعلة (1.5x)</span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "0.65rem 0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                      {battle.battle_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BATTLE SIMULATION MODAL */}
      <BattleModal
        outcome={battleOutcome}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setBattleOutcome(null)
          loadArenaData()
        }}
      />
    </div>
  )
}
