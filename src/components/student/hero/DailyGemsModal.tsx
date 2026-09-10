"use client"
import React, { useState } from "react"
import { Sparkles, Trophy, Gift } from "lucide-react"

interface DailyGemsModalProps {
  isOpen: boolean
  onClose: () => void
  onClaimGems: (amount: number) => Promise<void>
}

export default function DailyGemsModal({
  isOpen,
  onClose,
  onClaimGems,
}: DailyGemsModalProps) {
  const [isOpening, setIsOpening] = useState(false)
  const [awardedGems, setAwardedGems] = useState<number | null>(null)
  const [isClaimed, setIsClaimed] = useState(false)

  if (!isOpen) return null

  async function handleOpenChest() {
    if (isOpening || isClaimed) return
    setIsOpening(true)

    // Random gems between 5 and 20
    const gems = Math.floor(Math.random() * 16) + 5

    setTimeout(async () => {
      setAwardedGems(gems)
      setIsOpening(false)
      setIsClaimed(true)
      await onClaimGems(gems)
    }, 1200)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "1rem",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "2rem",
          padding: "2rem 1.5rem",
          textAlign: "center",
          border: "2px solid #f59e0b",
          boxShadow: "0 20px 50px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Effects */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "200px",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Title */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(245, 158, 11, 0.2)",
              color: "#fbbf24",
              padding: "0.3rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 800,
              border: "1px solid rgba(245, 158, 11, 0.4)",
              marginBottom: "0.75rem",
            }}
          >
            <Sparkles size={14} />
            <span>مكافأة تسجيل الدخول اليومي</span>
          </div>

          <h2 style={{ margin: "0 0 0.5rem", color: "#ffffff", fontSize: "1.6rem", fontWeight: 900 }}>
            {isClaimed ? "تهانينا! نلت المكافأة 🎉" : "صندوق الجواهر اليومي 💎"}
          </h2>

          <p style={{ margin: "0 0 1.5rem", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.5 }}>
            {isClaimed
              ? "تمت إضافة الجواهر بنجاح إلى رصيدك! يمكنك استخدامها لتطوير عتاد بطلك."
              : "افتح صندوق اليوم واحصل على جواهر مجانية (5 - 20 جوهرة) لتجهيز بطلك في المتجر!"}
          </p>
        </div>

        {/* Interactive Chest Graphic */}
        <div
          onClick={handleOpenChest}
          style={{
            cursor: isClaimed ? "default" : "pointer",
            margin: "1rem auto 1.5rem",
            position: "relative",
            width: "150px",
            height: "150px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: isOpening ? "scale(1.15) rotate(-3deg)" : "scale(1)",
            transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {isClaimed ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                animation: "popIn 0.4s ease",
              }}
            >
              <span style={{ fontSize: "4.5rem", lineHeight: 1 }}>💎</span>
              <div
                style={{
                  marginTop: "0.5rem",
                  background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                  color: "#ffffff",
                  padding: "0.4rem 1.25rem",
                  borderRadius: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  boxShadow: "0 4px 15px rgba(2, 132, 199, 0.5)",
                }}
              >
                +{awardedGems} جوهرة
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: "5.5rem",
                filter: "drop-shadow(0 10px 20px rgba(245, 158, 11, 0.5))",
                animation: isOpening ? "pulse 0.2s infinite" : "float 3s ease-in-out infinite",
              }}
            >
              🎁
            </div>
          )}
        </div>

        {/* Action Button */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {isClaimed ? (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.85rem",
                borderRadius: "1rem",
                border: "none",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
              }}
            >
              رائع! استمرار للرحلة 🚀
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenChest}
              disabled={isOpening}
              style={{
                width: "100%",
                padding: "0.85rem",
                borderRadius: "1rem",
                border: "none",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
              }}
            >
              {isOpening ? "جارٍ فتح الصندوق..." : "اضغط لفتح الصندوق 🔓"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
