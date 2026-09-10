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

  const headVisualId = headItem?.visual_id || ""
  const bodyVisualId = bodyItem?.visual_id || ""
  const weaponVisualId = weaponItem?.visual_id || ""
  const feetVisualId = feetItem?.visual_id || ""

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
        viewBox="0 0 300 390"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.4))" }}
      >
        <defs>
          {/* Skin Gradient */}
          <linearGradient id="skinBase" x1="150" y1="50" x2="150" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fad7bc" />
            <stop offset="100%" stopColor="#e3af8b" />
          </linearGradient>
          <linearGradient id="skinShadow" x1="150" y1="110" x2="150" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e3af8b" />
            <stop offset="100%" stopColor="#c58e69" />
          </linearGradient>

          {/* Thick Beard & Hair Gradient */}
          <linearGradient id="beardGrad" x1="150" y1="70" x2="150" y2="145" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2c241e" />
            <stop offset="60%" stopColor="#1a1410" />
            <stop offset="100%" stopColor="#0f0c09" />
          </linearGradient>

          {/* Basic White Islamic Thobe Gradient */}
          <linearGradient id="thobeGrad" x1="150" y1="130" x2="150" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f8fafc" />
            <stop offset="85%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Gold / Royal Accents Gradient */}
          <linearGradient id="goldAccent" x1="100" y1="40" x2="200" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Steel Armor Gradient */}
          <linearGradient id="steelArmor" x1="110" y1="130" x2="190" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Mamluk Dark Steel Gradient */}
          <linearGradient id="mamlukSteel" x1="110" y1="130" x2="190" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Andalus Navy & Gold Gradient */}
          <linearGradient id="andalusGrad" x1="110" y1="130" x2="190" y2="300" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#172554" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Robe of Honor Celestial Blue */}
          <linearGradient id="celestialGrad" x1="110" y1="130" x2="190" y2="310" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Sword of Conquest Light Gradient */}
          <linearGradient id="conquestBlade" x1="210" y1="50" x2="250" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#bae6fd" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Leather Brown Gradient */}
          <linearGradient id="leatherGrad" x1="110" y1="140" x2="190" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="50%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Green Murabit Gradient */}
          <linearGradient id="murabitGreen" x1="120" y1="50" x2="180" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="heroGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================= 1. PEDESTAL & GROUND ================= */}
        {showPedestal && (
          <g id="pedestal">
            <ellipse cx="150" cy="362" rx="100" ry="20" fill="rgba(0,0,0,0.5)" filter="blur(5px)" />
            <ellipse cx="150" cy="358" rx="84" ry="15" fill="#1e293b" stroke="#f59e0b" strokeWidth="2.5" />
            <ellipse cx="150" cy="356" rx="72" ry="11" fill="#0f172a" />
            <path d="M 95 357 Q 150 366 205 357" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.7" />
          </g>
        )}

        {/* ================= 2. BASIC ISLAMIC THOBE & BODY GEOMETRY ================= */}
        <g id="base_body">
          {/* Base Lower Thobe (Draping skirt with natural folds) */}
          <path
            d="M 116 230 L 98 335 Q 150 348 202 335 L 184 230 Z"
            fill="url(#thobeGrad)"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Thobe Crease Folds */}
          <path d="M 132 235 L 126 338" stroke="#cbd5e1" strokeWidth="1.8" />
          <path d="M 150 225 L 150 342" stroke="#94a3b8" strokeWidth="2" />
          <path d="M 168 235 L 174 338" stroke="#cbd5e1" strokeWidth="1.8" />

          {/* Base Upper Thobe (Torso & Shoulders) */}
          <path
            d="M 102 140 L 94 235 Q 150 245 206 235 L 198 140 Q 150 148 102 140 Z"
            fill="url(#thobeGrad)"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Thobe Islamic Collar & Placket Buttons */}
          <path d="M 143 136 L 143 185" stroke="#cbd5e1" strokeWidth="2.5" />
          <circle cx="143" cy="148" r="2" fill="#64748b" />
          <circle cx="143" cy="160" r="2" fill="#64748b" />
          <circle cx="143" cy="172" r="2" fill="#64748b" />

          {/* Left Arm (Relaxed at side / Ready to hold shield or rest on belt) */}
          <g id="left_arm">
            <path
              d="M 102 140 L 72 200 Q 66 215 76 222 L 92 185 L 110 148 Z"
              fill="url(#thobeGrad)"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Left Hand (Holding position) */}
            <circle cx="76" cy="220" r="9" fill="url(#skinBase)" stroke="#c58e69" strokeWidth="1.5" />
          </g>

          {/* Right Arm (Configured naturally forward to wield weapon) */}
          <g id="right_arm">
            <path
              d="M 198 140 L 222 192 Q 228 210 216 222 L 198 185 L 190 148 Z"
              fill="url(#thobeGrad)"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Right Hand (Grasping weapon firmly) */}
            <circle cx="216" cy="220" r="9.5" fill="url(#skinBase)" stroke="#c58e69" strokeWidth="1.5" />
          </g>
        </g>

        {/* ================= 3. FEET OVERLAY (7 DISTINCT ITEMS) ================= */}
        <g id="feet_layer">
          {feetVisualId === "starter_sandals" ? (
            /* 1. نعل البداية: نعل جلدي عربي خفيف بسيور */
            <g>
              <ellipse cx="124" cy="342" rx="14" ry="6" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
              <ellipse cx="176" cy="342" rx="14" ry="6" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
              <path d="M 115 340 Q 124 334 133 340" stroke="#d97706" strokeWidth="2.5" fill="none" />
              <path d="M 167 340 Q 176 334 185 340" stroke="#d97706" strokeWidth="2.5" fill="none" />
            </g>
          ) : feetVisualId === "courier_slippers" ? (
            /* 2. خف الساعي: خف خفيف ومريح بني أنيق */
            <g>
              <path d="M 112 336 Q 124 332 138 344 L 112 344 Z" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
              <path d="M 188 336 Q 176 332 162 344 L 188 344 Z" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
              <circle cx="124" cy="340" r="2" fill="#fbbf24" />
              <circle cx="176" cy="340" r="2" fill="#fbbf24" />
            </g>
          ) : feetVisualId === "murabit_boots" ? (
            /* 3. حذاء المرابط: حذاء جلدي متين مع أربطة خضراء */
            <g>
              <rect x="114" y="324" width="22" height="22" rx="4" fill="#065f46" stroke="#047857" strokeWidth="1.5" />
              <rect x="164" y="324" width="22" height="22" rx="4" fill="#065f46" stroke="#047857" strokeWidth="1.5" />
              <path d="M 114 330 L 136 330 M 114 336 L 136 336" stroke="#34d399" strokeWidth="2" />
              <path d="M 164 330 L 186 330 M 164 336 L 186 336" stroke="#34d399" strokeWidth="2" />
            </g>
          ) : feetVisualId === "desert_boots" ? (
            /* 4. خف الصحراء: خف صحراوي رملي عالي الساق */
            <g>
              <path d="M 112 316 L 110 345 L 138 345 L 136 316 Z" fill="#d97706" stroke="#92400e" strokeWidth="2" />
              <path d="M 188 316 L 190 345 L 162 345 L 164 316 Z" fill="#d97706" stroke="#92400e" strokeWidth="2" />
              <path d="M 110 334 Q 124 330 138 334" stroke="#78350f" strokeWidth="2" fill="none" />
              <path d="M 190 334 Q 176 330 162 334" stroke="#78350f" strokeWidth="2" fill="none" />
            </g>
          ) : feetVisualId === "knight_boots" ? (
            /* 5. حذاء الفرسان: حذاء جلدي بحلقات مصفحة */
            <g>
              <path d="M 112 312 L 109 346 L 138 346 L 135 312 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
              <path d="M 188 312 L 191 346 L 162 346 L 165 312 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
              <circle cx="124" cy="324" r="3.5" fill="#94a3b8" />
              <circle cx="176" cy="324" r="3.5" fill="#94a3b8" />
              <path d="M 110 335 L 138 335 M 162 335 L 190 335" stroke="#cbd5e1" strokeWidth="2" />
            </g>
          ) : feetVisualId === "armored_cavalry_boots" ? (
            /* 6. حذاء الخيل المدرع: صفائح فولاذية كاملة */
            <g>
              <path d="M 111 310 L 108 347 L 139 347 L 136 310 Z" fill="url(#steelArmor)" stroke="#475569" strokeWidth="2" />
              <path d="M 189 310 L 192 347 L 161 347 L 164 310 Z" fill="url(#steelArmor)" stroke="#475569" strokeWidth="2" />
              <path d="M 108 325 L 139 325 M 161 325 L 192 325" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="124" cy="336" r="3" fill="#0284c7" />
              <circle cx="176" cy="336" r="3" fill="#0284c7" />
            </g>
          ) : feetVisualId === "shoes_of_confidence" ? (
            /* 7. خف الواثق: خف أزرق سماوي مذهب فائق الفخامة */
            <g filter="url(#heroGlow)">
              <path d="M 110 312 L 108 346 L 139 346 L 137 312 Z" fill="url(#celestialGrad)" stroke="#f59e0b" strokeWidth="2" />
              <path d="M 190 312 L 192 346 L 161 346 L 163 312 Z" fill="url(#celestialGrad)" stroke="#f59e0b" strokeWidth="2" />
              <path d="M 108 330 Q 124 324 139 330" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
              <path d="M 192 330 Q 176 324 161 330" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
              <circle cx="124" cy="338" r="3.5" fill="#fef08a" />
              <circle cx="176" cy="338" r="3.5" fill="#fef08a" />
            </g>
          ) : (
            /* Default: نعل مريح بسيط */
            <g>
              <ellipse cx="124" cy="342" rx="14" ry="5.5" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
              <ellipse cx="176" cy="342" rx="14" ry="5.5" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
            </g>
          )}
        </g>

        {/* ================= 4. BODY ARMOR / CLOAK OVERLAY (7 DISTINCT ITEMS) ================= */}
        <g id="body_layer">
          {bodyVisualId === "starter_thobe" ? (
            /* 1. ثوب المبتدئ: حزام قماشي وتطريز بسيط */
            <g>
              <rect x="120" y="210" width="60" height="9" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M 144 140 L 144 200" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,2" />
            </g>
          ) : bodyVisualId === "courier_cloak" ? (
            /* 2. عباءة الساعي: عباءة رملية مع حزام جلدي متقاطع */
            <g>
              {/* Cloak Drapes on Back & Shoulders */}
              <path d="M 98 140 L 82 280 L 105 285 L 108 145 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
              <path d="M 202 140 L 218 280 L 195 285 L 192 145 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
              {/* Leather Crossed Chest Straps */}
              <path d="M 104 145 L 196 230" stroke="#78350f" strokeWidth="4.5" />
              <circle cx="150" cy="188" r="5" fill="#d97706" stroke="#451a03" strokeWidth="1.5" />
            </g>
          ) : bodyVisualId === "guard_vest" ? (
            /* 3. سترة الحرس: سترة جلدية مدرعة بأبازيم نحاسية */
            <g>
              <path
                d="M 104 140 L 96 230 Q 150 238 204 230 L 196 140 Q 150 146 104 140 Z"
                fill="url(#leatherGrad)"
                stroke="#451a03"
                strokeWidth="2"
              />
              <path d="M 125 155 L 175 155 M 125 180 L 175 180 M 125 205 L 175 205" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="150" cy="155" r="3" fill="#fef08a" />
              <circle cx="150" cy="180" r="3" fill="#fef08a" />
              <circle cx="150" cy="205" r="3" fill="#fef08a" />
            </g>
          ) : bodyVisualId === "light_knight_armor" ? (
            /* 4. درع الفرسان الخفيف: صدرية فولاذية مع أكتاف مصقولة */
            <g>
              <path
                d="M 104 138 L 96 232 Q 150 240 204 232 L 196 138 Q 150 146 104 138 Z"
                fill="url(#steelArmor)"
                stroke="#334155"
                strokeWidth="2"
              />
              {/* Pauldrons (Shoulders) */}
              <path d="M 98 138 Q 80 152 102 168 Z" fill="url(#steelArmor)" stroke="#38bdf8" strokeWidth="1.5" />
              <path d="M 202 138 Q 220 152 198 168 Z" fill="url(#steelArmor)" stroke="#38bdf8" strokeWidth="1.5" />
              {/* Medallion */}
              <circle cx="150" cy="180" r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="148" cy="178" r="2" fill="#ffffff" />
            </g>
          ) : bodyVisualId === "andalus_cloak" ? (
            /* 5. عباءة الأندلس: كسوة كحلية ملكية بزخرفة قرطبية مذهبة */
            <g>
              <path
                d="M 102 138 L 92 270 Q 150 280 208 270 L 198 138 Z"
                fill="url(#andalusGrad)"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              {/* Islamic Arabesque Lines */}
              <path d="M 150 142 L 150 275" stroke="#fbbf24" strokeWidth="2.5" />
              <path d="M 120 160 Q 150 175 180 160" stroke="#fbbf24" strokeWidth="2" fill="none" />
              <path d="M 120 200 Q 150 215 180 200" stroke="#fbbf24" strokeWidth="2" fill="none" />
              <path d="M 120 240 Q 150 255 180 240" stroke="#fbbf24" strokeWidth="2" fill="none" />
              <rect x="120" y="215" width="60" height="12" rx="4" fill="#b45309" stroke="#fef08a" strokeWidth="1.5" />
              <circle cx="150" cy="221" r="4.5" fill="#f59e0b" />
            </g>
          ) : bodyVisualId === "mamluk_steel_armor" ? (
            /* 6. درع المماليك الفولاذي: درع حلقي مع قرص صدر حديدي مهيب */
            <g>
              <path
                d="M 102 138 L 94 235 Q 150 245 206 235 L 198 138 Q 150 146 102 138 Z"
                fill="url(#mamlukSteel)"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
              {/* Chainmail Grid Pattern */}
              <path d="M 110 150 H 190 M 106 165 H 194 M 104 180 H 196 M 104 195 H 196" stroke="#475569" strokeWidth="1.2" strokeDasharray="3,3" />
              {/* Central Roundel Shielding Plate */}
              <circle cx="150" cy="185" r="18" fill="url(#steelArmor)" stroke="#f59e0b" strokeWidth="2.5" />
              <circle cx="150" cy="185" r="10" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
              <circle cx="150" cy="185" r="4" fill="#f59e0b" />
              {/* Heavy Pauldrons */}
              <path d="M 96 136 Q 74 150 100 172 Z" fill="url(#steelArmor)" stroke="#0f172a" strokeWidth="2" />
              <path d="M 204 136 Q 226 150 200 172 Z" fill="url(#steelArmor)" stroke="#0f172a" strokeWidth="2" />
            </g>
          ) : bodyVisualId === "robe_of_honor" ? (
            /* 7. حُلة الكرامة: حُلة سماوية مذهبة متلألئة بأنوار القرآن */
            <g filter="url(#heroGlow)">
              <path
                d="M 100 138 L 90 285 Q 150 298 210 285 L 200 138 Z"
                fill="url(#celestialGrad)"
                stroke="#fbbf24"
                strokeWidth="2.5"
              />
              {/* Gold Filigree Embroidery */}
              <path d="M 150 142 L 150 290" stroke="#fef08a" strokeWidth="3" />
              <path d="M 115 170 Q 150 190 185 170" stroke="#fef08a" strokeWidth="2.5" fill="none" />
              <path d="M 115 220 Q 150 240 185 220" stroke="#fef08a" strokeWidth="2.5" fill="none" />
              {/* Royal Gold Girdle */}
              <rect x="115" y="210" width="70" height="14" rx="4" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1.5" />
              <circle cx="150" cy="217" r="5" fill="#ffffff" />
            </g>
          ) : null}
        </g>

        {/* ================= 5. WEAPON OVERLAY (7 DISTINCT ITEMS IN HAND) ================= */}
        <g id="weapon_layer">
          {weaponVisualId === "traveler_staff" ? (
            /* 1. عصا الترحال: عصا سنديان خشبية متينة */
            <g>
              <rect x="212" y="70" width="7" height="270" rx="3.5" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
              <circle cx="215.5" cy="74" r="7" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
              {/* Leather Hand Grip Wrap */}
              <rect x="211" y="208" width="9" height="24" rx="2" fill="#451a03" stroke="#b45309" strokeWidth="1" />
            </g>
          ) : weaponVisualId === "dagger_of_certainty" ? (
            /* 2. خنجر اليقين: خنجر فولاذي منقوش */
            <g>
              <path d="M 215 210 L 235 155 Q 238 150 240 156 L 222 214 Z" fill="url(#steelArmor)" stroke="#475569" strokeWidth="1.5" />
              <rect x="210" y="212" width="16" height="5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
              <path d="M 216 217 L 214 235" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
            </g>
          ) : weaponVisualId === "bow_of_insight" ? (
            /* 3. قوس البصيرة: قوس عربي مركب مشدود */
            <g>
              <path d="M 205 105 Q 255 190 215 295" stroke="#b45309" strokeWidth="6" fill="none" strokeLinecap="round" />
              <path d="M 205 105 L 215 295" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="4,1" />
              <circle cx="230" cy="200" r="4" fill="#fbbf24" />
            </g>
          ) : weaponVisualId === "sword_of_resolve" ? (
            /* 4. سيف العزيمة: سيف دمشقي مستقيم بمقبض ذهبي */
            <g>
              {/* Blade */}
              <path d="M 214 210 L 236 65 L 240 50 L 244 65 L 222 210 Z" fill="url(#steelArmor)" stroke="#334155" strokeWidth="1.5" />
              <path d="M 218 205 L 240 65" stroke="#f8fafc" strokeWidth="1.5" />
              {/* Crossguard */}
              <rect x="204" y="208" width="28" height="6" rx="2" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1" />
              {/* Grip & Pommel */}
              <rect x="215" y="214" width="6" height="18" rx="2" fill="#78350f" />
              <circle cx="218" cy="234" r="4" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1" />
            </g>
          ) : weaponVisualId === "spear_of_steadfastness" ? (
            /* 5. رمح الثبات: رمح طويل مع راية خضراء */
            <g>
              {/* Shaft */}
              <rect x="213" y="45" width="6" height="300" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
              {/* Spearhead */}
              <path d="M 211 48 L 216 18 L 221 48 Z" fill="url(#steelArmor)" stroke="#0284c7" strokeWidth="1.5" />
              {/* Fluttering Green Flag */}
              <path d="M 219 46 Q 255 58 245 80 Q 230 75 219 72 Z" fill="#059669" stroke="#10b981" strokeWidth="1" />
            </g>
          ) : weaponVisualId === "blade_of_yarmouk" ? (
            /* 6. نصل اليرموك: نصل منحني مهيب مع تفاصيل ذهبية */
            <g>
              {/* Curved Scimitar Blade */}
              <path
                d="M 215 210 Q 235 140 258 75 Q 255 68 248 74 Q 228 135 221 210 Z"
                fill="url(#steelArmor)"
                stroke="#1e293b"
                strokeWidth="2"
              />
              <path d="M 221 175 Q 236 120 248 80" stroke="#f59e0b" strokeWidth="1.5" />
              {/* Ornate Guard & Hilt */}
              <rect x="206" y="208" width="25" height="7" rx="2" fill="url(#goldAccent)" stroke="#451a03" strokeWidth="1.2" />
              <circle cx="218.5" cy="211.5" r="2.5" fill="#ef4444" />
            </g>
          ) : weaponVisualId === "sword_of_conquest" ? (
            /* 7. سيف الفتح المبين: سيف ملحمي متوهج بالنور السماوي والنجوم */
            <g filter="url(#heroGlow)">
              {/* Radiant Blade */}
              <path
                d="M 213 210 L 236 50 L 241 35 L 246 50 L 223 210 Z"
                fill="url(#conquestBlade)"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <path d="M 218 205 L 241 50" stroke="#ffffff" strokeWidth="2.5" />
              {/* Crossguard & Large Gem */}
              <rect x="202" y="208" width="32" height="7" rx="2.5" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1.2" />
              <circle cx="218" cy="211.5" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <circle cx="218" cy="234" r="5" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1.2" />
              {/* Star Sparkles */}
              <path d="M 241 30 L 242 35 L 247 36 L 242 37 L 241 42 L 240 37 L 235 36 L 240 35 Z" fill="#ffffff" />
            </g>
          ) : null}
        </g>

        {/* ================= 6. HEAD, HAIR & THICK BEARD (STRICTLY FACELESS) ================= */}
        <g id="head_and_beard">
          {/* Neck */}
          <rect x="141" y="118" width="18" height="24" rx="3" fill="url(#skinShadow)" stroke="#c58e69" strokeWidth="1" />

          {/* Hair Base (Back of the head & temples) */}
          <path
            d="M 120 100 C 112 68 122 42 150 42 C 178 42 188 68 180 100 Z"
            fill="url(#beardGrad)"
          />

          {/* Head Shape (Clean, Dignified Oval - PURE BLANK FACE, NO EYES, NO NOSE, NO MOUTH) */}
          <ellipse cx="150" cy="94" rx="25" ry="32" fill="url(#skinBase)" stroke="#c58e69" strokeWidth="1.8" />

          {/* Thick Dignified Beard (لحية كثيفة وقورة تملأ الفك والذقن والوجنتين) */}
          <path
            d="M 125 90 
               C 124 115 130 142 150 144 
               C 170 142 176 115 175 90 
               C 174 105 168 126 150 126 
               C 132 126 126 105 125 90 Z"
            fill="url(#beardGrad)"
          />
          {/* Natural Beard Fullness Shadow & Strands */}
          <path
            d="M 132 124 Q 150 148 168 124 Q 150 134 132 124 Z"
            fill="#0f0c09"
          />

          {/* Dignified Full Moustache Frame (NO mouth opening/slit at all) */}
          <path
            d="M 136 112 Q 150 108 164 112 Q 150 117 136 112 Z"
            fill="url(#beardGrad)"
          />

          {/* Front Hair Strands (Neat, well-groomed hairline on forehead) */}
          <path
            d="M 124 74 Q 150 58 176 74 Q 166 62 150 62 Q 134 62 124 74 Z"
            fill="url(#beardGrad)"
          />
        </g>

        {/* ================= 7. HEADGEAR OVERLAY (7 DISTINCT ITEMS) ================= */}
        <g id="headgear_layer">
          {headVisualId === "starter_cap" ? (
            /* 1. طاقية البداية: طاقية بيضاء محبوكة بسيطة ووقورة */
            <g>
              <path
                d="M 126 78 Q 150 54 174 78 Q 150 72 126 78 Z"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <path d="M 134 72 Q 150 64 166 72" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3,2" />
            </g>
          ) : headVisualId === "courier_keffiyeh" ? (
            /* 2. كوفية الساعي: كوفية رملية مريحة مع عقال */
            <g>
              <path d="M 120 80 Q 150 60 180 80 L 186 115 L 175 110 L 172 85 Q 150 78 128 85 L 125 110 L 114 115 Z" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
              {/* Black Agal */}
              <ellipse cx="150" cy="74" rx="27" ry="6" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            </g>
          ) : headVisualId === "murabit_turban" ? (
            /* 3. عمامة المرابط: عمامة خضراء مباركة مع ذؤابة منسدلة */
            <g>
              <ellipse cx="150" cy="68" rx="29" ry="18" fill="url(#murabitGreen)" stroke="#064e3b" strokeWidth="2" />
              <path d="M 123 72 Q 150 82 177 72 Q 150 64 123 72 Z" fill="#059669" stroke="#34d399" strokeWidth="1.5" />
              {/* Hanging Turban Tail */}
              <path d="M 174 74 Q 186 105 180 130" stroke="#059669" strokeWidth="6" strokeLinecap="round" fill="none" />
            </g>
          ) : headVisualId === "knight_helmet" ? (
            /* 4. خوذة الفرسان: خوذة حديدية مصقولة بحامية أنف وعين */
            <g>
              <path
                d="M 122 86 C 120 54 135 44 150 44 C 165 44 180 54 178 86 Z"
                fill="url(#steelArmor)"
                stroke="#334155"
                strokeWidth="2"
              />
              <path d="M 123 84 Q 150 88 177 84" stroke="#94a3b8" strokeWidth="2.5" />
              <circle cx="150" cy="58" r="3.5" fill="#f59e0b" />
            </g>
          ) : headVisualId === "hijaz_turban" ? (
            /* 5. عمامة الحجاز: عمامة حجازية ناصعة البياض بالقصب الذهبي */
            <g>
              <ellipse cx="150" cy="66" rx="30" ry="19" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
              {/* Gold Brocade Bands */}
              <path d="M 122 70 Q 150 82 178 70" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
              <path d="M 126 60 Q 150 72 174 60" stroke="#f59e0b" strokeWidth="2" fill="none" />
              <circle cx="150" cy="72" r="4.5" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1" />
            </g>
          ) : headVisualId === "ayyubid_helmet" ? (
            /* 6. خوذة الأيوبيين: خوذة مخروطية مذهبة ذات بأس وهيبة */
            <g>
              {/* Conical Spire */}
              <path
                d="M 122 84 L 150 32 L 178 84 Q 150 90 122 84 Z"
                fill="url(#goldAccent)"
                stroke="#78350f"
                strokeWidth="2"
              />
              <circle cx="150" cy="32" r="3.5" fill="#ef4444" />
              <path d="M 124 82 H 176" stroke="#ffffff" strokeWidth="2" />
              {/* Cheek Guards */}
              <path d="M 123 84 L 120 110 L 129 104 Z" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1.2" />
              <path d="M 177 84 L 180 110 L 171 104 Z" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="1.2" />
            </g>
          ) : headVisualId === "crown_of_dignity" ? (
            /* 7. تاج الوقار: التاج الأعظم المرصع بالياقوت والأنوار المضيئة */
            <g filter="url(#heroGlow)">
              <path
                d="M 124 76 Q 150 82 176 76 L 178 70 Q 150 76 122 70 Z"
                fill="url(#goldAccent)"
                stroke="#78350f"
                strokeWidth="2"
              />
              {/* 5 Spires */}
              <path
                d="M 124 74 L 127 50 L 136 64 L 150 40 L 164 64 L 173 50 L 176 74 Z"
                fill="url(#goldAccent)"
                stroke="#78350f"
                strokeWidth="1.8"
              />
              {/* Rubies & Gems */}
              <circle cx="150" cy="42" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="128" cy="52" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <circle cx="172" cy="52" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <circle cx="150" cy="74" r="3" fill="#ef4444" />
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  )
}
