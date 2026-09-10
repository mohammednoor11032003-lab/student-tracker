"use client"
import React, { useState } from "react"
import HeroAvatar from "./HeroAvatar"
import {
  ShopItem,
  StudentInventoryItem,
  GearCategory,
  CATEGORY_LABELS,
  INITIAL_SHOP_CATALOG,
} from "@/lib/hero-utils"
import { Shield, Sparkles, ShoppingBag, Backpack, Check, Plus, Minus, X, RefreshCw, Zap } from "lucide-react"
import toast from "react-hot-toast"

interface HeroViewProps {
  studentId: string
  studentName: string
  initialGems: number
  initialInventory: StudentInventoryItem[]
}

const SLOT_CONFIG: Record<
  GearCategory,
  {
    title: string
    defaultIcon: string
    color: string
    glowRgba: string
    bgGradient: string
  }
> = {
  head: {
    title: "خوذة / عمامة الرأس",
    defaultIcon: "🪖",
    color: "#f59e0b",
    glowRgba: "rgba(245, 158, 11, 0.4)",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)",
  },
  body: {
    title: "درع / رداء الجسم",
    defaultIcon: "🛡️",
    color: "#38bdf8",
    glowRgba: "rgba(56, 189, 248, 0.4)",
    bgGradient: "linear-gradient(135deg, rgba(2, 132, 199, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)",
  },
  weapon: {
    title: "السلاح / الأداة",
    defaultIcon: "⚔️",
    color: "#10b981",
    glowRgba: "rgba(16, 185, 129, 0.4)",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)",
  },
  feet: {
    title: "خف / حذاء القدمين",
    defaultIcon: "🥾",
    color: "#a855f7",
    glowRgba: "rgba(168, 85, 247, 0.4)",
    bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)",
  },
}

export default function HeroView({
  studentId,
  studentName,
  initialGems,
  initialInventory,
}: HeroViewProps) {
  const [gems, setGems] = useState(initialGems)
  const [inventory, setInventory] = useState<StudentInventoryItem[]>(initialInventory)
  const [shopCatalog, setShopCatalog] = useState<ShopItem[]>(INITIAL_SHOP_CATALOG)
  const [activeTab, setActiveTab] = useState<"shop" | "inventory">("shop")
  const [categoryFilter, setCategoryFilter] = useState<GearCategory | "all">("all")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Fetch current shop catalog from API
  React.useEffect(() => {
    fetch("/api/hero")
      .then(res => res.json())
      .then(data => {
        if (data.catalog && Array.isArray(data.catalog) && data.catalog.length > 0) {
          setShopCatalog(data.catalog)
        }
      })
      .catch(() => {})
  }, [])

  // Sync state when props change
  React.useEffect(() => {
    setGems(initialGems)
  }, [initialGems])

  React.useEffect(() => {
    setInventory(initialInventory)
  }, [initialInventory])

  // Listen to custom hero_gems_updated event
  React.useEffect(() => {
    function handleGemsEvent(e: Event) {
      const customEvent = e as CustomEvent<{ gems_balance?: number; added?: number }>
      if (customEvent.detail?.gems_balance !== undefined) {
        setGems(customEvent.detail.gems_balance)
      } else if (customEvent.detail?.added !== undefined) {
        setGems(prev => prev + (customEvent.detail.added || 0))
      }
    }
    window.addEventListener("hero_gems_updated", handleGemsEvent)
    return () => window.removeEventListener("hero_gems_updated", handleGemsEvent)
  }, [])

  // Compute currently equipped items map
  const equippedMap: Record<GearCategory, ShopItem | null> = {
    head: null,
    body: null,
    weapon: null,
    feet: null,
  }

  inventory.forEach(inv => {
    if (inv.is_equipped) {
      const itemObj = inv.item || shopCatalog.find(i => i.id === inv.item_id) || INITIAL_SHOP_CATALOG.find(i => i.id === inv.item_id)
      if (itemObj) {
        equippedMap[itemObj.category] = itemObj
      }
    }
  })

  // Handlers
  async function handleBuyItem(item: ShopItem) {
    if (gems < item.price_in_gems) {
      toast.error(`رصيد الجواهر غير كافٍ! تحتاج إلى ${item.price_in_gems - gems} جوهرة إضافية 💎`)
      return
    }

    setLoadingAction(`buy_${item.id}`)
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buy",
          studentId,
          itemId: item.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to buy item")

      setGems(data.gems_balance)
      setInventory(data.inventory)
      toast.success(`تهانينا! اشتريت "${item.name}" بنجاح! 🛍️✨`)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الشراء")
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleEquipItem(itemId: string, category: GearCategory) {
    setLoadingAction(`equip_${itemId}`)
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "equip",
          studentId,
          itemId,
          category,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to equip item")

      setInventory(data.inventory)
      toast.success("تم تجهيز العتاد بنجاح! ⚔️")
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التجهيز")
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleUnequipItem(itemId: string, category: GearCategory) {
    setLoadingAction(`unequip_${itemId}`)
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unequip",
          studentId,
          itemId,
          category,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to unequip item")

      setInventory(data.inventory)
      toast.success("تم خلع العتاد ↩️")
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء خلع العتاد")
    } finally {
      setLoadingAction(null)
    }
  }

  // Filtered Shop Items
  const filteredShopItems = shopCatalog.filter(
    item => categoryFilter === "all" || item.category === categoryFilter
  )

  // Filtered Inventory Items
  const filteredInventoryItems = inventory.filter(inv => {
    const itemObj = inv.item || shopCatalog.find(i => i.id === inv.item_id) || INITIAL_SHOP_CATALOG.find(i => i.id === inv.item_id)
    return categoryFilter === "all" || itemObj?.category === categoryFilter
  })

  // Count equipped items
  const equippedCount = Object.values(equippedMap).filter(Boolean).length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner & Gems Balance */}
      <div
        style={{
          background: "linear-gradient(135deg, #090d16 0%, #020617 100%)",
          borderRadius: "1.5rem",
          padding: "1.25rem 1.75rem",
          border: "2px solid rgba(245, 158, 11, 0.4)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#ffffff", fontSize: "1.5rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🛡️ بطلي (My Hero)</span>
            <span
              style={{
                fontSize: "0.75rem",
                background: "rgba(245, 158, 11, 0.2)",
                color: "#fbbf24",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                fontWeight: 800,
              }}
            >
              RPG
            </span>
          </h2>
          <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
            جهّز بطل القرآن بخانات العتاد المضيئة باستخدام الجواهر المكتسبة من إتقانك القرآني!
          </p>
        </div>

        {/* Prominent Gems Balance Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            padding: "0.6rem 1.35rem",
            borderRadius: "1.25rem",
            border: "2px solid #38bdf8",
            boxShadow: "0 4px 25px rgba(2, 132, 199, 0.5)",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
          }}
        >
          <span style={{ fontSize: "1.85rem", lineHeight: 1, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}>
            💎
          </span>
          <div>
            <div style={{ fontSize: "0.7rem", color: "#e0f2fe", fontWeight: 700 }}>رصيد الجواهر</div>
            <div style={{ fontSize: "1.45rem", color: "#ffffff", fontWeight: 900, lineHeight: 1 }}>
              {gems}
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Layout: Mobile (flex-col: Hero Silhouette & Slots above Shop), Desktop (lg:flex-row) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* ================= COLUMN 1: DARK SILHOUETTE & 4 GLOWING GEAR SLOTS ================= */}
        <div
          className="w-full lg:w-[480px] shrink-0"
          style={{
            background: "linear-gradient(135deg, #090d16 0%, #020617 100%)",
            borderRadius: "1.5rem",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Header Row */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#cbd5e1", fontWeight: 700 }}>
              فارس القرآن: <strong style={{ color: "#ffffff" }}>{studentName}</strong>
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                background: equippedCount > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)",
                color: equippedCount > 0 ? "#34d399" : "#94a3b8",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                border: equippedCount > 0 ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
                fontWeight: 800,
              }}
            >
              العتاد المجهّز: {equippedCount} / 4
            </span>
          </div>

          {/* Hero Avatar (Full-Body Flat Vector with Equipment Layers) */}
          <div style={{ position: "relative", margin: "0.25rem 0 1.25rem" }}>
            <HeroAvatar equipped={equippedMap} size={250} />
          </div>

          {/* ================= 4 PROMINENT GLOWING GEAR SLOTS ================= */}
          <div style={{ width: "100%" }}>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                fontWeight: 800,
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <Zap size={14} color="#f59e0b" />
              <span>خانات العتاد الأربعة (Equipped Slots)</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {(["head", "body", "weapon", "feet"] as GearCategory[]).map(cat => {
                const item = equippedMap[cat]
                const cfg = SLOT_CONFIG[cat]
                const isEquipped = !!item

                return (
                  <div
                    key={cat}
                    style={{
                      background: isEquipped ? cfg.bgGradient : "rgba(15, 23, 42, 0.6)",
                      border: isEquipped ? `2px solid ${cfg.color}` : "2px dashed rgba(255, 255, 255, 0.15)",
                      borderRadius: "1.25rem",
                      padding: "1rem 0.85rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: "0.5rem",
                      position: "relative",
                      boxShadow: isEquipped ? `0 0 25px ${cfg.glowRgba}, inset 0 0 15px rgba(255,255,255,0.05)` : "none",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {/* Slot Category Header */}
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: isEquipped ? cfg.color : "#64748b",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {cfg.title}
                    </div>

                    {/* Large Glowing Icon Orb */}
                    <div
                      style={{
                        width: "3.75rem",
                        height: "3.75rem",
                        borderRadius: "1rem",
                        background: isEquipped ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.04)",
                        border: isEquipped ? `1px solid ${cfg.color}` : "1px solid rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        filter: isEquipped ? `drop-shadow(0 0 10px ${cfg.glowRgba})` : "none",
                        opacity: isEquipped ? 1 : 0.4,
                      }}
                    >
                      {isEquipped ? item.icon_name : cfg.defaultIcon}
                    </div>

                    {/* Item Name & Details */}
                    <div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 900,
                          color: isEquipped ? "#ffffff" : "#64748b",
                          lineHeight: 1.2,
                        }}
                      >
                        {isEquipped ? item.name : "خانة فارغة"}
                      </div>
                      {isEquipped ? (
                        <div style={{ fontSize: "0.7rem", color: cfg.color, fontWeight: 700, marginTop: "0.2rem" }}>
                          💎 {item.price_in_gems} جوهرة
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: "0.2rem" }}>
                          جهّز من الحقيبة
                        </div>
                      )}
                    </div>

                    {/* Unequip Action Button */}
                    {isEquipped && (
                      <button
                        type="button"
                        onClick={() => handleUnequipItem(item.id, cat)}
                        disabled={loadingAction === `unequip_${item.id}`}
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          color: "#f87171",
                          borderRadius: "0.65rem",
                          padding: "0.35rem 0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.25rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <X size={13} />
                        <span>خلع</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: SHOP & INVENTORY ================= */}
        <div
          className="flex-1 w-full"
          style={{
            background: "linear-gradient(135deg, #090d16 0%, #020617 100%)",
            borderRadius: "1.5rem",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Tabs Switcher: Shop vs Inventory */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              background: "rgba(15, 23, 42, 0.7)",
              padding: "0.35rem",
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("shop")}
              style={{
                padding: "0.65rem 0.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: activeTab === "shop" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                color: activeTab === "shop" ? "white" : "#94a3b8",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                transition: "all 0.2s",
                boxShadow: activeTab === "shop" ? "0 4px 15px rgba(245, 158, 11, 0.35)" : "none",
              }}
            >
              <ShoppingBag size={18} />
              <span>متجر العتاد ({shopCatalog.length}) 🛒</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              style={{
                padding: "0.65rem 0.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: activeTab === "inventory" ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
                color: activeTab === "inventory" ? "white" : "#94a3b8",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                transition: "all 0.2s",
                boxShadow: activeTab === "inventory" ? "0 4px 15px rgba(139, 92, 246, 0.35)" : "none",
              }}
            >
              <Backpack size={18} />
              <span>حقيبتي ({inventory.length}) 🎒</span>
            </button>
          </div>

          {/* Category Filter Pills (Enhanced High Contrast) */}
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "9999px",
                border: categoryFilter === "all" ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.3)",
                background: categoryFilter === "all" ? "#ffffff" : "rgba(255, 255, 255, 0.16)",
                color: categoryFilter === "all" ? "#0f172a" : "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: categoryFilter === "all" ? "0 2px 10px rgba(255,255,255,0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              الكل (28)
            </button>
            {(["head", "body", "weapon", "feet"] as GearCategory[]).map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "9999px",
                  border: categoryFilter === cat ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.3)",
                  background: categoryFilter === cat ? "#ffffff" : "rgba(255, 255, 255, 0.16)",
                  color: categoryFilter === cat ? "#0f172a" : "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  boxShadow: categoryFilter === cat ? "0 2px 10px rgba(255,255,255,0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{CATEGORY_LABELS[cat].icon}</span>
                <span>{CATEGORY_LABELS[cat].name} (7)</span>
              </button>
            ))}
          </div>

          {/* Items List (Vertical Cards with Full-Width Action Buttons) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
              maxHeight: "560px",
              overflowY: "auto",
              paddingRight: "0.35rem",
            }}
          >
            {activeTab === "shop" ? (
              /* SHOP ITEMS */
              filteredShopItems.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>لا توجد عناصر في هذا التصنيف</div>
              ) : (
                filteredShopItems.map(item => {
                  const isOwned = inventory.some(inv => inv.item_id === item.id)
                  const canAfford = gems >= item.price_in_gems

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: "rgba(15, 23, 42, 0.75)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "1.15rem",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Top Row: Icon + Name/Category + Gems Price Tag */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "3rem",
                              height: "3rem",
                              borderRadius: "0.85rem",
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.75rem",
                              flexShrink: 0,
                            }}
                          >
                            {item.icon_name}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "1rem" }}>{item.name}</span>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  background: "rgba(255,255,255,0.12)",
                                  color: "#cbd5e1",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "9999px",
                                  fontWeight: 700,
                                  border: "1px solid rgba(255,255,255,0.15)",
                                }}
                              >
                                {CATEGORY_LABELS[item.category].name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price Tag at Top-Right */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            background: "rgba(2, 132, 199, 0.18)",
                            border: "1px solid rgba(56, 189, 248, 0.4)",
                            color: "#38bdf8",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "0.75rem",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            flexShrink: 0,
                          }}
                        >
                          <span>💎</span>
                          <span>{item.price_in_gems}</span>
                        </div>
                      </div>

                      {/* Description Text */}
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.75rem", lineHeight: 1.45 }}>
                        {item.description}
                      </p>

                      {/* Full-Width Action Button at Bottom of Card */}
                      <div style={{ width: "100%", marginTop: "0.2rem" }}>
                        {isOwned ? (
                          <div
                            style={{
                              width: "100%",
                              textAlign: "center",
                              background: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              padding: "0.55rem 0.85rem",
                              borderRadius: "0.85rem",
                              fontSize: "0.85rem",
                              fontWeight: 800,
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                            }}
                          >
                            مملوك في حقيبتك ✓
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuyItem(item)}
                            disabled={loadingAction === `buy_${item.id}`}
                            style={{
                              width: "100%",
                              background: canAfford
                                ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                                : "rgba(255, 255, 255, 0.08)",
                              color: canAfford ? "#ffffff" : "#64748b",
                              border: canAfford ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                              padding: "0.6rem 1rem",
                              borderRadius: "0.85rem",
                              fontSize: "0.9rem",
                              fontWeight: 900,
                              cursor: canAfford ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.4rem",
                              boxShadow: canAfford ? "0 4px 15px rgba(2, 132, 199, 0.35)" : "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span>شراء مقابل {item.price_in_gems} جوهرة 💎</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )
            ) : (
              /* INVENTORY ITEMS */
              filteredInventoryItems.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 1rem" }}>
                  <Backpack size={42} color="#64748b" style={{ margin: "0 auto 0.65rem" }} />
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "#e2e8f0" }}>حقيبتك فارغة في هذا التصنيف</div>
                  <div style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>تصفح المتجر واشترِ عتاداً تاريخياً جديداً بجواهرك!</div>
                </div>
              ) : (
                filteredInventoryItems.map(inv => {
                  const itemObj = inv.item || shopCatalog.find(i => i.id === inv.item_id) || INITIAL_SHOP_CATALOG.find(i => i.id === inv.item_id)
                  if (!itemObj) return null
                  const isEquipped = inv.is_equipped

                  return (
                    <div
                      key={inv.id}
                      style={{
                        background: isEquipped ? "rgba(139, 92, 246, 0.15)" : "rgba(15, 23, 42, 0.75)",
                        border: isEquipped ? "2px solid #8b5cf6" : "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "1.15rem",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        boxShadow: isEquipped ? "0 4px 18px rgba(139, 92, 246, 0.25)" : "0 4px 15px rgba(0,0,0,0.2)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Top Row: Icon + Name/Category + Equipped Badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "3rem",
                              height: "3rem",
                              borderRadius: "0.85rem",
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.75rem",
                              flexShrink: 0,
                            }}
                          >
                            {itemObj.icon_name}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "1rem" }}>{itemObj.name}</span>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  background: "rgba(255,255,255,0.12)",
                                  color: "#cbd5e1",
                                  padding: "0.15rem 0.5rem",
                                  borderRadius: "9999px",
                                  fontWeight: 700,
                                  border: "1px solid rgba(255,255,255,0.15)",
                                }}
                              >
                                {CATEGORY_LABELS[itemObj.category].name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isEquipped && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              background: "rgba(139, 92, 246, 0.25)",
                              color: "#c4b5fd",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "9999px",
                              border: "1px solid #8b5cf6",
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            مجهّز حالياً ⚔️
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.75rem", lineHeight: 1.45 }}>
                        {itemObj.description}
                      </p>

                      {/* Full-Width Action Button at Bottom */}
                      <div style={{ width: "100%", marginTop: "0.2rem" }}>
                        {isEquipped ? (
                          <button
                            type="button"
                            onClick={() => handleUnequipItem(itemObj.id, itemObj.category)}
                            disabled={loadingAction === `unequip_${itemObj.id}`}
                            style={{
                              width: "100%",
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#f87171",
                              border: "1px solid rgba(239, 68, 68, 0.45)",
                              padding: "0.55rem 1rem",
                              borderRadius: "0.85rem",
                              fontSize: "0.85rem",
                              fontWeight: 800,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            خلع العتاد من الخانة ↩️
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquipItem(itemObj.id, itemObj.category)}
                            disabled={loadingAction === `equip_${itemObj.id}`}
                            style={{
                              width: "100%",
                              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                              color: "#ffffff",
                              border: "1px solid #a78bfa",
                              padding: "0.55rem 1rem",
                              borderRadius: "0.85rem",
                              fontSize: "0.85rem",
                              fontWeight: 900,
                              cursor: "pointer",
                              boxShadow: "0 2px 12px rgba(139,92,246,0.35)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            تجهيز في خانة {CATEGORY_LABELS[itemObj.category].name} ⚔️
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
