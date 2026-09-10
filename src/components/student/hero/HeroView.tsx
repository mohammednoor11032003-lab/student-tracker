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
import { Shield, Sparkles, ShoppingBag, Backpack, Check, Plus, Minus, X, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

interface HeroViewProps {
  studentId: string
  studentName: string
  initialGems: number
  initialInventory: StudentInventoryItem[]
}

export default function HeroView({
  studentId,
  studentName,
  initialGems,
  initialInventory,
}: HeroViewProps) {
  const [gems, setGems] = useState(initialGems)
  const [inventory, setInventory] = useState<StudentInventoryItem[]>(initialInventory)
  const [activeTab, setActiveTab] = useState<"shop" | "inventory">("shop")
  const [categoryFilter, setCategoryFilter] = useState<GearCategory | "all">("all")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

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
      const itemObj = inv.item || INITIAL_SHOP_CATALOG.find(i => i.id === inv.item_id)
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
  const filteredShopItems = INITIAL_SHOP_CATALOG.filter(
    item => categoryFilter === "all" || item.category === categoryFilter
  )

  // Filtered Inventory Items
  const filteredInventoryItems = inventory.filter(inv => {
    const itemObj = inv.item || INITIAL_SHOP_CATALOG.find(i => i.id === inv.item_id)
    return categoryFilter === "all" || itemObj?.category === categoryFilter
  })

  // Count equipped items
  const equippedCount = Object.values(equippedMap).filter(Boolean).length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner & Gems Balance */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
          borderRadius: "1.5rem",
          padding: "1.25rem 1.75rem",
          border: "2px solid rgba(245, 158, 11, 0.4)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
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
            جهّز بطلك بأقوى الدروع والأسلحة التاريخية باستخدام الجواهر المكتسبة من إتقانك القرآني!
          </p>
        </div>

        {/* Prominent Gems Balance Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            padding: "0.6rem 1.35rem",
            borderRadius: "1.25rem",
            border: "2px solid #38bdf8",
            boxShadow: "0 4px 20px rgba(2, 132, 199, 0.45)",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
          }}
        >
          <span style={{ fontSize: "1.85rem", lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }}>
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

      {/* Main Responsive Layout: Mobile (flex-col: character above shop), Desktop (lg:flex-row) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* ================= COLUMN 1: CHARACTER & 4 SLOTS ================= */}
        <div
          className="w-full lg:w-[410px] shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
            borderRadius: "1.5rem",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 700 }}>
              فارس القرآن: <strong style={{ color: "#ffffff" }}>{studentName}</strong>
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                background: "rgba(59, 130, 246, 0.2)",
                color: "#60a5fa",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                fontWeight: 800,
              }}
            >
              العتاد: {equippedCount} / 4
            </span>
          </div>

          {/* Avatar Graphic with strict Faceless condition & thick beard */}
          <div style={{ position: "relative", margin: "0.5rem 0" }}>
            <HeroAvatar equipped={equippedMap} size={280} showPedestal={true} />
          </div>

          {/* 4 Gear Slots Grid */}
          <div style={{ width: "100%", marginTop: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: 800, marginBottom: "0.6rem", textAlign: "center" }}>
              خانات العتاد المجهّز (Slots)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              {(["head", "body", "weapon", "feet"] as GearCategory[]).map(cat => {
                const item = equippedMap[cat]
                const catInfo = CATEGORY_LABELS[cat]

                return (
                  <div
                    key={cat}
                    style={{
                      background: item ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.04)",
                      border: item ? "2px solid #f59e0b" : "1.5px dashed rgba(255, 255, 255, 0.2)",
                      borderRadius: "1rem",
                      padding: "0.65rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      boxShadow: item ? "0 4px 12px rgba(245, 158, 11, 0.2)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
                      <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>
                        {item ? item.icon_name : catInfo.icon}
                      </span>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>{catInfo.name}</div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: item ? "#ffffff" : "#64748b",
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item ? item.name : "فارغ"}
                        </div>
                      </div>
                    </div>

                    {item && (
                      <button
                        type="button"
                        onClick={() => handleUnequipItem(item.id, cat)}
                        title="خلع العتاد"
                        style={{
                          background: "rgba(239, 68, 68, 0.2)",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          color: "#f87171",
                          borderRadius: "0.5rem",
                          padding: "0.3rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
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
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
            borderRadius: "1.5rem",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
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
              background: "rgba(15, 23, 42, 0.6)",
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
                boxShadow: activeTab === "shop" ? "0 4px 15px rgba(245, 158, 11, 0.3)" : "none",
              }}
            >
              <ShoppingBag size={18} />
              <span>متجر العتاد ({INITIAL_SHOP_CATALOG.length}) 🛒</span>
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
                boxShadow: activeTab === "inventory" ? "0 4px 15px rgba(139, 92, 246, 0.3)" : "none",
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
                        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
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

                      {/* Description Text (Slightly Smaller & Readable) */}
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
                                : "rgba(255,255,255,0.08)",
                              color: canAfford ? "#ffffff" : "#64748b",
                              border: canAfford ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.15)",
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
                  const itemObj = inv.item || INITIAL_SHOP_CATALOG.find(i => i.id === inv.item_id)
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
                        boxShadow: isEquipped ? "0 4px 18px rgba(139, 92, 246, 0.25)" : "0 4px 15px rgba(0,0,0,0.15)",
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
                            خلع العتاد من الشخصية ↩️
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
                            تجهيز على الشخصية ⚔️
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
