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
  size = 280,
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
        height={size}
        viewBox="0 0 260 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 18px 36px rgba(0,0,0,0.45))" }}
      >
        <defs>
          {/* Portrait Shield Clip Path */}
          <clipPath id="avatarClip">
            <circle cx="130" cy="130" r="114" />
          </clipPath>

          {/* Dark Royal Background Gradient */}
          <radialGradient id="portraitBg" cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="60%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Noble Gold Rim Gradient */}
          <linearGradient id="goldRim" x1="40" y1="20" x2="220" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Skin Gradient (Warm, dignified, olive-bronze) */}
          <linearGradient id="skinGrad" x1="130" y1="55" x2="130" y2="125" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e8b997" />
            <stop offset="100%" stopColor="#c8926d" />
          </linearGradient>

          {/* Thick Beard & Hair (Rich dark obsidian) */}
          <linearGradient id="beardGrad" x1="130" y1="50" x2="130" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#29211c" />
            <stop offset="65%" stopColor="#17120e" />
            <stop offset="100%" stopColor="#0a0806" />
          </linearGradient>

          {/* Noble Robe / Thobe Gradient */}
          <linearGradient id="nobleThobe" x1="130" y1="130" x2="130" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Damascus Steel Armor Gradient */}
          <linearGradient id="steelArmor" x1="70" y1="140" x2="190" y2="230" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Andalus Royal Navy Gradient */}
          <linearGradient id="andalusNavy" x1="70" y1="140" x2="190" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="60%" stopColor="#172554" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Celestial Robe Gradient */}
          <linearGradient id="celestialBlue" x1="70" y1="140" x2="190" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Sword Blade Gradient */}
          <linearGradient id="bladeGlow" x1="40" y1="220" x2="220" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="85%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Magic Glow Filter */}
          <filter id="portraitGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================= BACKGROUND MEDALLION ================= */}
        {/* Outer Golden Medallion Ring */}
        <circle cx="130" cy="130" r="124" fill="none" stroke="url(#goldRim)" strokeWidth="3.5" />
        <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Clipped Inside Area */}
        <g clipPath="url(#avatarClip)">
          {/* Dark Obsidian Portrait Fill */}
          <circle cx="130" cy="130" r="116" fill="url(#portraitBg)" />

          {/* Subtle Ambient Radial Ray in Backdrop */}
          <circle cx="130" cy="90" r="90" fill="rgba(56, 189, 248, 0.08)" filter="blur(15px)" />

          {/* ================= 1. HERALDIC WEAPON (DIAGONAL EMBLEM IN BACKGROUND) ================= */}
          {weaponItem && (
            <g id="heraldic_weapon">
              {weaponVisualId === "traveler_staff" ? (
                /* عصا الترحال: عصا سنديان خشبية تعبر الشارة */
                <g>
                  <line x1="45" y1="215" x2="215" y2="45" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />
                  <line x1="45" y1="215" x2="215" y2="45" stroke="#92400e" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="215" cy="45" r="9" fill="#d97706" stroke="#451a03" strokeWidth="2" />
                </g>
              ) : weaponVisualId === "dagger_of_certainty" ? (
                /* خنجر اليقين */
                <g>
                  <line x1="50" y1="210" x2="210" y2="50" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
                  <rect x="180" y="65" width="22" height="6" rx="2" transform="rotate(-45 180 65)" fill="url(#goldRim)" />
                  <circle cx="204" cy="56" r="4" fill="#ef4444" />
                </g>
              ) : weaponVisualId === "bow_of_insight" ? (
                /* قوس البصيرة */
                <g>
                  <path d="M 45 65 Q 15 150 75 220" stroke="#b45309" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <path d="M 45 65 L 75 220" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="4,2" />
                  <circle cx="35" cy="140" r="4" fill="#fbbf24" />
                </g>
              ) : weaponVisualId === "sword_of_resolve" ? (
                /* سيف العزيمة: سيف دمشقي مستقيم يقطع خلفية الشارة بهيبة */
                <g>
                  {/* Blade */}
                  <line x1="45" y1="215" x2="215" y2="45" stroke="#cbd5e1" strokeWidth="7" strokeLinecap="round" />
                  <line x1="45" y1="215" x2="215" y2="45" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  {/* Crossguard */}
                  <rect x="168" y="78" width="28" height="6" rx="2" transform="rotate(-45 168 78)" fill="url(#goldRim)" stroke="#451a03" strokeWidth="1" />
                  {/* Pommel */}
                  <circle cx="50" cy="210" r="5" fill="url(#goldRim)" stroke="#451a03" strokeWidth="1" />
                </g>
              ) : weaponVisualId === "spear_of_steadfastness" ? (
                /* رمح الثبات: رمح مع راية خضراء */
                <g>
                  <line x1="40" y1="220" x2="220" y2="40" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 215 45 L 228 32 L 217 57 Z" fill="url(#steelArmor)" stroke="#0284c7" strokeWidth="1.2" />
                  {/* Green Fluttering Flag */}
                  <path d="M 205 55 Q 225 65 210 85 Q 195 78 190 70 Z" fill="#059669" stroke="#10b981" strokeWidth="1" />
                </g>
              ) : weaponVisualId === "blade_of_yarmouk" ? (
                /* نصل اليرموك: نصل منحني مهيب */
                <g>
                  <path d="M 50 210 Q 150 140 220 40" stroke="#cbd5e1" strokeWidth="8" fill="none" strokeLinecap="round" />
                  <path d="M 50 210 Q 150 140 220 40" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
                  <rect x="65" y="185" width="24" height="6" rx="2" transform="rotate(-40 65 185)" fill="url(#goldRim)" />
                </g>
              ) : weaponVisualId === "sword_of_conquest" ? (
                /* سيف الفتح المبين: سيف ملحمي مضيء بالنور السماوي والنجوم */
                <g filter="url(#portraitGlow)">
                  <line x1="40" y1="220" x2="220" y2="40" stroke="url(#bladeGlow)" strokeWidth="10" strokeLinecap="round" />
                  <line x1="40" y1="220" x2="220" y2="40" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                  <rect x="165" y="80" width="32" height="7" rx="2" transform="rotate(-45 165 80)" fill="url(#goldRim)" stroke="#ffffff" strokeWidth="1" />
                  <circle cx="187" cy="73" r="3.5" fill="#38bdf8" />
                  <circle cx="45" cy="215" r="6" fill="url(#goldRim)" />
                  {/* Star Sparkles */}
                  <path d="M 226 34 L 227 38 L 231 39 L 227 40 L 226 44 L 225 40 L 221 39 L 225 38 Z" fill="#ffffff" />
                </g>
              ) : null}
            </g>
          )}

          {/* ================= 2. BUST / SHOULDERS (CURVED MINIMALIST SILHOUETTE) ================= */}
          <g id="bust_silhouette">
            {/* 
              Clean Noble Portrait Silhouette:
              Curving smoothly from neck base down to broad rounded shoulders, filling the bottom of the medallion.
            */}
            <path
              d="M 112 125
                 C 90 134, 48 155, 36 210
                 C 32 230, 42 245, 60 250
                 Q 130 258, 200 250
                 C 218 245, 228 230, 224 210
                 C 212 155, 170 134, 148 125
                 Z"
              fill="url(#nobleThobe)"
              stroke="#64748b"
              strokeWidth="2"
            />

            {/* Subtle thobe front crease & collar button */}
            <path d="M 130 128 L 130 250" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="130" cy="142" r="2" fill="#64748b" />
            <circle cx="130" cy="156" r="2" fill="#64748b" />
            <circle cx="130" cy="170" r="2" fill="#64748b" />
          </g>

          {/* ================= 3. BODY ARMOR OVERLAY (ON THE BUST) ================= */}
          <g id="bust_armor_overlay">
            {bodyVisualId === "starter_thobe" ? (
              /* ثوب المبتدئ: ياقة مطرزة بوقار */
              <g>
                <path d="M 114 128 Q 130 144 146 128" stroke="#94a3b8" strokeWidth="2.5" fill="none" />
                <circle cx="130" cy="148" r="2.5" fill="#f59e0b" />
              </g>
            ) : bodyVisualId === "courier_cloak" ? (
              /* عباءة الساعي: عباءة رملية على الكتفين وحزام جلدي */
              <g>
                <path d="M 112 126 C 90 135, 48 158, 36 215 L 75 225 L 85 145 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                <path d="M 148 126 C 170 135, 212 158, 224 215 L 185 225 L 175 145 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                <line x1="58" y1="160" x2="202" y2="230" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
                <circle cx="130" cy="195" r="5" fill="#d97706" stroke="#451a03" strokeWidth="1.5" />
              </g>
            ) : bodyVisualId === "guard_vest" ? (
              /* سترة الحرس: سترة جلدية مدرعة بأبازيم */
              <g>
                <path
                  d="M 112 126 C 92 136, 52 158, 44 215 Q 130 228, 216 215 C 208 158, 168 136, 148 126 Z"
                  fill="#78350f"
                  stroke="#451a03"
                  strokeWidth="2"
                />
                <line x1="75" y1="165" x2="185" y2="165" stroke="#f59e0b" strokeWidth="2.5" />
                <line x1="70" y1="190" x2="190" y2="190" stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx="130" cy="165" r="3" fill="#fef08a" />
                <circle cx="130" cy="190" r="3" fill="#fef08a" />
              </g>
            ) : bodyVisualId === "light_knight_armor" ? (
              /* درع الفرسان الخفيف: صدرية فولاذية مصقولة مع دروع كتف */
              <g>
                <path
                  d="M 112 126 C 90 136, 50 156, 42 215 Q 130 226, 218 215 C 210 156, 170 136, 148 126 Z"
                  fill="url(#steelArmor)"
                  stroke="#334155"
                  strokeWidth="2"
                />
                {/* Pauldron shoulder plates */}
                <path d="M 38 210 C 38 175, 75 142, 95 140 Z" fill="url(#steelArmor)" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 222 210 C 222 175, 185 142, 165 140 Z" fill="url(#steelArmor)" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Center Medallion */}
                <circle cx="130" cy="172" r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="1.8" />
                <circle cx="128" cy="170" r="2.5" fill="#ffffff" />
              </g>
            ) : bodyVisualId === "andalus_cloak" ? (
              /* عباءة الأندلس: كسوة كحلية مذهبة بزخارف قرطبية */
              <g>
                <path
                  d="M 112 126 C 88 136, 46 158, 38 220 Q 130 234, 222 220 C 214 158, 172 136, 148 126 Z"
                  fill="url(#andalusNavy)"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
                <path d="M 130 128 L 130 230" stroke="#fbbf24" strokeWidth="2.5" />
                <path d="M 75 165 Q 130 185 185 165" stroke="#fbbf24" strokeWidth="2" fill="none" />
                <path d="M 68 198 Q 130 218 192 198" stroke="#fbbf24" strokeWidth="2" fill="none" />
                <circle cx="130" cy="182" r="4.5" fill="#f59e0b" stroke="#fef08a" strokeWidth="1" />
              </g>
            ) : bodyVisualId === "mamluk_steel_armor" ? (
              /* درع المماليك الفولاذي: درع حديدي مهيب بقرص صدري */
              <g>
                <path
                  d="M 112 126 C 88 136, 48 158, 38 218 Q 130 230, 222 218 C 212 158, 172 136, 148 126 Z"
                  fill="#1e293b"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />
                {/* Large Center Rosette Roundel */}
                <circle cx="130" cy="178" r="19" fill="url(#steelArmor)" stroke="#f59e0b" strokeWidth="2.5" />
                <circle cx="130" cy="178" r="11" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="130" cy="178" r="4.5" fill="#f59e0b" />
                {/* Heavy Pauldrons */}
                <path d="M 38 205 C 40 165, 78 140, 98 138 Z" fill="url(#steelArmor)" stroke="#0f172a" strokeWidth="1.5" />
                <path d="M 222 205 C 220 165, 182 140, 162 138 Z" fill="url(#steelArmor)" stroke="#0f172a" strokeWidth="1.5" />
              </g>
            ) : bodyVisualId === "robe_of_honor" ? (
              /* حُلة الكرامة: حُلة ملكية سماوية مطرزة بالنور والذهب */
              <g filter="url(#portraitGlow)">
                <path
                  d="M 112 126 C 86 136, 44 158, 36 222 Q 130 236, 224 222 C 216 158, 174 136, 148 126 Z"
                  fill="url(#celestialBlue)"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                />
                <path d="M 130 128 L 130 234" stroke="#fef08a" strokeWidth="3" />
                <path d="M 70 170 Q 130 192 190 170" stroke="#fef08a" strokeWidth="2.5" fill="none" />
                <path d="M 64 205 Q 130 226 196 205" stroke="#fef08a" strokeWidth="2.5" fill="none" />
                <circle cx="130" cy="188" r="5" fill="#ffffff" />
              </g>
            ) : null}
          </g>

          {/* ================= 4. HEAD, NECK & INTEGRATED THICK BEARD ================= */}
          <g id="head_and_beard">
            {/* Sturdy Neck */}
            <path d="M 121 106 L 121 130 L 139 130 L 139 106 Z" fill="url(#skinGrad)" />

            {/* Back Hair Mass (Smooth dome behind head) */}
            <path
              d="M 104 90 C 98 56 108 36 130 36 C 152 36 162 56 156 90 Z"
              fill="url(#beardGrad)"
            />

            {/* 
              Harmonious Head Oval (Faceless condition: strictly NO eyes, nose, mouth):
              Smooth, polished noble oval.
            */}
            <ellipse cx="130" cy="88" rx="26" ry="33" fill="url(#skinGrad)" stroke="#c8926d" strokeWidth="1.8" />

            {/* 
              Thick Dignified Beard (لحية كثيفة وقورة تملأ الفك والذقن وتتصل بالرأس):
              Continuous curve starting from ear level, wrapping full jawline and curving generously down.
            */}
            <path
              d="M 104 84
                 C 114 96, 122 102, 130 102
                 C 138 102, 146 96, 156 84
                 C 160 108, 156 130, 146 142
                 C 138 150, 122 150, 114 142
                 C 104 130, 100 108, 104 84
                 Z"
              fill="url(#beardGrad)"
            />

            {/* Full Moustache Contour Frame (NO mouth slit/opening) */}
            <path
              d="M 116 102 C 124 97, 136 97, 144 102 C 137 107, 123 107, 116 102 Z"
              fill="#0a0806"
            />

            {/* Neat Front Hairline on Forehead */}
            <path
              d="M 108 68 C 120 58, 140 58, 152 68 C 142 61, 118 61, 108 68 Z"
              fill="url(#beardGrad)"
            />
          </g>

          {/* ================= 5. HEADGEAR OVERLAY (RESTING NATURALLY ON HEAD) ================= */}
          <g id="headgear_overlay">
            {headVisualId === "starter_cap" ? (
              /* طاقية البداية: طاقية قماشية بيضاء محبوكة تستقر فوق الرأس */
              <g>
                <path
                  d="M 106 72 C 110 50, 120 44, 130 44 C 140 44, 150 50, 154 72 C 144 68, 116 68, 106 72 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.8"
                />
                <path d="M 114 62 Q 130 55 146 62" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3,2" />
              </g>
            ) : headVisualId === "courier_keffiyeh" ? (
              /* كوفية الساعي: كوفية رملية مريحة مع عقال عربي */
              <g>
                <path
                  d="M 102 74 C 108 52, 120 45, 130 45 C 140 45, 152 52, 158 74 L 164 110 L 152 105 L 150 78 Q 130 72 110 78 L 108 105 L 96 110 Z"
                  fill="#d97706"
                  stroke="#92400e"
                  strokeWidth="1.5"
                />
                {/* Black Agal */}
                <ellipse cx="130" cy="65" rx="25" ry="5.5" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              </g>
            ) : headVisualId === "murabit_turban" ? (
              /* عمامة المرابط: عمامة خضراء مباركة مع ذؤابة منسدلة */
              <g>
                <ellipse cx="130" cy="58" rx="27" ry="17" fill="#059669" stroke="#064e3b" strokeWidth="2" />
                <path d="M 105 64 Q 130 74 155 64 Q 130 55 105 64 Z" fill="#10b981" stroke="#34d399" strokeWidth="1.2" />
                {/* Hanging Tail */}
                <path d="M 152 65 Q 165 95 158 125" stroke="#059669" strokeWidth="6" strokeLinecap="round" fill="none" />
              </g>
            ) : headVisualId === "knight_helmet" ? (
              /* خوذة الفرسان: خوذة حديدية مصقولة بحامية أنف */
              <g>
                <path
                  d="M 104 76 C 102 46, 116 38, 130 38 C 144 38, 158 46, 156 76 Z"
                  fill="url(#steelArmor)"
                  stroke="#334155"
                  strokeWidth="2"
                />
                <path d="M 104 74 Q 130 78 156 74" stroke="#94a3b8" strokeWidth="2.5" />
                <circle cx="130" cy="52" r="3.5" fill="#f59e0b" />
              </g>
            ) : headVisualId === "hijaz_turban" ? (
              /* عمامة الحجاز: عمامة ناصعة البياض بالقصب الذهبي */
              <g>
                <ellipse cx="130" cy="56" rx="28" ry="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M 104 60 Q 130 72 156 60" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
                <path d="M 108 50 Q 130 62 152 50" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
                <circle cx="130" cy="62" r="4" fill="url(#goldRim)" stroke="#78350f" strokeWidth="1" />
              </g>
            ) : headVisualId === "ayyubid_helmet" ? (
              /* خوذة الأيوبيين: خوذة مخروطية مذهبة ذات بأس وهيبة */
              <g>
                <path
                  d="M 104 74 L 130 26 L 156 74 Q 130 80 104 74 Z"
                  fill="url(#goldRim)"
                  stroke="#78350f"
                  strokeWidth="2"
                />
                <circle cx="130" cy="26" r="3.5" fill="#ef4444" />
                <path d="M 106 72 H 154" stroke="#ffffff" strokeWidth="1.8" />
                <path d="M 105 74 L 102 98 L 110 92 Z" fill="url(#goldRim)" stroke="#78350f" strokeWidth="1" />
                <path d="M 155 74 L 158 98 L 150 92 Z" fill="url(#goldRim)" stroke="#78350f" strokeWidth="1" />
              </g>
            ) : headVisualId === "crown_of_dignity" ? (
              /* تاج الوقار: التاج الأعظم المرصع بالياقوت والأنوار المضيئة */
              <g filter="url(#portraitGlow)">
                <path
                  d="M 106 68 Q 130 74 154 68 L 156 62 Q 130 68 104 62 Z"
                  fill="url(#goldRim)"
                  stroke="#78350f"
                  strokeWidth="2"
                />
                <path
                  d="M 106 66 L 108 44 L 117 58 L 130 36 L 143 58 L 152 44 L 154 66 Z"
                  fill="url(#goldRim)"
                  stroke="#78350f"
                  strokeWidth="1.8"
                />
                <circle cx="130" cy="38" r="4.2" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
                <circle cx="109" cy="46" r="2.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="151" cy="46" r="2.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="130" cy="66" r="3" fill="#ef4444" />
              </g>
            ) : null}
          </g>
        </g>
      </svg>
    </div>
  )
}
