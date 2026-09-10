"use client"
import React from "react"

export default function LoadingScreen({ message = "جاري التحقق من الجلسة وتحميل البيانات..." }: { message?: string }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #4c0519 100%)",
        color: "white",
        fontFamily: "'Cairo', sans-serif",
        direction: "rtl",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
          maxWidth: "420px",
          textAlign: "center",
        }}
      >
        {/* Animated Icon Container */}
        <div
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "1.5rem",
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.8rem",
            boxShadow: "0 10px 30px rgba(124, 58, 237, 0.4)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        >
          🏆
        </div>

        {/* Title */}
        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, color: "#ffffff", letterSpacing: "-0.5px" }}>
          منصة الطلاب
        </h2>

        {/* Message */}
        <p style={{ fontSize: "1rem", color: "#e2e8f0", margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
          {message}
        </p>

        {/* Animated Spinner Bar */}
        <div
          style={{
            width: "180px",
            height: "6px",
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "9999px",
            overflow: "hidden",
            position: "relative",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "45%",
              background: "linear-gradient(90deg, #f59e0b, #ec4899)",
              borderRadius: "9999px",
              animation: "shimmer 1.4s ease-in-out infinite alternate",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(250%);
          }
        }
      `}</style>
    </div>
  )
}
