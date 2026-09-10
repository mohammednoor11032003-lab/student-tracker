"use client"
import React from "react"
import { ShopItem } from "@/lib/hero-utils"

interface HeroAvatarProps {
  equipped?: {
    head?: ShopItem | null
    body?: ShopItem | null
    weapon?: ShopItem | null
    feet?: ShopItem | null
  }
  size?: number
  className?: string
}

export default function HeroAvatar({
  size = 260,
  className = "",
}: HeroAvatarProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.6))" }}
      >
        <defs>
          {/* Cosmic Void Radial Glow */}
          <radialGradient id="voidAura" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="45%" stopColor="#0f172a" />
            <stop offset="85%" stopColor="#020617" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Ethereal Rim Light on Silhouette */}
          <linearGradient id="neonRim" x1="40" y1="40" x2="200" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Dark Silhouette Body Gradient */}
          <linearGradient id="darkSilhouette" x1="120" y1="45" x2="120" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="35%" stopColor="#0f172a" />
            <stop offset="80%" stopColor="#020617" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Golden Ring Gradient */}
          <linearGradient id="portalGold" x1="30" y1="20" x2="210" y2="220" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Glow Filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================= 1. THE MYSTICAL PORTAL RING ================= */}
        <circle cx="120" cy="120" r="115" fill="url(#voidAura)" stroke="url(#portalGold)" strokeWidth="2.5" />
        <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" strokeDasharray="6,4" />

        {/* Floating Stars / Mystic Particles */}
        <circle cx="55" cy="85" r="1.5" fill="#38bdf8" opacity="0.7" />
        <circle cx="185" cy="75" r="1.5" fill="#fef08a" opacity="0.6" />
        <circle cx="70" cy="165" r="2" fill="#38bdf8" opacity="0.5" />
        <circle cx="170" cy="160" r="2" fill="#fef08a" opacity="0.7" />
        <circle cx="120" cy="35" r="1.8" fill="#ffffff" opacity="0.8" />

        {/* Atmospheric Backlight Halo */}
        <ellipse cx="120" cy="100" rx="65" ry="75" fill="rgba(2, 132, 199, 0.15)" filter="blur(20px)" />
        <ellipse cx="120" cy="80" rx="40" ry="45" fill="rgba(245, 158, 11, 0.12)" filter="blur(15px)" />

        {/* ================= 2. THE ABSTRACT DARK SILHOUETTE (HEAD & SHOULDERS) ================= */}
        {/* Soft Silhouette Cast Shadow */}
        <path
          d="M 50 216
             C 52 165, 82 135, 106 120
             L 106 102
             C 96 98, 90 85, 90 74
             C 90 54, 103 40, 120 40
             C 137 40, 150 54, 150 74
             C 150 85, 144 98, 134 102
             L 134 120
             C 158 135, 188 165, 190 216
             Z"
          fill="#000000"
          filter="blur(8px)"
          opacity="0.8"
        />

        {/* Main Solid Dark Silhouette Body & Head */}
        <g filter="drop-shadow(0 0 10px rgba(56, 189, 248, 0.35))">
          {/* Shoulders & Bust */}
          <path
            d="M 48 215
               C 50 162, 82 130, 107 118
               L 107 106
               L 133 106
               L 133 118
               C 158 130, 190 162, 192 215
               C 170 224, 70 224, 48 215
               Z"
            fill="url(#darkSilhouette)"
            stroke="url(#neonRim)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Smooth Noble Head Oval (100% Faceless, Abstract Silhouette) */}
          <ellipse
            cx="120"
            cy="76"
            rx="25"
            ry="32"
            fill="url(#darkSilhouette)"
            stroke="url(#neonRim)"
            strokeWidth="2"
          />

          {/* Abstract Subtle Beard Line (Sleek vector silhouette contour) */}
          <path
            d="M 98 75
               C 100 95, 108 114, 120 114
               C 132 114, 140 95, 142 75"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Center Heart Emblem / Quran Knight Core Stone */}
        <circle cx="120" cy="165" r="4.5" fill="#38bdf8" filter="url(#neonGlow)" />
        <circle cx="120" cy="165" r="2" fill="#ffffff" />
        <line x1="120" y1="130" x2="120" y2="210" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.5" strokeDasharray="4,4" />
      </svg>
    </div>
  )
}
