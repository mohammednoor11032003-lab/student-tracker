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
        style={{ filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.45))" }}
      >
        <defs>
          {/* Gradients for Premium Materials */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="80%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="darkIronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          <linearGradient id="royalNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="80%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="baseMeshGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fae0cf" />
            <stop offset="100%" stopColor="#eab598" />
          </linearGradient>

          <linearGradient id="celestialGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>

        {/* ================= 1. GROUND SHADOW ================= */}
        <ellipse cx="120" cy="286" rx="60" ry="9" fill="rgba(0, 0, 0, 0.35)" />

        {/* ================= 2. SLIM BASE MESH BODY (THE BASE BODY FIX) ================= */}
        {/*
          Designed as a sleek, form-fitting athletic dark undersuit (Base Mesh).
          Width is strictly slim (torso width 36px: x=102 to 138).
          When ANY body armor, cloak, or thobe is equipped, it fully encapsulates
          and covers this mesh with ZERO awkward edges or clipping!
        */}
        <g id="base_mesh_body">
          {/* Slim Torso */}
          <path
            d="M 112 96
               L 102 108
               L 104 185
               L 103 205
               L 137 205
               L 136 185
               L 138 108
               L 128 96
               Z"
            fill="url(#baseMeshGrad)"
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Slim Left Leg */}
          <path
            d="M 104 205 L 102 245 L 100 274 L 114 274 L 116 245 L 117 205 Z"
            fill="url(#baseMeshGrad)"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Slim Right Leg */}
          <path
            d="M 123 205 L 124 245 L 126 274 L 140 274 L 138 245 L 136 205 Z"
            fill="url(#baseMeshGrad)"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Athletic Contour lines */}
          <line x1="120" y1="108" x2="120" y2="185" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />

          {/* Slim Left Arm (Natural position) */}
          <path
            d="M 102 108 L 86 160 L 84 172 L 94 172 L 102 140 L 104 120 Z"
            fill="url(#baseMeshGrad)"
            stroke="#334155"
            strokeWidth="1"
          />
          {/* Left Hand (Skin) */}
          <circle cx="89" cy="177" r="6" fill="url(#skinGrad)" stroke="#c28b6d" strokeWidth="1" />

          {/* Slim Right Arm (Ready to hold weapon at 162, 172) */}
          <path
            d="M 138 108 L 154 160 L 156 172 L 146 172 L 138 140 L 136 120 Z"
            fill="url(#baseMeshGrad)"
            stroke="#334155"
            strokeWidth="1"
          />
          {/* Right Hand (Skin, grasping weapon) */}
          <circle cx="151" cy="177" r="6" fill="url(#skinGrad)" stroke="#c28b6d" strokeWidth="1" />
        </g>

        {/* ================= 3. BASE SHOES (IF NO FEET EQUIPPED) ================= */}
        {!feetItem && (
          <g id="default_base_shoes">
            {/* Left Shoe */}
            <path
              d="M 94 274 Q 107 270 118 274 L 118 283 L 94 283 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Right Shoe */}
            <path
              d="M 122 274 Q 133 270 146 274 L 146 283 L 122 283 Z"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1"
            />
          </g>
        )}

        {/* ================= 4. FEET OVERLAY (ELEGANT HISTORICAL FOOTWEAR) ================= */}
        {feetItem && (
          <g id="equipped_feet">
            {feetVisualId === "starter_sandals" ? (
              /* نعل البداية: نعل جلدي عربي مع أربطة */
              <g>
                <ellipse cx="106" cy="279" rx="14" ry="5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <ellipse cx="134" cy="279" rx="14" ry="5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <path d="M 98 276 Q 106 268 114 276" stroke="#d97706" strokeWidth="2.5" fill="none" />
                <path d="M 126 276 Q 134 268 142 276" stroke="#d97706" strokeWidth="2.5" fill="none" />
                <line x1="106" y1="268" x2="106" y2="279" stroke="#b45309" strokeWidth="2" />
                <line x1="134" y1="268" x2="134" y2="279" stroke="#b45309" strokeWidth="2" />
              </g>
            ) : feetVisualId === "courier_slippers" || feetVisualId === "courier_boots" ? (
              /* خف الساعي: خف جلدي خفيف منساب */
              <g>
                <path
                  d="M 94 262 L 96 280 Q 108 283 118 280 L 118 262 Z"
                  fill="#92400e"
                  stroke="#78350f"
                  strokeWidth="1.2"
                />
                <path
                  d="M 122 262 L 122 280 Q 132 283 146 280 L 146 262 Z"
                  fill="#92400e"
                  stroke="#78350f"
                  strokeWidth="1.2"
                />
                <path d="M 94 274 Q 107 268 118 274" stroke="#d97706" strokeWidth="1.5" fill="none" />
                <path d="M 122 274 Q 134 268 146 274" stroke="#d97706" strokeWidth="1.5" fill="none" />
              </g>
            ) : feetVisualId === "murabit_boots" ? (
              /* حذاء المرابط: جزمة متينة من الجلد الزمردي المقوى */
              <g>
                <path
                  d="M 96 250 L 93 281 L 118 281 L 118 250 Z"
                  fill="url(#emeraldGrad)"
                  stroke="#064e3b"
                  strokeWidth="1.2"
                />
                <path
                  d="M 122 250 L 122 281 L 147 281 L 144 250 Z"
                  fill="url(#emeraldGrad)"
                  stroke="#064e3b"
                  strokeWidth="1.2"
                />
                {/* Gold Stitching Straps */}
                <line x1="94" y1="258" x2="117" y2="258" stroke="#34d399" strokeWidth="1.5" />
                <line x1="94" y1="268" x2="117" y2="268" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="123" y1="258" x2="146" y2="258" stroke="#34d399" strokeWidth="1.5" />
                <line x1="123" y1="268" x2="146" y2="268" stroke="#fbbf24" strokeWidth="1.5" />
              </g>
            ) : feetVisualId === "desert_boots" ? (
              /* خف الصحراء: جزمة رملية ذات طية علوية أنيقة */
              <g>
                <path
                  d="M 96 248 L 93 282 L 118 282 L 118 248 Z"
                  fill="#d97706"
                  stroke="#92400e"
                  strokeWidth="1.5"
                />
                <path
                  d="M 122 248 L 122 282 L 147 282 L 144 248 Z"
                  fill="#d97706"
                  stroke="#92400e"
                  strokeWidth="1.5"
                />
                {/* Folded Suede Cuff */}
                <rect x="91" y="246" width="28" height="9" rx="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                <rect x="121" y="246" width="28" height="9" rx="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              </g>
            ) : feetVisualId === "knight_boots" ? (
              /* حذاء الفرسان: حذاء جلدي أسود مصفح مع إبزيم فضي */
              <g>
                <path
                  d="M 96 244 L 92 283 L 119 283 L 118 244 Z"
                  fill="url(#darkIronGrad)"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                <path
                  d="M 122 244 L 121 283 L 148 283 L 144 244 Z"
                  fill="url(#darkIronGrad)"
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                {/* Steel Plates on Shin */}
                <rect x="97" y="250" width="18" height="18" rx="2" fill="url(#steelGrad)" stroke="#475569" strokeWidth="1" />
                <rect x="125" y="250" width="18" height="18" rx="2" fill="url(#steelGrad)" stroke="#475569" strokeWidth="1" />
                <circle cx="106" cy="259" r="2" fill="#f59e0b" />
                <circle cx="134" cy="259" r="2" fill="#f59e0b" />
              </g>
            ) : feetVisualId === "armored_cavalry_boots" ? (
              /* حذاء الخيل المدرع: صفائح فولاذية كاملة للساقين والقدمين */
              <g>
                <path
                  d="M 95 242 L 91 283 L 119 283 L 118 242 Z"
                  fill="url(#steelGrad)"
                  stroke="#334155"
                  strokeWidth="1.8"
                />
                <path
                  d="M 122 242 L 121 283 L 149 283 L 145 242 Z"
                  fill="url(#steelGrad)"
                  stroke="#334155"
                  strokeWidth="1.8"
                />
                {/* Gold Greave Ribs */}
                <line x1="93" y1="252" x2="118" y2="252" stroke="#f59e0b" strokeWidth="2" />
                <line x1="92" y1="264" x2="118" y2="264" stroke="#f59e0b" strokeWidth="2" />
                <line x1="122" y1="252" x2="147" y2="252" stroke="#f59e0b" strokeWidth="2" />
                <line x1="122" y1="264" x2="148" y2="264" stroke="#f59e0b" strokeWidth="2" />
              </g>
            ) : feetVisualId === "shoes_of_confidence" ? (
              /* خف الواثق: خف أزرق ملكي مطرز بالذهب */
              <g>
                <path
                  d="M 96 246 L 91 282 L 119 282 L 118 246 Z"
                  fill="url(#royalNavyGrad)"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
                <path
                  d="M 122 246 L 121 282 L 149 282 L 144 246 Z"
                  fill="url(#royalNavyGrad)"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
                {/* Gold Arabesque embroidery */}
                <circle cx="105" cy="265" r="4" fill="url(#goldGrad)" />
                <circle cx="135" cy="265" r="4" fill="url(#goldGrad)" />
                <path d="M 94 278 L 116 278" stroke="#fef08a" strokeWidth="1.8" />
                <path d="M 124 278 L 146 278" stroke="#fef08a" strokeWidth="1.8" />
              </g>
            ) : (
              /* Default fallback footwear */
              <g>
                <path d="M 94 270 Q 106 266 118 274 L 118 282 L 94 282 Z" fill="#78350f" />
                <path d="M 122 270 Q 134 266 146 274 L 146 282 L 122 282 Z" fill="#78350f" />
              </g>
            )}
          </g>
        )}

        {/* ================= 5. BODY EQUIPMENT OVERLAY (FULL ENCAPSULATION) ================= */}
        {/*
          Every single body piece is tailored to cover the slim base mesh completely,
          flowing seamlessly without leaving any awkward undersuit showing!
        */}
        {bodyItem && (
          <g id="equipped_body">
            {bodyVisualId === "starter_thobe" ? (
              /* ثوب المبتدئ: ثوب أبيض إسلامي ناصع وأنيق مع وشاح أخضر وأزرار لؤلؤية */
              <g>
                {/* Main Flowing Thobe (Full Coverage down to 248) */}
                <path
                  d="M 112 96
                     L 78 112
                     C 76 128, 80 180, 70 250
                     L 170 250
                     C 160 180, 164 128, 162 112
                     L 128 96
                     Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Tailored Sleeves */}
                <path d="M 78 112 L 66 166 C 64 175, 72 178, 82 174 L 92 140 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
                <path d="M 162 112 L 174 166 C 176 175, 168 178, 158 174 L 148 140 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />

                {/* Collar & Pearl Placket */}
                <path d="M 111 96 L 120 102 L 129 96 L 125 106 L 115 106 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="120" y1="102" x2="120" y2="168" stroke="#e2e8f0" strokeWidth="2.5" />
                <circle cx="120" cy="116" r="1.8" fill="#10b981" stroke="#cbd5e1" strokeWidth="0.8" />
                <circle cx="120" cy="132" r="1.8" fill="#10b981" stroke="#cbd5e1" strokeWidth="0.8" />
                <circle cx="120" cy="148" r="1.8" fill="#10b981" stroke="#cbd5e1" strokeWidth="0.8" />

                {/* Green Silk Sash / Belt */}
                <path d="M 84 158 Q 120 165 156 158 L 157 167 Q 120 174 83 167 Z" fill="#059669" stroke="#047857" strokeWidth="1" />
                <circle cx="120" cy="166" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
              </g>
            ) : bodyVisualId === "courier_cloak" ? (
              /* عباءة الساعي: عباءة رملية مع درع كتف جلدي وحزام متقاطع */
              <g>
                {/* Inner Tunic (Full length) */}
                <path
                  d="M 112 96 L 80 112 C 78 128, 80 180, 72 248 L 168 248 C 160 180, 162 128, 160 112 L 128 96 Z"
                  fill="#fef3c7"
                  stroke="#d97706"
                  strokeWidth="1.5"
                />
                {/* Suede Cloak Flaps */}
                <path d="M 80 112 L 68 180 L 88 246 L 102 246 L 94 120 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                <path d="M 160 112 L 172 180 L 152 246 L 138 246 L 146 120 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                {/* Sleeves */}
                <path d="M 80 112 L 68 166 L 84 168 L 94 135 Z" fill="#92400e" />
                <path d="M 160 112 L 172 166 L 156 168 L 146 135 Z" fill="#92400e" />
                {/* Cross-body leather baldric */}
                <line x1="84" y1="116" x2="156" y2="175" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
                <line x1="84" y1="116" x2="156" y2="175" stroke="#d97706" strokeWidth="2" strokeDasharray="3,3" />
                <circle cx="120" cy="146" r="6" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
              </g>
            ) : bodyVisualId === "guard_vest" ? (
              /* سترة الحرس: درع صدري جلدي مقوى فوق رداء قتالي كامل */
              <g>
                {/* Full Sturdy Tunic Base */}
                <path
                  d="M 112 96 L 78 112 C 76 128, 80 180, 72 248 L 168 248 C 160 180, 164 128, 162 112 L 128 96 Z"
                  fill="#334155"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                {/* Sleeves */}
                <path d="M 78 112 L 66 166 L 82 168 L 92 135 Z" fill="#475569" />
                <path d="M 162 112 L 174 166 L 158 168 L 148 135 Z" fill="#475569" />
                {/* Reinforced Leather Cuirass */}
                <path
                  d="M 110 98 L 82 112 L 85 174 Q 120 182 155 174 L 158 112 L 130 98 Z"
                  fill="#78350f"
                  stroke="#451a03"
                  strokeWidth="1.8"
                />
                {/* Heavy Brass Studs and Rivets */}
                <line x1="86" y1="130" x2="154" y2="130" stroke="#b45309" strokeWidth="2.5" />
                <line x1="87" y1="152" x2="153" y2="152" stroke="#b45309" strokeWidth="2.5" />
                <circle cx="120" cy="130" r="3.5" fill="#f59e0b" stroke="#451a03" strokeWidth="1" />
                <circle cx="102" cy="130" r="2.5" fill="#f59e0b" />
                <circle cx="138" cy="130" r="2.5" fill="#f59e0b" />
                <circle cx="120" cy="152" r="3.5" fill="#f59e0b" stroke="#451a03" strokeWidth="1" />
                <circle cx="102" cy="152" r="2.5" fill="#f59e0b" />
                <circle cx="138" cy="152" r="2.5" fill="#f59e0b" />
              </g>
            ) : bodyVisualId === "light_knight_armor" ? (
              /* درع الفرسان الخفيف: درع صدري فولاذي مصقول مع دروع كتف وزردية */
              <g>
                {/* Chainmail Hauberk (Full length to 246) */}
                <path
                  d="M 112 96 L 78 112 C 76 128, 80 180, 72 246 L 168 246 C 160 180, 164 128, 162 112 L 128 96 Z"
                  fill="#64748b"
                  stroke="#334155"
                  strokeWidth="1.5"
                />
                {/* Mail pattern lines */}
                <line x1="80" y1="200" x2="160" y2="200" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,2" />
                <line x1="78" y1="220" x2="162" y2="220" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,2" />

                {/* Steel Sleeves with Vambraces */}
                <path d="M 78 112 L 66 166 L 82 168 L 92 135 Z" fill="#64748b" />
                <rect x="68" y="145" width="14" height="20" rx="2" fill="url(#steelGrad)" stroke="#334155" strokeWidth="1" />
                <path d="M 162 112 L 174 166 L 158 168 L 148 135 Z" fill="#64748b" />
                <rect x="158" y="145" width="14" height="20" rx="2" fill="url(#steelGrad)" stroke="#334155" strokeWidth="1" />

                {/* Polished Steel Breastplate */}
                <path
                  d="M 110 98 L 84 114 L 88 172 Q 120 180 152 172 L 156 114 L 130 98 Z"
                  fill="url(#steelGrad)"
                  stroke="#334155"
                  strokeWidth="1.8"
                />
                {/* Curved Bevel Lines */}
                <path d="M 120 102 L 120 178" stroke="#ffffff" strokeWidth="1.8" />
                <path d="M 94 135 Q 120 150 146 135" stroke="#ffffff" strokeWidth="1.2" fill="none" />

                {/* Tiered Pauldrons (Shoulder Guards) */}
                <path d="M 68 116 C 66 102, 82 98, 96 106 L 90 128 Z" fill="url(#steelGrad)" stroke="#0284c7" strokeWidth="1.2" />
                <path d="M 172 116 C 174 102, 158 98, 144 106 L 150 128 Z" fill="url(#steelGrad)" stroke="#0284c7" strokeWidth="1.2" />

                {/* Center Knight Emblem (Blue Sapphire with Gold Ring) */}
                <circle cx="120" cy="138" r="7.5" fill="#0284c7" stroke="#fbbf24" strokeWidth="2" />
                <circle cx="120" cy="138" r="3" fill="#ffffff" />
              </g>
            ) : bodyVisualId === "andalus_cloak" ? (
              /* عباءة الأندلس: كسوة قرطبية كحلية مذهبة مطرزة بالزخارف الأندلسية */
              <g>
                {/* Full Rich Indigo Robe */}
                <path
                  d="M 112 96 L 76 112 C 74 128, 78 180, 68 250 L 172 250 C 162 180, 166 128, 164 112 L 128 96 Z"
                  fill="url(#royalNavyGrad)"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Flowing Sleeves */}
                <path d="M 76 112 L 64 168 L 80 172 L 90 138 Z" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="1.2" />
                <path d="M 164 112 L 176 168 L 160 172 L 150 138 Z" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="1.2" />

                {/* Golden Cordoba Braiding Down Center */}
                <line x1="120" y1="98" x2="120" y2="250" stroke="url(#goldGrad)" strokeWidth="4" />
                <path d="M 88 135 Q 120 152 152 135" stroke="#fef08a" strokeWidth="2" fill="none" />
                <path d="M 82 170 Q 120 188 158 170" stroke="#fef08a" strokeWidth="2" fill="none" />

                {/* Royal Brocade Waistband */}
                <rect x="80" y="152" width="80" height="12" rx="3" fill="#b45309" stroke="#fbbf24" strokeWidth="1.5" />
                <circle cx="120" cy="158" r="5" fill="#fef08a" stroke="#78350f" strokeWidth="1" />
              </g>
            ) : bodyVisualId === "mamluk_steel_armor" ? (
              /* درع المماليك الفولاذي: درع الجوشن الثقيل مع صفيحة المرآة الشمسية والزرادية */
              <g>
                {/* Chainmail Hauberk Base down to 248 */}
                <path
                  d="M 112 96 L 76 112 C 74 128, 78 180, 70 248 L 170 248 C 162 180, 166 128, 164 112 L 128 96 Z"
                  fill="#334155"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
                {/* Mail texture */}
                <line x1="76" y1="205" x2="164" y2="205" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3,2" />
                <line x1="74" y1="225" x2="166" y2="225" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3,2" />

                {/* Sleeves with Steel Vambraces */}
                <path d="M 76 112 L 64 168 L 80 172 L 90 138 Z" fill="#334155" />
                <rect x="66" y="142" width="16" height="24" rx="2" fill="url(#darkIronGrad)" stroke="#fbbf24" strokeWidth="1.5" />
                <path d="M 164 112 L 176 168 L 160 172 L 150 138 Z" fill="#334155" />
                <rect x="158" y="142" width="16" height="24" rx="2" fill="url(#darkIronGrad)" stroke="#fbbf24" strokeWidth="1.5" />

                {/* Heavy Plated Cuirass with Tassets */}
                <path
                  d="M 108 98 L 80 114 L 84 182 Q 120 192 156 182 L 160 114 L 132 98 Z"
                  fill="url(#darkIronGrad)"
                  stroke="#475569"
                  strokeWidth="2"
                />
                {/* Large Gilded Chahar-Ayna Mirror Disc (شمسة الدروع) */}
                <circle cx="120" cy="144" r="16" fill="url(#steelGrad)" stroke="#f59e0b" strokeWidth="3" />
                <circle cx="120" cy="144" r="11" fill="url(#darkIronGrad)" stroke="#fef08a" strokeWidth="1" />
                <circle cx="120" cy="144" r="4.5" fill="#f59e0b" />

                {/* Thigh Tassets (صفائح الفخذين) */}
                <rect x="86" y="185" width="20" height="22" rx="2" fill="url(#darkIronGrad)" stroke="#f59e0b" strokeWidth="1.5" />
                <rect x="134" y="185" width="20" height="22" rx="2" fill="url(#darkIronGrad)" stroke="#f59e0b" strokeWidth="1.5" />
              </g>
            ) : bodyVisualId === "robe_of_honor" ? (
              /* حُلة الكرامة: حُلة ملكية سماوية ذهبية كاملة مطرزة بخيوط النور */
              <g>
                {/* Flowing Celestial Silk Gown (Full length 250) */}
                <path
                  d="M 112 96 L 74 112 C 72 128, 76 180, 66 250 L 174 250 C 164 180, 168 128, 166 112 L 128 96 Z"
                  fill="url(#celestialGlow)"
                  stroke="#fef08a"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* Regal Bell Sleeves */}
                <path d="M 74 112 L 60 172 L 78 178 L 90 138 Z" fill="#0284c7" stroke="#fbbf24" strokeWidth="1.5" />
                <path d="M 166 112 L 180 172 L 162 178 L 150 138 Z" fill="#0284c7" stroke="#fbbf24" strokeWidth="1.5" />

                {/* Radiant Golden Tree / Arabesque Pattern */}
                <line x1="120" y1="98" x2="120" y2="250" stroke="url(#goldGrad)" strokeWidth="4.5" />
                <path d="M 80 142 Q 120 162 160 142" stroke="#fef08a" strokeWidth="2.5" fill="none" />
                <path d="M 74 184 Q 120 206 166 184" stroke="#fef08a" strokeWidth="2.5" fill="none" />

                {/* Golden Sun Clasp at Breast */}
                <circle cx="120" cy="120" r="8" fill="url(#goldGrad)" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="120" cy="120" r="3.5" fill="#ef4444" />
                <circle cx="120" cy="160" r="5" fill="#ffffff" stroke="#fbbf24" strokeWidth="1.5" />
              </g>
            ) : (
              /* Fallback Body Guard */
              <g>
                <path
                  d="M 112 96 L 78 112 C 76 128, 80 180, 72 248 L 168 248 C 160 180, 164 128, 162 112 L 128 96 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </g>
        )}

        {/* ================= 6. WEAPON OVERLAY (HELD IN RIGHT HAND AT 151, 177) ================= */}
        {weaponItem && (
          <g id="equipped_weapon">
            {weaponVisualId === "traveler_staff" ? (
              /* عصا الترحال: عصا سنديان خشبية متينة */
              <g>
                <rect x="156" y="55" width="6" height="230" rx="3" fill="#92400e" stroke="#78350f" strokeWidth="1" />
                <circle cx="159" cy="58" r="7" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
                <rect x="154" y="170" width="10" height="15" rx="2" fill="#451a03" />
              </g>
            ) : weaponVisualId === "dagger_of_certainty" ? (
              /* خنجر اليقين: جنبية يمانية فولاذية مقوسة مع غمد مذهب */
              <g>
                <path d="M 152 174 Q 170 148 182 120 Q 186 116 182 124 Q 164 162 152 182 Z" fill="url(#steelGrad)" stroke="#475569" strokeWidth="1.2" />
                <rect x="146" y="174" width="16" height="5" rx="1.5" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
                <circle cx="150" cy="186" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
              </g>
            ) : weaponVisualId === "bow_of_insight" ? (
              /* قوس البصيرة: قوس عربي مركب أصيل مع وتر حريري */
              <g>
                <path d="M 145 75 Q 198 165 148 255" stroke="#b45309" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M 145 75 Q 192 165 148 255" stroke="url(#goldGrad)" strokeWidth="2" fill="none" />
                <line x1="145" y1="75" x2="148" y2="255" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,1" />
                <circle cx="178" cy="165" r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
              </g>
            ) : weaponVisualId === "sword_of_resolve" ? (
              /* سيف العزيمة: سيف عربي مستقيم مصقول من الفولاذ الدمشقي */
              <g>
                <path d="M 150 172 L 168 45 L 171 30 L 174 45 L 156 172 Z" fill="url(#steelGrad)" stroke="#334155" strokeWidth="1.5" />
                <line x1="153" y1="168" x2="171" y2="45" stroke="#ffffff" strokeWidth="1.5" />
                {/* Crossguard & Pommel */}
                <rect x="140" y="172" width="24" height="6" rx="2" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1.2" />
                <circle cx="151" cy="190" r="4" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
              </g>
            ) : weaponVisualId === "spear_of_steadfastness" ? (
              /* رمح الثبات: رمح طويل مع سنان فولاذي وراية خضراء ترفرف */
              <g>
                <rect x="156" y="25" width="5.5" height="258" rx="2.5" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <path d="M 154 28 L 158.5 4 L 163 28 Z" fill="url(#steelGrad)" stroke="#0284c7" strokeWidth="1.2" />
                {/* Green Silk Pennon with Golden Border */}
                <path d="M 161 26 Q 196 35 188 56 Q 174 52 161 50 Z" fill="url(#emeraldGrad)" stroke="#fbbf24" strokeWidth="1.2" />
              </g>
            ) : weaponVisualId === "blade_of_yarmouk" ? (
              /* نصل اليرموك: سيف عربي منحني (شامشير) قاطع ومهيب */
              <g>
                <path
                  d="M 151 172 Q 170 120 196 52 Q 192 46 184 52 Q 162 110 155 172 Z"
                  fill="url(#steelGrad)"
                  stroke="#1e293b"
                  strokeWidth="1.8"
                />
                <line x1="153" y1="165" x2="182" y2="60" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="142" y="172" width="22" height="6" rx="2" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1.2" />
                <circle cx="152" cy="189" r="3.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />
              </g>
            ) : weaponVisualId === "sword_of_conquest" ? (
              /* سيف الفتح المبين: سيف أسطوري ملحمي يشع بنور سماوي متوهج */
              <g>
                {/* Blue Aura / Glow */}
                <path
                  d="M 149 174 L 170 38 L 173 22 L 176 38 L 157 174 Z"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <path
                  d="M 150 172 L 170 38 L 173 22 L 176 38 L 156 172 Z"
                  fill="url(#royalNavyGrad)"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                />
                <line x1="153" y1="168" x2="173" y2="38" stroke="#ffffff" strokeWidth="2" />

                {/* Golden Masterpiece Hilt */}
                <rect x="138" y="172" width="28" height="7" rx="2.5" fill="url(#goldGrad)" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="152" cy="175" r="3" fill="#38bdf8" />
                <circle cx="152" cy="192" r="4.5" fill="url(#goldGrad)" stroke="#ffffff" strokeWidth="1.2" />

                {/* Star Glints */}
                <path d="M 173 16 L 174.5 21 L 179 22.5 L 174.5 24 L 173 29 L 171.5 24 L 167 22.5 L 171.5 21 Z" fill="#ffffff" />
              </g>
            ) : (
              /* Fallback Weapon */
              <g>
                <path d="M 150 172 L 168 45 L 171 30 L 174 45 L 156 172 Z" fill="url(#steelGrad)" stroke="#334155" strokeWidth="1.5" />
                <rect x="140" y="172" width="24" height="6" rx="2" fill="url(#goldGrad)" />
              </g>
            )}
          </g>
        )}

        {/* ================= 7. HEAD, HAIR & DIGNIFIED BEARD (THE ANCHOR FOUNDATION) ================= */}
        {/*
          Anchor coordinates:
          Head center: cx = 120, cy = 66
          Head radius: rx = 21, ry = 25 (x: 99 to 141, y: 41 to 91)
          Neck: x = 112 to 128, y = 84 to 98
          Forehead brow line: y = 54
          100% Face-less rule strictly maintained (NO eyes, NO nose, NO mouth).
        */}
        <g id="base_head">
          {/* Neck */}
          <rect x="112" y="84" width="16" height="18" rx="2" fill="url(#skinGrad)" stroke="#c28b6d" strokeWidth="1" />

          {/* Hair Crown and Temple Mass (Deep Black) */}
          <path
            d="M 97 66 C 95 38, 105 32, 120 32 C 135 32, 145 38, 143 66 Z"
            fill="#171717"
          />

          {/* Head Oval (Smooth Warm Skin - Faceless) */}
          <ellipse cx="120" cy="66" rx="21" ry="25" fill="url(#skinGrad)" stroke="#c28b6d" strokeWidth="1.2" />

          {/* Thick Dignified Black Beard (Naturally sculpted jawline and chin) */}
          <path
            d="M 99 64
               C 100 85, 107 97, 120 98
               C 133 97, 140 85, 141 64
               C 136 73, 128 76, 120 76
               C 112 76, 104 73, 99 64
               Z"
            fill="#171717"
          />

          {/* Natural Hairline on Forehead */}
          <path
            d="M 100 52 Q 120 44 140 52 Q 130 46 120 46 Q 110 46 100 52 Z"
            fill="#171717"
          />
        </g>

        {/* ================= 8. HEADGEAR OVERLAY (PERFECT ANCHOR ALIGNMENT) ================= */}
        {/*
          Every headpiece is perfectly anchored at cx = 120.
          Brim width spans x = 95 to x = 145 (width 50px) to wrap around the 42px head snugly.
          Lower edge rests accurately on the brow at y = 52-56 without floating!
        */}
        {headItem && (
          <g id="equipped_head">
            {headVisualId === "starter_cap" ? (
              /* طاقية البداية: طاقية قماشية إسلامية بيضاء محكمة مطرزة بغرز ناعمة */
              <g>
                <path
                  d="M 97 54 C 99 35, 108 30, 120 30 C 132 30, 141 35, 143 54 C 134 50, 106 50, 97 54 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                {/* Embroidered Islamic Geometrics on Cap */}
                <line x1="102" y1="46" x2="138" y2="46" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,2" />
                <line x1="106" y1="40" x2="134" y2="40" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,2" />
                <circle cx="120" cy="30" r="2" fill="#10b981" />
              </g>
            ) : headVisualId === "courier_keffiyeh" ? (
              /* كوفية الساعي: كوفية محكمة مع عقال أسود ملكي مزدوج وشرابات */
              <g>
                {/* Draped Keffiyeh Fabric covering skull and sides */}
                <path
                  d="M 94 56 C 98 34, 108 28, 120 28 C 132 28, 142 34, 146 56 L 150 92 L 140 88 L 138 60 Q 120 54 102 60 L 100 88 L 90 92 Z"
                  fill="#d97706"
                  stroke="#92400e"
                  strokeWidth="1.5"
                />
                {/* Pattern checks on fabric */}
                <line x1="100" y1="42" x2="140" y2="42" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="98" y1="48" x2="142" y2="48" stroke="#fef3c7" strokeWidth="1" strokeDasharray="2,2" />

                {/* Double Black Agal (عقال أسود مزدوج مع لمعان ذهبي) */}
                <ellipse cx="120" cy="46" rx="23.5" ry="5.5" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
                <ellipse cx="120" cy="49" rx="23.5" ry="5.5" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
                <line x1="112" y1="46" x2="128" y2="46" stroke="#fbbf24" strokeWidth="1.2" />
              </g>
            ) : headVisualId === "murabit_turban" ? (
              /* عمامة المرابط: عمامة خضراء فاخرة بثنيات قماش متعددة وذؤابة منسدلة */
              <g>
                {/* Base Turban Mass */}
                <ellipse cx="120" cy="44" rx="25" ry="16" fill="url(#emeraldGrad)" stroke="#064e3b" strokeWidth="1.5" />

                {/* Rich Fabric Folds (<path> folds) */}
                <path d="M 96 48 Q 120 58 144 48 Q 120 40 96 48 Z" fill="#059669" stroke="#047857" strokeWidth="1" />
                <path d="M 98 40 Q 120 50 142 40 Q 120 32 98 40 Z" fill="#34d399" opacity="0.85" />
                <path d="M 104 34 Q 120 42 136 34" stroke="#064e3b" strokeWidth="1.5" fill="none" />

                {/* Gold Brooch at Center */}
                <circle cx="120" cy="48" r="3.5" fill="url(#goldGrad)" stroke="#064e3b" strokeWidth="1" />
                <circle cx="120" cy="48" r="1.5" fill="#ef4444" />

                {/* Flowing Silk Tail (الذؤابة) */}
                <path
                  d="M 142 48 Q 152 75 145 98 C 143 104, 140 102, 139 96 Q 146 75 138 52 Z"
                  fill="#059669"
                  stroke="#047857"
                  strokeWidth="1.2"
                />
              </g>
            ) : headVisualId === "knight_helmet" ? (
              /* خوذة الفرسان: خوذة حديدية مصقولة مع واقي الأنف وحافة ذهبية */
              <g>
                {/* Helmet Dome */}
                <path
                  d="M 96 56 C 94 30, 106 24, 120 24 C 134 24, 146 30, 144 56 Z"
                  fill="url(#steelGrad)"
                  stroke="#334155"
                  strokeWidth="2"
                />
                {/* Brow Plate Band */}
                <path d="M 95 54 Q 120 58 145 54 L 145 59 Q 120 63 95 59 Z" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />

                {/* Nasal Guard (واقي الأنف) */}
                <path d="M 118 54 L 118 74 L 120 77 L 122 74 L 122 54 Z" fill="url(#steelGrad)" stroke="#334155" strokeWidth="1.2" />

                {/* Rivets and Crest */}
                <circle cx="120" cy="38" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
                <circle cx="106" cy="46" r="2" fill="#cbd5e1" />
                <circle cx="134" cy="46" r="2" fill="#cbd5e1" />
              </g>
            ) : headVisualId === "hijaz_turban" ? (
              /* عمامة الحجاز: عمامة بيضاء وقورة مطرزة بالقصب الذهبي لصفوة الحفاظ */
              <g>
                {/* Turban Dome */}
                <ellipse cx="120" cy="42" rx="26" ry="17" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" />

                {/* Overlapping Gold Embroidered Cloth Swaths */}
                <path d="M 95 46 Q 120 58 145 46 Q 120 38 95 46 Z" fill="#f8fafc" stroke="#f59e0b" strokeWidth="1.5" />
                <path d="M 98 38 Q 120 48 142 38" stroke="url(#goldGrad)" strokeWidth="2.5" fill="none" />
                <path d="M 104 30 Q 120 38 136 30" stroke="url(#goldGrad)" strokeWidth="2" fill="none" />

                {/* Golden Medallion on Crown */}
                <circle cx="120" cy="48" r="4.5" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
                <circle cx="120" cy="48" r="2" fill="#ffffff" />
              </g>
            ) : headVisualId === "ayyubid_helmet" ? (
              /* خوذة الأيوبيين: خوذة مخروطية مذهبة مع سنان علوي وحماية خدود */
              <g>
                {/* Conical Fluted Dome */}
                <path
                  d="M 96 56 L 120 14 L 144 56 Q 120 60 96 56 Z"
                  fill="url(#goldGrad)"
                  stroke="#78350f"
                  strokeWidth="2"
                />
                {/* Center Ridge */}
                <line x1="120" y1="14" x2="120" y2="58" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="108" y1="36" x2="132" y2="36" stroke="#78350f" strokeWidth="1.5" strokeDasharray="3,1" />

                {/* Top Point Spike & Ruby */}
                <circle cx="120" cy="14" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />

                {/* Gilded Brow Band */}
                <rect x="95" y="52" width="50" height="6" rx="1.5" fill="url(#steelGrad)" stroke="#78350f" strokeWidth="1" />

                {/* Hinged Cheek Guards */}
                <path d="M 96 56 L 94 76 L 104 70 Z" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
                <path d="M 144 56 L 146 76 L 136 70 Z" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1" />
              </g>
            ) : headVisualId === "crown_of_dignity" ? (
              /* تاج الوقار: تاج ذهبي ملكي مرصع بالياقوت والزمرد يشع بأنوار إيمانية */
              <g>
                {/* Divine Halo Glow */}
                <ellipse cx="120" cy="44" rx="30" ry="20" fill="url(#goldGrad)" opacity="0.25" />

                {/* Main Crown Base */}
                <path d="M 95 54 Q 120 59 145 54 L 146 48 Q 120 53 94 48 Z" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1.5" />

                {/* 7 Majestic Spires */}
                <path
                  d="M 95 50
                     L 98 34 L 104 44
                     L 110 28 L 115 42
                     L 120 18
                     L 125 42 L 130 28
                     L 136 44 L 142 34
                     L 145 50
                     Z"
                  fill="url(#goldGrad)"
                  stroke="#78350f"
                  strokeWidth="1.5"
                />

                {/* Precious Jewels */}
                <circle cx="120" cy="22" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                <circle cx="110" cy="30" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="130" cy="30" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                <circle cx="98" cy="36" r="2" fill="#10b981" />
                <circle cx="142" cy="36" r="2" fill="#10b981" />

                {/* Crown Base Gems */}
                <circle cx="120" cy="52" r="2.5" fill="#ffffff" stroke="#78350f" strokeWidth="0.8" />
                <circle cx="108" cy="51" r="2" fill="#ef4444" />
                <circle cx="132" cy="51" r="2" fill="#ef4444" />
              </g>
            ) : (
              /* Fallback Cap */
              <g>
                <ellipse cx="120" cy="46" rx="23" ry="13" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="120" cy="36" r="2" fill="#94a3b8" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
