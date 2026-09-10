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
            جهّز بطلك بأقوى الدروع والأسلحة باستخدام الجواهر المكتسبة من إتقانك القرآني!
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

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* ================= COLUMN 1: CHARACTER & 4 SLOTS ================= */}
        <div
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

          {/* Avatar Graphic with strict Faceless condition */}
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
                          color: "#f87171",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          borderRadius: "0.5rem",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        ✕
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
          style={{
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
            borderRadius: "1.5rem",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Shop vs Inventory Sub-tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              background: "rgba(0,0,0,0.25)",
              padding: "0.35rem",
              borderRadius: "1rem",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("shop")}
              style={{
                padding: "0.6rem 0.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: activeTab === "shop" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "transparent",
                color: activeTab === "shop" ? "white" : "#94a3b8",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                transition: "all 0.2s",
              }}
            >
              <ShoppingBag size={18} />
              <span>متجر العتاد 🛒</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              style={{
                padding: "0.6rem 0.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: activeTab === "inventory" ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "transparent",
                color: activeTab === "inventory" ? "white" : "#94a3b8",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                transition: "all 0.2s",
              }}
            >
              <Backpack size={18} />
              <span>مخزوني ({inventory.length}) 🎒</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "9999px",
                border: "none",
                background: categoryFilter === "all" ? "#ffffff" : "rgba(255,255,255,0.08)",
                color: categoryFilter === "all" ? "#0f172a" : "#cbd5e1",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              الكل
            </button>
            {(["head", "body", "weapon", "feet"] as GearCategory[]).map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "9999px",
                  border: "none",
                  background: categoryFilter === cat ? "#ffffff" : "rgba(255,255,255,0.08)",
                  color: categoryFilter === cat ? "#0f172a" : "#cbd5e1",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <span>{CATEGORY_LABELS[cat].icon}</span>
                <span>{CATEGORY_LABELS[cat].name}</span>
              </button>
            ))}
          </div>

          {/* Items List */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
              maxHeight: "460px",
              overflowY: "auto",
              paddingRight: "0.25rem",
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
                        background: "rgba(15, 23, 42, 0.7)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "1rem",
                        padding: "0.85rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "2.85rem",
                            height: "2.85rem",
                            borderRadius: "0.75rem",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.6rem",
                            flexShrink: 0,
                          }}
                        >
                          {item.icon_name}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.95rem" }}>{item.name}</span>
                            <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                              {CATEGORY_LABELS[item.category].name}
                            </span>
                          </div>
                          <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.75rem", lineHeight: 1.35 }}>
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, textAlign: "left" }}>
                        {isOwned ? (
                          <span
                            style={{
                              background: "rgba(16, 185, 129, 0.2)",
                              color: "#34d399",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "0.75rem",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              border: "1px solid rgba(16, 185, 129, 0.4)",
                            }}
                          >
                            مملوك ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuyItem(item)}
                            disabled={loadingAction === `buy_${item.id}`}
                            style={{
                              background: canAfford ? "linear-gradient(135deg, #0284c7, #0369a1)" : "rgba(255,255,255,0.06)",
                              color: canAfford ? "#ffffff" : "#64748b",
                              border: canAfford ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                              padding: "0.45rem 0.85rem",
                              borderRadius: "0.75rem",
                              fontSize: "0.85rem",
                              fontWeight: 900,
                              cursor: canAfford ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              boxShadow: canAfford ? "0 2px 10px rgba(2,132,199,0.3)" : "none",
                            }}
                          >
                            <span>💎 {item.price_in_gems}</span>
                            <span style={{ fontSize: "0.75rem", opacity: 0.85 }}>شراء</span>
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
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "2.5rem 1rem" }}>
                  <Backpack size={36} color="#64748b" style={{ margin: "0 auto 0.5rem" }} />
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>مخزونك فارغ في هذا التصنيف</div>
                  <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>تصفح المتجر واشترِ عتاداً جديداً بجواهرك!</div>
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
                        background: isEquipped ? "rgba(139, 92, 246, 0.15)" : "rgba(15, 23, 42, 0.7)",
                        border: isEquipped ? "2px solid #8b5cf6" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "1rem",
                        padding: "0.85rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "2.85rem",
                            height: "2.85rem",
                            borderRadius: "0.75rem",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.6rem",
                            flexShrink: 0,
                          }}
                        >
                          {itemObj.icon_name}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.95rem" }}>{itemObj.name}</span>
                            <span style={{ fontSize: "0.65rem", background: "rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "0.1rem 0.4rem", borderRadius: "9999px" }}>
                              {CATEGORY_LABELS[itemObj.category].name}
                            </span>
                          </div>
                          <p style={{ margin: "0.2rem 0 0", color: "#94a3b8", fontSize: "0.75rem", lineHeight: 1.35 }}>
                            {itemObj.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {isEquipped ? (
                          <button
                            type="button"
                            onClick={() => handleUnequipItem(itemObj.id, itemObj.category)}
                            disabled={loadingAction === `unequip_${itemObj.id}`}
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#f87171",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              padding: "0.45rem 0.85rem",
                              borderRadius: "0.75rem",
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            خلع العتاد ↩️
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquipItem(itemObj.id, itemObj.category)}
                            disabled={loadingAction === `equip_${itemObj.id}`}
                            style={{
                              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                              color: "#ffffff",
                              border: "1px solid #a78bfa",
                              padding: "0.45rem 0.85rem",
                              borderRadius: "0.75rem",
                              fontSize: "0.8rem",
                              fontWeight: 900,
                              cursor: "pointer",
                              boxShadow: "0 2px 10px rgba(139,92,246,0.3)",
                            }}
                          >
                            تجهيز ⚔️
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
