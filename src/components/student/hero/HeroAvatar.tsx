"use client"
import React from "react"
import { ShopItem } from "@/lib/hero-utils"

interface HeroAvatarProps {
  equipped: {
    head?: ShopItem | null
    body?: ShopItem | null
    weapon?: ShopItem | null
    feet?: ShopItem | null
  }
  size?: number
  showPedestal?: boolean
  className?: string
}

export default function HeroAvatar({
  equipped,
  size = 320,
  showPedestal = true,
  className = "",
}: HeroAvatarProps) {
  const headItem = equipped.head
  const bodyItem = equipped.body
  const weaponItem = equipped.weapon
  const feetItem = equipped.feet

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
        height={Math.round(size * 1.3)}
        viewBox="0 0 280 370"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.35))" }}
      >
        <defs>
          {/* Skin Gradient */}
          <linearGradient id="skinGrad" x1="140" y1="65" x2="140" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f7d5be" />
            <stop offset="100%" stopColor="#e2b494" />
          </linearGradient>

          {/* Hair & Beard Gradient */}
          <linearGradient id="hairGrad" x1="140" y1="50" x2="140" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#292524" />
            <stop offset="100%" stopColor="#1c1917" />
          </linearGradient>

          {/* Base Tunic Gradient */}
          <linearGradient id="baseTunicGrad" x1="140" y1="140" x2="140" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Silver Armor Gradient */}
          <linearGradient id="silverArmorGrad" x1="100" y1="145" x2="180" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Golden Crown & Accents Gradient */}
          <linearGradient id="goldGrad" x1="100" y1="40" x2="180" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Emerald Green Turban Gradient */}
          <linearGradient id="emeraldGrad" x1="100" y1="40" x2="180" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Radiant Sword Blade Glow */}
          <linearGradient id="bladeGrad" x1="220" y1="110" x2="250" y2="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e0f2fe" />
            <stop offset="80%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Glow Filter */}
          <filter id="radiantGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. PEDESTAL & GROUND SHADOW */}
        {showPedestal && (
          <g id="pedestal">
            {/* Ambient ground shadow */}
            <ellipse cx="140" cy="340" rx="90" ry="20" fill="rgba(0,0,0,0.45)" filter="blur(4px)" />
            {/* Stone/Metal Hero Dais */}
            <ellipse cx="140" cy="336" rx="75" ry="14" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
            <ellipse cx="140" cy="334" rx="65" ry="10" fill="#0f172a" />
            <path d="M 90 335 Q 140 342 190 335" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.6" />
          </g>
        )}

        {/* 2. LEGS & LOWER BODY (BASE) */}
        <g id="legs">
          {/* Base Pants */}
          <path d="M 112 250 L 105 315 L 125 315 L 132 255 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M 168 250 L 175 315 L 155 315 L 148 255 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
        </g>

        {/* 3. FEET / BOOTS (NATURAL OR EQUIPPED) */}
        <g id="feet">
          {feetItem ? (
            feetItem.visual_id === "greaves_steel" ? (
              /* Steel Greaves */
              <g>
                {/* Left Greave */}
                <path d="M 103 290 L 101 328 L 128 328 L 127 290 Z" fill="url(#silverArmorGrad)" stroke="#475569" strokeWidth="1.5" />
                <path d="M 97 325 L 97 334 L 131 334 L 131 325 Z" fill="#334155" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="114" cy="295" r="4" fill="#0284c7" />

                {/* Right Greave */}
                <path d="M 177 290 L 179 328 L 152 328 L 153 290 Z" fill="url(#silverArmorGrad)" stroke="#475569" strokeWidth="1.5" />
                <path d="M 183 325 L 183 334 L 149 334 L 149 325 Z" fill="#334155" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="166" cy="295" r="4" fill="#0284c7" />
              </g>
            ) : (
              /* High Ambition Leather Boots */
              <g>
                <path d="M 102 292 L 100 334 L 129 334 L 128 292 Z" fill="#78350f" stroke="#b45309" strokeWidth="2" />
                <path d="M 98 326 Q 114 322 130 326" stroke="#fbbf24" strokeWidth="2" fill="none" />

                <path d="M 178 292 L 180 334 L 151 334 L 152 292 Z" fill="#78350f" stroke="#b45309" strokeWidth="2" />
                <path d="M 182 326 Q 166 322 150 326" stroke="#fbbf24" strokeWidth="2" fill="none" />
              </g>
            )
          ) : (
            /* Natural Simple Shoes */
            <g>
              <ellipse cx="114" cy="326" rx="14" ry="7" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
              <ellipse cx="166" cy="326" rx="14" ry="7" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
            </g>
          )}
        </g>

        {/* 4. BASE TORSO & ARMS */}
        <g id="torso_base">
          {/* Base Tunic */}
          <path
            d="M 105 142 L 88 245 Q 140 255 192 245 L 175 142 Z"
            fill="url(#baseTunicGrad)"
            stroke="#0f172a"
            strokeWidth="2"
          />

          {/* Left Arm (Relaxed) */}
          <path
            d="M 105 142 L 72 205 Q 68 220 78 225 L 92 185 L 105 148 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Left Hand (holding shield or relaxed) */}
          <circle cx="75" cy="225" r="9" fill="url(#skinGrad)" stroke="#c28b67" strokeWidth="1.5" />

          {/* Right Arm (bent holding weapon or at side) */}
          <path
            d="M 175 142 L 208 200 Q 215 215 205 225 L 188 185 L 175 148 Z"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Right Hand */}
          <circle cx="205" cy="220" r="9" fill="url(#skinGrad)" stroke="#c28b67" strokeWidth="1.5" />
        </g>

        {/* 5. BODY ARMOR OVERLAY (IF EQUIPPED) */}
        {bodyItem && (
          <g id="body_armor">
            {bodyItem.visual_id === "armor_silver" ? (
              /* Silver Mastery Cuirass */
              <g>
                {/* Cuirass Body */}
                <path
                  d="M 104 140 L 92 235 Q 140 244 188 235 L 176 140 Q 140 148 104 140 Z"
                  fill="url(#silverArmorGrad)"
                  stroke="#334155"
                  strokeWidth="2"
                />
                {/* Chest Plates / Ridges */}
                <path d="M 112 165 Q 140 175 168 165" stroke="#f8fafc" strokeWidth="2.5" fill="none" />
                <path d="M 116 195 Q 140 205 164 195" stroke="#f8fafc" strokeWidth="2.5" fill="none" />
                {/* Center Medallion Gem */}
                <circle cx="140" cy="180" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="138" cy="178" r="2" fill="#ffffff" />
                {/* Pauldrons (Shoulder Guards) */}
                <path d="M 96 140 Q 80 152 100 168 Z" fill="url(#silverArmorGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 184 140 Q 200 152 180 168 Z" fill="url(#silverArmorGrad)" stroke="#38bdf8" strokeWidth="1.5" />
              </g>
            ) : (
              /* Embroidered Conqueror Robe (Navy & Silver) */
              <g>
                <path
                  d="M 104 140 L 90 245 Q 140 252 190 245 L 176 140 Z"
                  fill="#1e3a8a"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                {/* Silver Embroidered Trims */}
                <path d="M 140 144 L 140 248" stroke="#e2e8f0" strokeWidth="3" />
                <path d="M 115 155 L 165 155" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
                <path d="M 115 190 L 165 190" stroke="#fbbf24" strokeWidth="2" />
                <path d="M 115 225 L 165 225" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
                {/* Gold Belt */}
                <rect x="110" y="215" width="60" height="10" rx="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                <circle cx="140" cy="220" r="4" fill="#ffffff" />
              </g>
            )}
          </g>
        )}

        {/* 6. WEAPON OVERLAY (IF EQUIPPED) */}
        {weaponItem && (
          <g id="weapon">
            {weaponItem.visual_id === "sword_radiant" ? (
              /* Radiant Sword held in Right Hand */
              <g filter="url(#radiantGlow)">
                {/* Blade */}
                <path
                  d="M 205 210 L 235 65 L 243 65 L 215 210 Z"
                  fill="url(#bladeGrad)"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* Sword Tip Sharp Corner */}
                <path d="M 235 65 L 239 48 L 243 65 Z" fill="#ffffff" stroke="#38bdf8" strokeWidth="1" />
                {/* Center Fuller Glow */}
                <path d="M 210 205 L 238 68" stroke="#ffffff" strokeWidth="2" />
                {/* Crossguard */}
                <rect x="195" y="208" width="30" height="7" rx="2" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
                {/* Emerald in Crossguard */}
                <circle cx="210" cy="211" r="3" fill="#10b981" />
                {/* Pommel */}
                <circle cx="203" cy="228" r="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
              </g>
            ) : (
              /* Shield of Patience on Left Arm */
              <g>
                {/* Shield Body */}
                <ellipse cx="68" cy="210" rx="26" ry="34" fill="#0f172a" stroke="#d97706" strokeWidth="3" />
                <ellipse cx="68" cy="210" rx="21" ry="28" fill="#1e293b" />
                {/* Islamic Star Pattern / Cross Accent */}
                <path d="M 68 186 L 68 234" stroke="#fbbf24" strokeWidth="2.5" />
                <path d="M 48 210 L 88 210" stroke="#fbbf24" strokeWidth="2.5" />
                {/* Center Boss Gold */}
                <circle cx="68" cy="210" r="7" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1.5" />
                <circle cx="68" cy="210" r="2.5" fill="#ffffff" />
              </g>
            )}
          </g>
        )}

        {/* 7. NECK & HEAD (STRICT FACELESS SCHOLAR/WARRIOR) */}
        <g id="head_and_face">
          {/* Neck */}
          <rect x="131" y="120" width="18" height="24" rx="3" fill="url(#skinGrad)" stroke="#c28b67" strokeWidth="1" />

          {/* Hair Background (Back/Sides) */}
          <path
            d="M 112 105 C 104 78 112 50 140 50 C 168 50 176 78 168 105 Z"
            fill="url(#hairGrad)"
          />

          {/* HEAD OUTLINE WITH PURE BLANK FACE */}
          {/* Strict Rule: Absolutely NO Eyes, NO Nose, NO Mouth */}
          <ellipse cx="140" cy="98" rx="24" ry="31" fill="url(#skinGrad)" stroke="#b87f58" strokeWidth="2" />

          {/* Dignified Trimmed Beard (Jawline & Chin Frame, Face remains 100% blank) */}
          <path
            d="M 118 95 C 117 115 125 136 140 137 C 155 136 163 115 162 95 C 162 108 152 130 140 130 C 128 130 118 108 118 95 Z"
            fill="url(#hairGrad)"
          />
          {/* Moustache frame along upper lip contour only (NO mouth slit) */}
          <path
            d="M 128 116 Q 140 112 152 116 Q 140 118 128 116 Z"
            fill="url(#hairGrad)"
          />

          {/* Front Hair Strands on top of forehead */}
          <path
            d="M 116 80 Q 140 64 164 80 Q 155 68 140 68 Q 125 68 116 80 Z"
            fill="url(#hairGrad)"
          />
        </g>

        {/* 8. HEADGEAR OVERLAY (IF EQUIPPED) */}
        {headItem && (
          <g id="headgear">
            {headItem.visual_id === "turban_cavalry" ? (
              /* Emerald Green & Gold Cavalry Turban */
              <g>
                {/* Main Turban Dome */}
                <ellipse cx="140" cy="70" rx="28" ry="18" fill="url(#emeraldGrad)" stroke="#064e3b" strokeWidth="2" />
                {/* Wrapped Cloth Folds */}
                <path
                  d="M 114 74 Q 140 84 166 74 Q 140 66 114 74 Z"
                  fill="#059669"
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <path
                  d="M 116 64 Q 140 74 164 64"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Golden Forehead Gem Ornament */}
                <circle cx="140" cy="74" r="5" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
                <circle cx="140" cy="74" r="2" fill="#ffffff" />
                {/* Tail cloth hanging gently behind shoulder */}
                <path d="M 162 76 Q 172 105 168 125" stroke="#059669" strokeWidth="5" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              /* Golden Recitation Crown */
              <g filter="url(#radiantGlow)">
                {/* Crown Base Band */}
                <path
                  d="M 116 75 Q 140 80 164 75 L 165 70 Q 140 75 115 70 Z"
                  fill="url(#goldGrad)"
                  stroke="#78350f"
                  strokeWidth="1.5"
                />
                {/* 5 Crown Spires */}
                <path
                  d="M 117 72 L 120 54 L 128 66 L 140 46 L 152 66 L 160 54 L 163 72 Z"
                  fill="url(#goldGrad)"
                  stroke="#78350f"
                  strokeWidth="1.5"
                />
                {/* Ruby Jewels on Crown Spire Tips */}
                <circle cx="140" cy="48" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                <circle cx="120" cy="56" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="160" cy="56" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="140" cy="75" r="2.5" fill="#ef4444" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
