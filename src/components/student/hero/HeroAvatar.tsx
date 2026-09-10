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
  equipped = {},
  size = 280,
  className = "",
}: HeroAvatarProps) {
  const headItem = equipped?.head
  const bodyItem = equipped?.body
  const weaponItem = equipped?.weapon
  const feetItem = equipped?.feet

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
        height={Math.round(size * 1.25)}
        viewBox="0 0 240 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.4))" }}
      >
        {/* ================= 1. GROUND SHADOW ================= */}
        <ellipse cx="120" cy="286" rx="64" ry="9" fill="rgba(0, 0, 0, 0.3)" />

        {/* ================= 2. LEGS & FEET (BASE LAYER) ================= */}
        <g id="base_legs">
          {/* Left Leg */}
          <rect x="94" y="240" width="14" height="36" rx="2" fill="#334155" />
          {/* Right Leg */}
          <rect x="132" y="240" width="14" height="36" rx="2" fill="#334155" />

          {/* Base Shoes (Natural Dark Loafers) */}
          {!feetItem && (
            <g id="base_shoes">
              <path d="M 88 274 Q 101 270 114 274 L 114 282 L 88 282 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
              <path d="M 126 274 Q 139 270 152 274 L 152 282 L 126 282 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
            </g>
          )}
        </g>

        {/* ================= 3. FEET OVERLAY (DYNAMIC PAPER-DOLL) ================= */}
        {feetItem && (
          <g id="equipped_feet">
            {feetVisualId === "starter_sandals" ? (
              /* نعل البداية: نعل جلدي خفيف */
              <g>
                <ellipse cx="101" cy="278" rx="13" ry="4.5" fill="#78350f" />
                <ellipse cx="139" cy="278" rx="13" ry="4.5" fill="#78350f" />
                <path d="M 94 276 Q 101 270 108 276" stroke="#d97706" strokeWidth="2" fill="none" />
                <path d="M 132 276 Q 139 270 146 276" stroke="#d97706" strokeWidth="2" fill="none" />
              </g>
            ) : feetVisualId === "courier_slippers" ? (
              /* خف الساعي */
              <g>
                <path d="M 88 272 Q 101 268 114 278 L 88 278 Z" fill="#92400e" />
                <path d="M 126 272 Q 139 268 152 278 L 126 278 Z" fill="#92400e" />
              </g>
            ) : feetVisualId === "murabit_boots" ? (
              /* حذاء المرابط */
              <g>
                <rect x="91" y="260" width="20" height="19" rx="3" fill="#065f46" stroke="#047857" strokeWidth="1" />
                <rect x="129" y="260" width="20" height="19" rx="3" fill="#065f46" stroke="#047857" strokeWidth="1" />
                <line x1="93" y1="266" x2="109" y2="266" stroke="#34d399" strokeWidth="1.5" />
                <line x1="131" y1="266" x2="147" y2="266" stroke="#34d399" strokeWidth="1.5" />
              </g>
            ) : feetVisualId === "desert_boots" ? (
              /* خف الصحراء */
              <g>
                <path d="M 90 256 L 88 279 L 114 279 L 112 256 Z" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                <path d="M 128 256 L 126 279 L 152 279 L 150 256 Z" fill="#d97706" stroke="#b45309" strokeWidth="1" />
              </g>
            ) : feetVisualId === "knight_boots" ? (
              /* حذاء الفرسان */
              <g>
                <path d="M 90 254 L 88 280 L 114 280 L 112 254 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
                <path d="M 128 254 L 126 280 L 152 280 L 150 254 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
                <circle cx="101" cy="266" r="2.5" fill="#94a3b8" />
                <circle cx="139" cy="266" r="2.5" fill="#94a3b8" />
              </g>
            ) : feetVisualId === "armored_cavalry_boots" ? (
              /* حذاء الخيل المدرع */
              <g>
                <path d="M 89 252 L 87 281 L 115 281 L 113 252 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                <path d="M 127 252 L 125 281 L 153 281 L 151 252 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                <line x1="87" y1="266" x2="115" y2="266" stroke="#0284c7" strokeWidth="1.5" />
                <line x1="125" y1="266" x2="153" y2="266" stroke="#0284c7" strokeWidth="1.5" />
              </g>
            ) : feetVisualId === "shoes_of_confidence" ? (
              /* خف الواثق */
              <g>
                <path d="M 89 254 L 87 280 L 115 280 L 113 254 Z" fill="#0284c7" stroke="#f59e0b" strokeWidth="1.5" />
                <path d="M 127 254 L 125 280 L 153 280 L 151 254 Z" fill="#0284c7" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="101" cy="268" r="2.5" fill="#fbbf24" />
                <circle cx="139" cy="268" r="2.5" fill="#fbbf24" />
              </g>
            ) : (
              /* Fallback Feet Visual */
              <g>
                <path d="M 88 272 Q 101 268 114 278 L 88 278 Z" fill="#92400e" />
                <path d="M 126 272 Q 139 268 152 278 L 126 278 Z" fill="#92400e" />
              </g>
            )}
          </g>
        )}

        {/* ================= 4. BASE BODY (CLEAN WHITE ISLAMIC THOBE) ================= */}
        <g id="base_thobe">
          {/* Main Thobe Body (Smooth single piece) */}
          <path
            d="M 112 98
               L 75 112
               C 74 125, 78 180, 68 252
               L 172 252
               C 162 180, 166 125, 165 112
               L 128 98
               Z"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Clean Placket & Button Line */}
          <line x1="120" y1="98" x2="120" y2="165" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx="120" cy="115" r="1.5" fill="#94a3b8" />
          <circle cx="120" cy="130" r="1.5" fill="#94a3b8" />
          <circle cx="120" cy="145" r="1.5" fill="#94a3b8" />

          {/* Left Arm (Resting naturally at side) */}
          <path
            d="M 75 112 L 62 165 C 60 174, 65 180, 72 178 L 82 145 Z"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />
          {/* Left Hand (Simple skin circle) */}
          <circle cx="66" cy="180" r="6.5" fill="#f7d0b5" stroke="#e5b494" strokeWidth="1" />

          {/* Right Arm (Positioned forward ready to hold weapon) */}
          <path
            d="M 165 112 L 176 162 C 178 172, 174 178, 168 176 L 158 145 Z"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />
          {/* Right Hand (Grasping weapon circle) */}
          <circle cx="174" cy="176" r="6.5" fill="#f7d0b5" stroke="#e5b494" strokeWidth="1" />
        </g>

        {/* ================= 5. BODY ARMOR OVERLAY (ON CHEST & SHOULDERS) ================= */}
        {bodyItem && (
          <g id="equipped_body">
            {bodyVisualId === "starter_thobe" ? (
              /* ثوب المبتدئ: وشاح وحزام قماشي */
              <g>
                <rect x="85" y="152" width="70" height="8" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="120" cy="156" r="2.5" fill="#10b981" />
              </g>
            ) : bodyVisualId === "courier_cloak" ? (
              /* عباءة الساعي: عباءة رملية مع حزام جلدي متقاطع */
              <g>
                <path d="M 75 112 L 66 185 L 86 185 L 88 120 Z" fill="#b45309" />
                <path d="M 165 112 L 174 185 L 154 185 L 152 120 Z" fill="#b45309" />
                <line x1="82" y1="120" x2="158" y2="168" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="120" cy="144" r="3.5" fill="#d97706" />
              </g>
            ) : bodyVisualId === "guard_vest" ? (
              /* سترة الحرس: سترة جلدية مدرعة */
              <g>
                <path
                  d="M 112 100 L 76 114 L 80 162 Q 120 168 160 162 L 164 114 L 128 100 Z"
                  fill="#78350f"
                  stroke="#451a03"
                  strokeWidth="1.5"
                />
                <line x1="90" y1="128" x2="150" y2="128" stroke="#f59e0b" strokeWidth="2" />
                <line x1="90" y1="146" x2="150" y2="146" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="120" cy="128" r="2" fill="#fef08a" />
                <circle cx="120" cy="146" r="2" fill="#fef08a" />
              </g>
            ) : bodyVisualId === "light_knight_armor" ? (
              /* درع الفرسان الخفيف: صدرية ودروع كتف فولاذية */
              <g>
                <path
                  d="M 112 100 L 76 114 L 80 160 Q 120 166 160 160 L 164 114 L 128 100 Z"
                  fill="#94a3b8"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                {/* Shoulder Pauldrons */}
                <path d="M 68 126 C 68 112, 80 108, 92 110 Z" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="1" />
                <path d="M 172 126 C 172 112, 160 108, 148 110 Z" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="1" />
                <circle cx="120" cy="132" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
              </g>
            ) : bodyVisualId === "andalus_cloak" ? (
              /* عباءة الأندلس: كسوة كحلية مذهبة */
              <g>
                <path
                  d="M 112 100 L 74 114 L 70 195 Q 120 202 170 195 L 166 114 L 128 100 Z"
                  fill="#1e3a8a"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                <line x1="120" y1="102" x2="120" y2="198" stroke="#fbbf24" strokeWidth="2" />
                <path d="M 88 135 Q 120 148 152 135" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
                <rect x="88" y="155" width="64" height="7" rx="2" fill="#b45309" stroke="#fef08a" strokeWidth="1" />
              </g>
            ) : bodyVisualId === "mamluk_steel_armor" ? (
              /* درع المماليك الفولاذي */
              <g>
                <path
                  d="M 112 100 L 76 114 L 78 165 Q 120 172 162 165 L 164 114 L 128 100 Z"
                  fill="#334155"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                />
                {/* Large Center Gold Rosette */}
                <circle cx="120" cy="136" r="12" fill="#64748b" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="120" cy="136" r="5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
                <circle cx="120" cy="136" r="2" fill="#f59e0b" />
              </g>
            ) : bodyVisualId === "robe_of_honor" ? (
              /* حُلة الكرامة: كسوة سماوية مذهبة */
              <g>
                <path
                  d="M 112 100 L 72 114 L 68 200 Q 120 208 172 200 L 168 114 L 128 100 Z"
                  fill="#0284c7"
                  stroke="#fbbf24"
                  strokeWidth="2"
                />
                <line x1="120" y1="102" x2="120" y2="204" stroke="#fef08a" strokeWidth="2.5" />
                <path d="M 85 140 Q 120 155 155 140" stroke="#fef08a" strokeWidth="1.8" fill="none" />
                <rect x="86" y="158" width="68" height="8" rx="2" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                <circle cx="120" cy="162" r="3" fill="#ffffff" />
              </g>
            ) : (
              /* Fallback Body Vest */
              <g>
                <path
                  d="M 112 100 L 76 114 L 80 162 Q 120 168 160 162 L 164 114 L 128 100 Z"
                  fill="#78350f"
                  stroke="#451a03"
                  strokeWidth="1.5"
                />
                <circle cx="120" cy="132" r="4" fill="#f59e0b" />
              </g>
            )}
          </g>
        )}

        {/* ================= 6. WEAPON OVERLAY (HELD IN RIGHT HAND AT 174, 176) ================= */}
        {weaponItem && (
          <g id="equipped_weapon">
            {weaponVisualId === "traveler_staff" ? (
              /* عصا الترحال: عصا سنديان خشبية تعبر يد الشخصية */
              <g>
                <rect x="171" y="65" width="6" height="215" rx="3" fill="#92400e" stroke="#78350f" strokeWidth="1" />
                <circle cx="174" cy="68" r="6" fill="#d97706" />
                <rect x="170" y="170" width="8" height="15" rx="2" fill="#451a03" />
              </g>
            ) : weaponVisualId === "dagger_of_certainty" ? (
              /* خنجر اليقين */
              <g>
                <path d="M 174 172 L 188 135 Q 190 132 192 136 L 180 176 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                <rect x="170" y="173" width="12" height="4" rx="1" fill="#f59e0b" />
                <circle cx="176" cy="184" r="2.5" fill="#ef4444" />
              </g>
            ) : weaponVisualId === "bow_of_insight" ? (
              /* قوس البصيرة */
              <g>
                <path d="M 162 90 Q 205 176 168 260" stroke="#b45309" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                <line x1="162" y1="90" x2="168" y2="260" stroke="#f8fafc" strokeWidth="1.2" strokeDasharray="3,1" />
                <circle cx="186" cy="175" r="3" fill="#fbbf24" />
              </g>
            ) : weaponVisualId === "sword_of_resolve" ? (
              /* سيف العزيمة: سيف مستقيم في يد الفارس */
              <g>
                <path d="M 172 174 L 188 55 L 191 42 L 194 55 L 178 174 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="1.2" />
                <line x1="175" y1="170" x2="191" y2="55" stroke="#ffffff" strokeWidth="1" />
                <rect x="163" y="173" width="22" height="5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                <circle cx="174" cy="188" r="3" fill="#f59e0b" />
              </g>
            ) : weaponVisualId === "spear_of_steadfastness" ? (
              /* رمح الثبات: رمح طويل مع راية خضراء */
              <g>
                <rect x="172" y="35" width="5" height="245" rx="2.5" fill="#78350f" />
                <path d="M 170 38 L 174.5 12 L 179 38 Z" fill="#cbd5e1" stroke="#0284c7" strokeWidth="1" />
                {/* Green Pennon */}
                <path d="M 177 36 Q 205 45 198 62 Q 186 58 177 56 Z" fill="#059669" stroke="#10b981" strokeWidth="1" />
              </g>
            ) : weaponVisualId === "blade_of_yarmouk" ? (
              /* نصل اليرموك: نصل منحني */
              <g>
                <path
                  d="M 173 174 Q 188 120 208 62 Q 205 56 198 61 Q 182 112 177 174 Z"
                  fill="#cbd5e1"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                <rect x="165" y="173" width="18" height="5" rx="1.5" fill="#f59e0b" />
                <circle cx="174" cy="186" r="2.5" fill="#ef4444" />
              </g>
            ) : weaponVisualId === "sword_of_conquest" ? (
              /* سيف الفتح المبين: سيف أسطوري ملحمي مضيء */
              <g>
                <path
                  d="M 172 174 L 189 45 L 192 32 L 195 45 L 178 174 Z"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                />
                <line x1="175" y1="170" x2="192" y2="45" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="162" y="173" width="24" height="5.5" rx="1.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                <circle cx="174" cy="176" r="2.5" fill="#38bdf8" />
                <circle cx="174" cy="188" r="3.5" fill="#f59e0b" />
                {/* Star glints */}
                <path d="M 192 26 L 193 30 L 197 31 L 193 32 L 192 36 L 191 32 L 187 31 L 191 30 Z" fill="#ffffff" />
              </g>
            ) : (
              /* Fallback Weapon (Sword of Resolve) */
              <g>
                <path d="M 172 174 L 188 55 L 191 42 L 194 55 L 178 174 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="1.2" />
                <line x1="175" y1="170" x2="191" y2="55" stroke="#ffffff" strokeWidth="1" />
                <rect x="163" y="173" width="22" height="5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                <circle cx="174" cy="188" r="3" fill="#f59e0b" />
              </g>
            )}
          </g>
        )}

        {/* ================= 7. HEAD, HAIR & THICK BEARD (FACELESS) ================= */}
        <g id="base_head">
          {/* Neck */}
          <rect x="113" y="85" width="14" height="18" rx="2" fill="#e5b494" />

          {/* Hair (Black crown & temples mass) */}
          <path
            d="M 98 62 C 96 38, 105 32, 120 32 C 135 32, 144 38, 142 62 Z"
            fill="#1a1a1a"
          />

          {/* Head Oval (Smooth warm skin - 100% Faceless, NO eyes, NO nose, NO mouth) */}
          <ellipse cx="120" cy="66" rx="21" ry="25" fill="#f7d0b5" stroke="#e5b494" strokeWidth="1.2" />

          {/* Thick Dignified Black Beard (Covers jawline and chin naturally) */}
          <path
            d="M 100 64
               C 101 84, 108 97, 120 98
               C 132 97, 139 84, 140 64
               C 135 72, 128 75, 120 75
               C 112 75, 105 72, 100 64
               Z"
            fill="#1a1a1a"
          />

          {/* Neat Front Hairline on Forehead */}
          <path
            d="M 102 52 Q 120 44 138 52 Q 129 46 120 46 Q 111 46 102 52 Z"
            fill="#1a1a1a"
          />
        </g>

        {/* ================= 8. HEADGEAR OVERLAY (DYNAMIC PAPER-DOLL) ================= */}
        {headItem && (
          <g id="equipped_head">
            {headVisualId === "starter_cap" ? (
              /* طاقية البداية: طاقية قماشية بيضاء مقوسة */
              <g>
                <path
                  d="M 102 54 C 105 38, 112 34, 120 34 C 128 34, 135 38, 138 54 C 130 50, 110 50, 102 54 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />
                <line x1="108" y1="46" x2="132" y2="46" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
              </g>
            ) : headVisualId === "courier_keffiyeh" ? (
              /* كوفية الساعي: كوفية مع عقال */
              <g>
                <path
                  d="M 98 56 C 104 38, 112 34, 120 34 C 128 34, 136 38, 142 56 L 146 84 L 138 80 L 136 58 Q 120 54 104 58 L 102 80 L 94 84 Z"
                  fill="#d97706"
                  stroke="#92400e"
                  strokeWidth="1"
                />
                {/* Black Agal */}
                <ellipse cx="120" cy="48" rx="21" ry="4.5" fill="#1e293b" />
              </g>
            ) : headVisualId === "murabit_turban" ? (
              /* عمامة المرابط: عمامة خضراء مع ذؤابة منسدلة */
              <g>
                <ellipse cx="120" cy="44" rx="23" ry="14" fill="#059669" stroke="#047857" strokeWidth="1.2" />
                <path d="M 99 48 Q 120 56 141 48 Q 120 42 99 48 Z" fill="#10b981" />
                {/* Hanging tail */}
                <path d="M 138 50 Q 148 75 142 96" stroke="#059669" strokeWidth="5" strokeLinecap="round" fill="none" />
              </g>
            ) : headVisualId === "knight_helmet" ? (
              /* خوذة الفرسان: خوذة حديدية */
              <g>
                <path
                  d="M 100 58 C 98 34, 108 28, 120 28 C 132 28, 142 34, 140 58 Z"
                  fill="#94a3b8"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <line x1="100" y1="56" x2="140" y2="56" stroke="#cbd5e1" strokeWidth="2" />
                <circle cx="120" cy="40" r="2.5" fill="#f59e0b" />
              </g>
            ) : headVisualId === "hijaz_turban" ? (
              /* عمامة الحجاز: عمامة ناصعة بالقصب الذهبي */
              <g>
                <ellipse cx="120" cy="42" rx="24" ry="15" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <path d="M 98 46 Q 120 56 142 46" stroke="#f59e0b" strokeWidth="2" fill="none" />
                <path d="M 102 38 Q 120 48 138 38" stroke="#f59e0b" strokeWidth="2" fill="none" />
                <circle cx="120" cy="48" r="3" fill="#f59e0b" />
              </g>
            ) : headVisualId === "ayyubid_helmet" ? (
              /* خوذة الأيوبيين: خوذة مخروطية مذهبة */
              <g>
                <path
                  d="M 100 58 L 120 20 L 140 58 Q 120 62 100 58 Z"
                  fill="#f59e0b"
                  stroke="#78350f"
                  strokeWidth="1.5"
                />
                <circle cx="120" cy="20" r="3" fill="#ef4444" />
                <line x1="102" y1="56" x2="138" y2="56" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 101 58 L 98 76 L 106 72 Z" fill="#f59e0b" />
                <path d="M 139 58 L 142 76 L 134 72 Z" fill="#f59e0b" />
              </g>
            ) : headVisualId === "crown_of_dignity" ? (
              /* تاج الوقار: تاج ذهبي ملكي مرصع بالجواهر */
              <g>
                <path
                  d="M 102 54 Q 120 58 138 54 L 140 48 Q 120 52 100 48 Z"
                  fill="#fbbf24"
                  stroke="#78350f"
                  strokeWidth="1.2"
                />
                {/* 5 Spires */}
                <path
                  d="M 102 52 L 104 36 L 111 46 L 120 28 L 129 46 L 136 36 L 138 52 Z"
                  fill="#f59e0b"
                  stroke="#78350f"
                  strokeWidth="1.2"
                />
                <circle cx="120" cy="30" r="3.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="104" cy="38" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                <circle cx="136" cy="38" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
              </g>
            ) : (
              /* Fallback Head (Starter Cap) */
              <g>
                <ellipse cx="120" cy="46" rx="19" ry="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="120" cy="35" r="2" fill="#94a3b8" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
