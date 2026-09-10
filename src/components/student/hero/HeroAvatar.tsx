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
        height={Math.round(size * 1.28)}
        viewBox="0 0 280 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.35))" }}
      >
        <defs>
          {/* Ambient Hero Glow */}
          <radialGradient id="auraGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.18)" />
            <stop offset="60%" stopColor="rgba(56, 189, 248, 0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Skin Tone Gradient (Soft warm olive/caramel) */}
          <linearGradient id="flatSkin" x1="140" y1="45" x2="140" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f7d4bb" />
            <stop offset="100%" stopColor="#e4b08b" />
          </linearGradient>

          {/* Thick Beard & Hair (Smooth rich espresso brown/black) */}
          <linearGradient id="flatBeard" x1="140" y1="40" x2="140" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2c221c" />
            <stop offset="100%" stopColor="#15100d" />
          </linearGradient>

          {/* Seamless White Thobe Gradient */}
          <linearGradient id="flatThobe" x1="140" y1="105" x2="140" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f8fafc" />
            <stop offset="90%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Gold / Royal Gradient */}
          <linearGradient id="flatGold" x1="100" y1="40" x2="180" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Polished Steel Armor */}
          <linearGradient id="flatSteel" x1="100" y1="110" x2="180" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Mamluk Dark Steel */}
          <linearGradient id="flatMamluk" x1="100" y1="110" x2="180" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="55%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Andalus Navy & Gold */}
          <linearGradient id="flatAndalus" x1="100" y1="110" x2="180" y2="270" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="60%" stopColor="#172554" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Celestial Robe of Honor */}
          <linearGradient id="flatCelestial" x1="100" y1="110" x2="180" y2="270" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Sword of Conquest Blade Glow */}
          <linearGradient id="swordGlow" x1="215" y1="40" x2="235" y2="230" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#bae6fd" />
            <stop offset="70%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Murabit Green */}
          <linearGradient id="flatMurabit" x1="110" y1="40" x2="170" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Leather Brown */}
          <linearGradient id="flatLeather" x1="100" y1="120" x2="180" y2="230" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="55%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Magic Glow Filter */}
          <filter id="auraFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Subtle Aura */}
        <ellipse cx="140" cy="180" rx="110" ry="140" fill="url(#auraGlow)" />

        {/* ================= 1. PEDESTAL & GROUND SHADOW ================= */}
        {showPedestal && (
          <g id="pedestal">
            {/* Soft ground shadow */}
            <ellipse cx="140" cy="336" rx="88" ry="16" fill="rgba(0,0,0,0.45)" filter="blur(4px)" />
            {/* Elegant dais platform */}
            <ellipse cx="140" cy="332" rx="76" ry="12" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <ellipse cx="140" cy="330" rx="66" ry="9" fill="#0f172a" />
            <path d="M 94 331 Q 140 338 186 331" stroke="#fbbf24" strokeWidth="1.2" fill="none" opacity="0.6" />
          </g>
        )}

        {/* ================= 2. UNIFIED COHESIVE BODY (FLAT MINIMALIST SILHOUETTE) ================= */}
        <g id="hero_unified_body">
          {/* 
            Main Unified Silhouette:
            Curves smoothly from neck -> left rounded shoulder -> left arm drape -> thobe hem -> right arm drape -> right rounded shoulder -> neck.
            A continuous, clean single-body master vector!
          */}
          <path
            d="M 132 108
               C 120 110, 84 122, 74 156
               C 66 182, 70 236, 64 308
               C 62 316, 70 320, 82 319
               Q 140 327, 198 319
               C 210 320, 218 316, 216 308
               C 210 236, 214 182, 206 156
               C 196 122, 160 110, 148 108
               Z"
            fill="url(#flatThobe)"
            stroke="#94a3b8"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Natural thobe drape lines (minimalist folds) */}
          <path d="M 140 126 L 140 322" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <path d="M 112 185 C 114 235, 108 280, 102 318" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 168 185 C 166 235, 172 280, 178 318" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />

          {/* Thobe Islamic Mandarin Collar */}
          <path
            d="M 128 108 C 132 116, 148 116, 152 108"
            stroke="#94a3b8"
            strokeWidth="2"
            fill="none"
          />
          {/* Neat Placket with buttons */}
          <circle cx="140" cy="136" r="1.8" fill="#64748b" />
          <circle cx="140" cy="148" r="1.8" fill="#64748b" />
          <circle cx="140" cy="160" r="1.8" fill="#64748b" />

          {/* Right Hand Position (Seamlessly positioned forward to hold weapon) */}
          <circle cx="204" cy="208" r="8" fill="url(#flatSkin)" stroke="#c58e69" strokeWidth="1.2" />

          {/* Left Hand (Subtly resting on waist / holding mantle) */}
          <circle cx="76" cy="208" r="7.5" fill="url(#flatSkin)" stroke="#c58e69" strokeWidth="1.2" />
        </g>

        {/* ================= 3. FEET OVERLAY (MINIMALIST HISTORIC FOOTWEAR) ================= */}
        <g id="feet_layer">
          {feetVisualId === "starter_sandals" ? (
            /* نعل البداية: نعل جلدي خفيف */
            <g>
              <ellipse cx="118" cy="324" rx="12" ry="4.5" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
              <ellipse cx="162" cy="324" rx="12" ry="4.5" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
              <path d="M 112 323 Q 118 318 124 323" stroke="#d97706" strokeWidth="2" fill="none" />
              <path d="M 156 323 Q 162 318 168 323" stroke="#d97706" strokeWidth="2" fill="none" />
            </g>
          ) : feetVisualId === "courier_slippers" ? (
            /* خف الساعي: خف خفيف ومريح */
            <g>
              <path d="M 108 320 Q 118 316 130 326 L 108 326 Z" fill="#92400e" stroke="#78350f" strokeWidth="1.2" />
              <path d="M 172 320 Q 162 316 150 326 L 172 326 Z" fill="#92400e" stroke="#78350f" strokeWidth="1.2" />
            </g>
          ) : feetVisualId === "murabit_boots" ? (
            /* حذاء المرابط: حذاء جلدي متين بأربطة خضراء */
            <g>
              <rect x="108" y="312" width="18" height="15" rx="3" fill="#065f46" stroke="#047857" strokeWidth="1.2" />
              <rect x="154" y="312" width="18" height="15" rx="3" fill="#065f46" stroke="#047857" strokeWidth="1.2" />
              <path d="M 108 317 L 126 317 M 154 317 L 172 317" stroke="#34d399" strokeWidth="1.5" />
            </g>
          ) : feetVisualId === "desert_boots" ? (
            /* خف الصحراء: خف صحراوي رملي */
            <g>
              <path d="M 107 308 L 105 327 L 127 327 L 125 308 Z" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
              <path d="M 173 308 L 175 327 L 153 327 L 155 308 Z" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
            </g>
          ) : feetVisualId === "knight_boots" ? (
            /* حذاء الفرسان: حذاء جلدي مصفح */
            <g>
              <path d="M 106 306 L 104 327 L 127 327 L 125 306 Z" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
              <path d="M 174 306 L 176 327 L 153 327 L 155 306 Z" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
              <circle cx="116" cy="316" r="2.5" fill="#94a3b8" />
              <circle cx="164" cy="316" r="2.5" fill="#94a3b8" />
            </g>
          ) : feetVisualId === "armored_cavalry_boots" ? (
            /* حذاء الخيل المدرع: صفائح فولاذية كاملة */
            <g>
              <path d="M 105 305 L 103 328 L 128 328 L 126 305 Z" fill="url(#flatSteel)" stroke="#334155" strokeWidth="1.5" />
              <path d="M 175 305 L 177 328 L 152 328 L 154 305 Z" fill="url(#flatSteel)" stroke="#334155" strokeWidth="1.5" />
              <path d="M 103 318 L 128 318 M 152 318 L 177 318" stroke="#38bdf8" strokeWidth="1.5" />
            </g>
          ) : feetVisualId === "shoes_of_confidence" ? (
            /* خف الواثق: خف أزرق سماوي مذهب فخم */
            <g filter="url(#auraFilter)">
              <path d="M 105 306 L 103 327 L 128 327 L 126 306 Z" fill="url(#flatCelestial)" stroke="#f59e0b" strokeWidth="1.5" />
              <path d="M 175 306 L 177 327 L 152 327 L 154 306 Z" fill="url(#flatCelestial)" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="116" cy="318" r="2.5" fill="#fef08a" />
              <circle cx="164" cy="318" r="2.5" fill="#fef08a" />
            </g>
          ) : (
            /* Natural Minimal Leather Shoes */
            <g>
              <ellipse cx="118" cy="324" rx="12" ry="4.5" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
              <ellipse cx="162" cy="324" rx="12" ry="4.5" fill="#64748b" stroke="#334155" strokeWidth="1.2" />
            </g>
          )}
        </g>

        {/* ================= 4. BODY ARMOR / CLOAKS (PERFECTLY MAPPED TO SILHOUETTE) ================= */}
        <g id="body_armor_layer">
          {bodyVisualId === "starter_thobe" ? (
            /* ثوب المبتدئ: حزام وساش قماشي أنيق */
            <g>
              <path d="M 98 200 Q 140 206 182 200 L 180 210 Q 140 216 100 210 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2" />
              <circle cx="140" cy="205" r="3" fill="#64748b" />
            </g>
          ) : bodyVisualId === "courier_cloak" ? (
            /* عباءة الساعي: عباءة رملية مع حزام جلدي متقاطع */
            <g>
              {/* Draped mantle over shoulders */}
              <path
                d="M 132 108 C 118 112, 84 122, 74 156 L 68 250 L 92 245 L 96 150 C 110 130, 130 114, 132 108 Z"
                fill="#b45309"
                stroke="#78350f"
                strokeWidth="1.5"
              />
              <path
                d="M 148 108 C 162 112, 196 122, 206 156 L 212 250 L 188 245 L 184 150 C 170 130, 150 114, 148 108 Z"
                fill="#b45309"
                stroke="#78350f"
                strokeWidth="1.5"
              />
              {/* Crossed Leather Straps */}
              <path d="M 88 128 L 192 208" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
              <circle cx="140" cy="168" r="4.5" fill="#d97706" stroke="#451a03" strokeWidth="1.2" />
            </g>
          ) : bodyVisualId === "guard_vest" ? (
            /* سترة الحرس: سترة جلدية مدرعة متناسقة */
            <g>
              <path
                d="M 130 112
                   C 118 115, 88 126, 80 156
                   C 76 174, 82 208, 86 220
                   Q 140 228, 194 220
                   C 198 208, 204 174, 200 156
                   C 192 126, 162 115, 150 112
                   Z"
                fill="url(#flatLeather)"
                stroke="#451a03"
                strokeWidth="1.8"
              />
              <path d="M 106 142 L 174 142 M 104 166 L 176 166 M 106 190 L 174 190" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="140" cy="142" r="2.5" fill="#fef08a" />
              <circle cx="140" cy="166" r="2.5" fill="#fef08a" />
              <circle cx="140" cy="190" r="2.5" fill="#fef08a" />
            </g>
          ) : bodyVisualId === "light_knight_armor" ? (
            /* درع الفرسان الخفيف: صدرية فولاذية مع أكتاف مستديرة مصقولة */
            <g>
              <path
                d="M 130 110
                   C 116 114, 86 124, 78 156
                   C 76 170, 80 205, 84 218
                   Q 140 226, 196 218
                   C 200 205, 204 170, 202 156
                   C 194 124, 164 114, 150 110
                   Z"
                fill="url(#flatSteel)"
                stroke="#334155"
                strokeWidth="2"
              />
              {/* Pauldrons matching shoulder curve */}
              <path d="M 74 156 C 72 136, 88 122, 106 120 Z" fill="url(#flatSteel)" stroke="#38bdf8" strokeWidth="1.2" />
              <path d="M 206 156 C 208 136, 192 122, 174 120 Z" fill="url(#flatSteel)" stroke="#38bdf8" strokeWidth="1.2" />
              {/* Central Knight Medallion */}
              <circle cx="140" cy="160" r="6.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="138.5" cy="158.5" r="2" fill="#ffffff" />
            </g>
          ) : bodyVisualId === "andalus_cloak" ? (
            /* عباءة الأندلس: كسوة كحلية مذهبة تنساب برقي */
            <g>
              <path
                d="M 130 110
                   C 116 114, 84 124, 74 156
                   C 66 182, 70 230, 68 265
                   Q 140 274, 212 265
                   C 210 230, 214 182, 206 156
                   C 196 124, 164 114, 150 110
                   Z"
                fill="url(#flatAndalus)"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              {/* Golden Arabesque Borders */}
              <path d="M 140 114 L 140 270" stroke="#fbbf24" strokeWidth="2.5" />
              <path d="M 98 140 Q 140 155 182 140" stroke="#fbbf24" strokeWidth="1.8" fill="none" />
              <path d="M 94 175 Q 140 190 186 175" stroke="#fbbf24" strokeWidth="1.8" fill="none" />
              {/* Andalusian sash */}
              <rect x="100" y="198" width="80" height="10" rx="3" fill="#b45309" stroke="#fef08a" strokeWidth="1.2" />
              <circle cx="140" cy="203" r="3.5" fill="#f59e0b" />
            </g>
          ) : bodyVisualId === "mamluk_steel_armor" ? (
            /* درع المماليك الفولاذي: درع مع قرص صدري حديدي مهيب */
            <g>
              <path
                d="M 130 110
                   C 116 114, 84 124, 76 156
                   C 72 174, 78 212, 82 225
                   Q 140 232, 198 225
                   C 202 212, 208 174, 204 156
                   C 196 124, 164 114, 150 110
                   Z"
                fill="url(#flatMamluk)"
                stroke="#0f172a"
                strokeWidth="2.2"
              />
              {/* Heavy Rounded Central Roundel */}
              <circle cx="140" cy="168" r="16" fill="url(#flatSteel)" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="140" cy="168" r="9" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.2" />
              <circle cx="140" cy="168" r="3.5" fill="#f59e0b" />
              {/* Pauldron Armor Guards */}
              <path d="M 74 154 C 70 134, 88 120, 106 118 Z" fill="url(#flatSteel)" stroke="#0f172a" strokeWidth="1.5" />
              <path d="M 206 154 C 210 134, 192 120, 174 118 Z" fill="url(#flatSteel)" stroke="#0f172a" strokeWidth="1.5" />
            </g>
          ) : bodyVisualId === "robe_of_honor" ? (
            /* حُلة الكرامة: حُلة سماوية ملكية مذهبة متوهجة */
            <g filter="url(#auraFilter)">
              <path
                d="M 130 110
                   C 114 114, 82 124, 72 156
                   C 64 182, 68 236, 64 275
                   Q 140 286, 216 275
                   C 212 236, 216 182, 208 156
                   C 198 124, 166 114, 150 110
                   Z"
                fill="url(#flatCelestial)"
                stroke="#fbbf24"
                strokeWidth="2.2"
              />
              {/* Celestial Gold Borders */}
              <path d="M 140 114 L 140 280" stroke="#fef08a" strokeWidth="2.5" />
              <path d="M 95 150 Q 140 166 185 150" stroke="#fef08a" strokeWidth="2" fill="none" />
              <path d="M 90 195 Q 140 212 190 195" stroke="#fef08a" strokeWidth="2" fill="none" />
              <rect x="96" y="196" width="88" height="11" rx="3.5" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1.2" />
              <circle cx="140" cy="201.5" r="4" fill="#ffffff" />
            </g>
          ) : null}
        </g>

        {/* ================= 5. WEAPON OVERLAY (MINIMALIST VECTOR MASTERPIECES) ================= */}
        <g id="weapon_layer">
          {weaponVisualId === "traveler_staff" ? (
            /* عصا الترحال: عصا سنديان خشبية برأس كروي مصقول */
            <g>
              <rect x="202" y="60" width="5.5" height="260" rx="2.7" fill="#92400e" stroke="#78350f" strokeWidth="1.2" />
              <circle cx="204.7" cy="62" r="6" fill="#d97706" stroke="#78350f" strokeWidth="1.2" />
              <rect x="201" y="196" width="7.5" height="22" rx="2" fill="#451a03" />
            </g>
          ) : weaponVisualId === "dagger_of_certainty" ? (
            /* خنجر اليقين: خنجر فولاذي منقوش */
            <g>
              <path d="M 204 200 L 222 148 Q 225 144 227 150 L 210 204 Z" fill="url(#flatSteel)" stroke="#334155" strokeWidth="1.5" />
              <rect x="199" y="201" width="14" height="4.5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
              <circle cx="206" cy="203" r="1.5" fill="#ef4444" />
            </g>
          ) : weaponVisualId === "bow_of_insight" ? (
            /* قوس البصيرة: قوس عربي مشدود وأنيق */
            <g>
              <path d="M 194 95 Q 242 175 204 280" stroke="#b45309" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M 194 95 L 204 280" stroke="#f8fafc" strokeWidth="1.2" strokeDasharray="3,1" />
              <circle cx="218" cy="188" r="3.5" fill="#fbbf24" />
            </g>
          ) : weaponVisualId === "sword_of_resolve" ? (
            /* سيف العزيمة: سيف دمشقي مستقيم */
            <g>
              <path d="M 203 198 L 223 58 L 226 44 L 229 58 L 209 198 Z" fill="url(#flatSteel)" stroke="#334155" strokeWidth="1.5" />
              <path d="M 206 194 L 226 58" stroke="#ffffff" strokeWidth="1.2" />
              <rect x="194" y="198" width="24" height="5.5" rx="1.5" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1" />
              <circle cx="206" cy="220" r="3.5" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1" />
            </g>
          ) : weaponVisualId === "spear_of_steadfastness" ? (
            /* رمح الثبات: رمح طويل مع راية خضراء */
            <g>
              <rect x="203" y="38" width="5" height="282" rx="2.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
              <path d="M 201 40 L 205.5 12 L 210 40 Z" fill="url(#flatSteel)" stroke="#0284c7" strokeWidth="1.5" />
              {/* Fluttering Flag */}
              <path d="M 208 38 Q 242 48 234 68 Q 220 64 208 62 Z" fill="#059669" stroke="#10b981" strokeWidth="1" />
            </g>
          ) : weaponVisualId === "blade_of_yarmouk" ? (
            /* نصل اليرموك: نصل منحني مهيب مع تفاصيل ذهبية */
            <g>
              <path
                d="M 204 200 Q 224 135 246 72 Q 243 65 236 71 Q 216 130 209 200 Z"
                fill="url(#flatSteel)"
                stroke="#1e293b"
                strokeWidth="1.8"
              />
              <path d="M 209 168 Q 222 115 234 76" stroke="#f59e0b" strokeWidth="1.2" />
              <rect x="195" y="199" width="22" height="6" rx="1.8" fill="url(#flatGold)" stroke="#451a03" strokeWidth="1" />
              <circle cx="206" cy="202" r="2" fill="#ef4444" />
            </g>
          ) : weaponVisualId === "sword_of_conquest" ? (
            /* سيف الفتح المبين: سيف ملحمي مضيء بالنور السماوي والنجوم */
            <g filter="url(#auraFilter)">
              <path
                d="M 203 198 L 224 45 L 228 30 L 232 45 L 210 198 Z"
                fill="url(#swordGlow)"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <path d="M 206 194 L 228 45" stroke="#ffffff" strokeWidth="2" />
              <rect x="192" y="198" width="28" height="6.5" rx="2" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1" />
              <circle cx="206" cy="201.2" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              <circle cx="206" cy="222" r="4.5" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1" />
              {/* Star Particle Sparkles */}
              <path d="M 228 24 L 229 28 L 233 29 L 229 30 L 228 34 L 227 30 L 223 29 L 227 28 Z" fill="#ffffff" />
            </g>
          ) : null}
        </g>

        {/* ================= 6. HEAD, INTEGRATED THICK BEARD & HAIR (ORGANIC COHESIVE PATH) ================= */}
        <g id="head_and_beard">
          {/* Back Hair Mass (Smooth dome behind head) */}
          <path
            d="M 112 85 C 106 52 116 34 140 34 C 164 34 174 52 168 85 Z"
            fill="url(#flatBeard)"
          />

          {/* Neck base transition */}
          <path d="M 131 100 L 131 112 L 149 112 L 149 100 Z" fill="url(#flatSkin)" />

          {/* 
            Face & Thick Beard (Integrated Natural Bezier Master Path):
            The upper half curves smoothly for the face outline (100% strictly faceless: zero eyes, nose, mouth).
            The lower half curves out and down in a full, rounded, masculine beard flowing gracefully into the chest.
          */}
          <path
            d="M 118 72
               C 114 46, 126 38, 140 38
               C 154 38, 166 46, 162 72
               C 162 82, 164 96, 160 108
               C 156 122, 148 132, 140 132
               C 132 132, 124 122, 120 108
               C 116 96, 118 82, 118 72
               Z"
            fill="url(#flatSkin)"
            stroke="#c58e69"
            strokeWidth="1.5"
          />

          {/* 
            Thick Beard Overlay (Cohesive Path enveloping jawline & chin naturally):
            Starts at the sideburns, curves under cheek contour, and fills the lower jaw/chin generously.
          */}
          <path
            d="M 118 76
               C 126 84, 134 88, 140 88
               C 146 88, 154 84, 162 76
               C 166 94, 164 114, 156 126
               C 148 136, 132 136, 124 126
               C 116 114, 114 94, 118 76
               Z"
            fill="url(#flatBeard)"
          />

          {/* Moustache Contour (Clean masculine frame above beard - NO mouth opening) */}
          <path
            d="M 128 92 C 136 88, 144 88, 152 92 C 145 96, 135 96, 128 92 Z"
            fill="#0f0c09"
          />

          {/* Front hairline (well-groomed neat hairline on forehead) */}
          <path
            d="M 120 60 C 132 50, 148 50, 160 60 C 150 52, 130 52, 120 60 Z"
            fill="url(#flatBeard)"
          />
        </g>

        {/* ================= 7. HEADGEAR OVERLAY (SEAMLESSLY MAPPED TO HEAD) ================= */}
        <g id="headgear_layer">
          {headVisualId === "starter_cap" ? (
            /* طاقية البداية: طاقية قماشية بيضاء مقوسة بإتقان */
            <g>
              <path
                d="M 118 64 C 122 46, 132 40, 140 40 C 148 40, 158 46, 162 64 C 152 60, 128 60, 118 64 Z"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              <path d="M 126 56 Q 140 50 154 56" stroke="#e2e8f0" strokeWidth="1.2" strokeDasharray="2,2" />
            </g>
          ) : headVisualId === "courier_keffiyeh" ? (
            /* كوفية الساعي: كوفية مريحة مع عقال عربي أنيق */
            <g>
              <path
                d="M 114 66 C 120 46, 132 40, 140 40 C 148 40, 160 46, 166 66 L 172 98 L 162 94 L 160 70 Q 140 64 120 70 L 118 94 L 108 98 Z"
                fill="#d97706"
                stroke="#92400e"
                strokeWidth="1.2"
              />
              {/* Sleek Agal */}
              <ellipse cx="140" cy="58" rx="24" ry="5" fill="#1e293b" stroke="#0f172a" strokeWidth="1.8" />
            </g>
          ) : headVisualId === "murabit_turban" ? (
            /* عمامة المرابط: عمامة خضراء مباركة مع ذؤابة منسدلة */
            <g>
              <ellipse cx="140" cy="54" rx="26" ry="16" fill="url(#flatMurabit)" stroke="#064e3b" strokeWidth="1.8" />
              <path d="M 116 58 Q 140 68 164 58 Q 140 50 116 58 Z" fill="#059669" stroke="#34d399" strokeWidth="1.2" />
              {/* Hanging tail */}
              <path d="M 160 60 Q 172 90 166 115" stroke="#059669" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            </g>
          ) : headVisualId === "knight_helmet" ? (
            /* خوذة الفرسان: خوذة حديدية مصقولة بحامية أنف وعين */
            <g>
              <path
                d="M 116 70 C 114 42, 126 34, 140 34 C 154 34, 166 42, 164 70 Z"
                fill="url(#flatSteel)"
                stroke="#334155"
                strokeWidth="1.8"
              />
              <path d="M 116 68 Q 140 72 164 68" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="140" cy="46" r="3" fill="#f59e0b" />
            </g>
          ) : headVisualId === "hijaz_turban" ? (
            /* عمامة الحجاز: عمامة ناصعة البياض بالقصب الذهبي */
            <g>
              <ellipse cx="140" cy="52" rx="27" ry="17" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" />
              <path d="M 116 56 Q 140 66 164 56" stroke="#f59e0b" strokeWidth="2" fill="none" />
              <path d="M 120 48 Q 140 58 160 48" stroke="#f59e0b" strokeWidth="2" fill="none" />
              <circle cx="140" cy="58" r="3.5" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1" />
            </g>
          ) : headVisualId === "ayyubid_helmet" ? (
            /* خوذة الأيوبيين: خوذة مخروطية مذهبة ذات بأس وهيبة */
            <g>
              <path
                d="M 116 68 L 140 24 L 164 68 Q 140 74 116 68 Z"
                fill="url(#flatGold)"
                stroke="#78350f"
                strokeWidth="1.8"
              />
              <circle cx="140" cy="24" r="3" fill="#ef4444" />
              <path d="M 118 66 H 162" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 117 68 L 114 90 L 122 84 Z" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1" />
              <path d="M 163 68 L 166 90 L 158 84 Z" fill="url(#flatGold)" stroke="#78350f" strokeWidth="1" />
            </g>
          ) : headVisualId === "crown_of_dignity" ? (
            /* تاج الوقار: التاج الأعظم المرصع بالياقوت والأنوار المضيئة */
            <g filter="url(#auraFilter)">
              <path
                d="M 118 62 Q 140 68 162 62 L 164 56 Q 140 62 116 56 Z"
                fill="url(#flatGold)"
                stroke="#78350f"
                strokeWidth="1.8"
              />
              <path
                d="M 118 60 L 120 40 L 128 52 L 140 32 L 152 52 L 160 40 L 162 60 Z"
                fill="url(#flatGold)"
                stroke="#78350f"
                strokeWidth="1.5"
              />
              <circle cx="140" cy="34" r="3.8" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
              <circle cx="121" cy="42" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="159" cy="42" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="140" cy="60" r="2.5" fill="#ef4444" />
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  )
}
