"use client"
import React, { useState, useMemo } from "react"
import HeroAvatar from "@/components/student/hero/HeroAvatar"
import { ShopItem, GearCategory, VISUAL_PRESETS } from "@/lib/hero-utils"
import toast from "react-hot-toast"

interface TeacherShopAdminProps {
  initialItems: ShopItem[]
}

const CATEGORY_NAMES: Record<GearCategory, string> = {
  head: "الرأس",
  body: "الجسم",
  weapon: "السلاح",
  feet: "القدمين",
}

const CATEGORY_ICONS: Record<GearCategory, string> = {
  head: "🧢",
  body: "🥋",
  weapon: "⚔️",
  feet: "👢",
}

export default function TeacherShopAdmin({ initialItems }: TeacherShopAdminProps) {
  const [items, setItems] = useState<ShopItem[]>(initialItems)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<GearCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Dressing Room Preview State (equipped items)
  const [previewEquipped, setPreviewEquipped] = useState<{
    head?: ShopItem | null
    body?: ShopItem | null
    weapon?: ShopItem | null
    feet?: ShopItem | null
  }>({
    head: null,
    body: null,
    weapon: null,
    feet: null,
  })

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<ShopItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    category: "head" as GearCategory,
    price_in_gems: 100,
    icon_name: "🧢",
    description: "",
    visual_id: "starter_cap",
    base_attack: 0,
    base_defense: 5,
  })

  // Filtered items list
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = activeCategoryFilter === "all" || item.category === activeCategoryFilter
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [items, activeCategoryFilter, searchQuery])

  // Count equipped in dressing room
  const equippedCount = Object.values(previewEquipped).filter(Boolean).length

  // Quick equip/try-on in dressing room
  function handleTryOn(item: ShopItem) {
    setPreviewEquipped(prev => {
      // If already equipped, clicking again unequips it
      if (prev[item.category]?.id === item.id) {
        toast("تم خلع " + item.name, { icon: "↩️" })
        return { ...prev, [item.category]: null }
      }
      toast.success("تم تجربة: " + item.name + " (" + CATEGORY_NAMES[item.category] + ")")
      return { ...prev, [item.category]: item }
    })
  }

  // Unequip specific slot
  function handleUnequipSlot(cat: GearCategory) {
    setPreviewEquipped(prev => ({ ...prev, [cat]: null }))
    toast("تم خلع عنصر " + CATEGORY_NAMES[cat], { icon: "↩️" })
  }

  // Reset all dressing room slots
  function handleResetDressingRoom() {
    setPreviewEquipped({ head: null, body: null, weapon: null, feet: null })
    toast.success("تم إعادة تعيين غرفة القياس إلى الثوب الأساسي")
  }

  // Open Add Modal
  function handleOpenAddModal() {
    setFormData({
      name: "",
      category: "head",
      price_in_gems: 100,
      icon_name: "🧢",
      description: "",
      visual_id: "starter_cap",
      base_attack: 0,
      base_defense: 5,
    })
    setIsAddModalOpen(true)
  }

  // Open Edit Modal
  function handleOpenEditModal(item: ShopItem) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      price_in_gems: item.price_in_gems,
      icon_name: item.icon_name,
      description: item.description,
      visual_id: item.visual_id,
      base_attack: item.base_attack || 0,
      base_defense: item.base_defense || 0,
    })
  }

  // Handle Form Category Change
  function handleCategoryChange(newCat: GearCategory) {
    const presets = VISUAL_PRESETS[newCat] || []
    const defaultPreset = presets[0]?.id || newCat
    const defaultIcon = CATEGORY_ICONS[newCat] || "🛡️"
    const defaultAttack = newCat === "weapon" ? 25 : newCat === "body" ? 4 : newCat === "head" ? 3 : 2
    const defaultDefense = newCat === "weapon" ? 3 : newCat === "body" ? 25 : newCat === "head" ? 15 : 10
    setFormData(prev => ({
      ...prev,
      category: newCat,
      visual_id: defaultPreset,
      icon_name: defaultIcon,
      base_attack: defaultAttack,
      base_defense: defaultDefense,
    }))
  }

  // Submit Add Form
  async function handleSubmitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("يرجى كتابة اسم العنصر")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/teacher/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في إضافة العنصر")
      }

      setItems(prev => [data.item, ...prev])
      setIsAddModalOpen(false)
      toast.success("تم إضافة العنصر بنجاح! 🎉")

      // Automatically try it on in dressing room
      handleTryOn(data.item)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الإضافة")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Edit Form
  async function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return
    if (!formData.name.trim()) {
      toast.error("يرجى كتابة اسم العنصر")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/teacher/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          ...formData,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في تعديل العنصر")
      }

      const updatedItem: ShopItem = data.item
      setItems(prev => prev.map(i => (i.id === editingItem.id ? updatedItem : i)))

      // Update preview if this item was equipped
      setPreviewEquipped(prev => {
        if (prev[updatedItem.category]?.id === editingItem.id) {
          return { ...prev, [updatedItem.category]: updatedItem }
        }
        return prev
      })

      setEditingItem(null)
      toast.success("تم حفظ التعديلات بنجاح! 💾")
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التعديل")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirm Delete
  async function handleConfirmDelete() {
    if (!deletingItem) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/teacher/shop?id=${encodeURIComponent(deletingItem.id)}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في حذف العنصر")
      }

      setItems(prev => prev.filter(i => i.id !== deletingItem.id))

      // Unequip from preview if equipped
      setPreviewEquipped(prev => {
        if (prev[deletingItem.category]?.id === deletingItem.id) {
          return { ...prev, [deletingItem.category]: null }
        }
        return prev
      })

      toast.success("تم حذف العنصر بنجاح")
      setDeletingItem(null)
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحذف")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "2rem" }}>🛡️</span>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 900, margin: 0 }}>إدارة المتجر ونظام الـ RPG</h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.2)",
                fontWeight: 700,
              }}
            >
              لوحة المعلم
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#c7d2fe", maxWidth: "600px" }}>
            تحكم كامل في اقتصاد اللعبة وتعديل أسعار الجواهر، مع غرفة قياس بصرية لتجربة تراكب العتاد على الشخصية لحظياً.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "0.85rem",
            padding: "0.75rem 1.4rem",
            fontSize: "0.95rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
            transition: "transform 0.15s ease",
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span style={{ fontSize: "1.2rem" }}>➕</span>
          <span>إضافة عنصر جديد</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* ================= 1. ADMIN DRESSING ROOM (غرفة القياس والتجربة) ================= */}
        <div
          style={{
            background: "linear-gradient(180deg, #090d16 0%, #0f172a 100%)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "0.75rem",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "white", margin: 0 }}>
                👔 غرفة القياس والتجربة الحية
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                انقر على أي عنصر لتجربته على الشخصية بدون قيود
              </span>
            </div>
            {equippedCount > 0 && (
              <button
                onClick={handleResetDressingRoom}
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "0.5rem",
                  padding: "0.3rem 0.65rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🔄 خلع الكل
              </button>
            )}
          </div>

          {/* AVATAR DISPLAY */}
          <div
            style={{
              position: "relative",
              margin: "0.5rem 0 1rem",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
              borderRadius: "1rem",
              padding: "0.5rem",
            }}
          >
            <HeroAvatar equipped={previewEquipped} size={240} />
          </div>

          {/* 4 GEAR SLOTS SUMMARY (WITH UNEQUIP BUTTONS) */}
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.6rem",
              marginBottom: "1.25rem",
            }}
          >
            {(["head", "body", "weapon", "feet"] as GearCategory[]).map(cat => {
              const item = previewEquipped[cat]
              return (
                <div
                  key={cat}
                  style={{
                    background: item ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.03)",
                    border: item ? "1px solid rgba(16, 185, 129, 0.35)" : "1px dashed rgba(255, 255, 255, 0.12)",
                    borderRadius: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                    <span style={{ fontSize: "1.2rem" }}>{item ? item.icon_name : CATEGORY_ICONS[cat]}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700 }}>
                        {CATEGORY_NAMES[cat]}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          color: item ? "#34d399" : "#64748b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item ? item.name : "فارغ (أساسي)"}
                      </div>
                    </div>
                  </div>

                  {item && (
                    <button
                      onClick={() => handleUnequipSlot(cat)}
                      title="خلع"
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "none",
                        color: "#cbd5e1",
                        cursor: "pointer",
                        borderRadius: "0.35rem",
                        padding: "0.2rem 0.4rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* QUICK TRY-ON CATALOG CAROUSEL/GRID */}
          <div style={{ width: "100%" }}>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#cbd5e1",
                fontWeight: 800,
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>انقر لتجربة العتاد مباشرة:</span>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{items.length} عنصر متاح</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(65px, 1fr))",
                gap: "0.5rem",
                maxHeight: "220px",
                overflowY: "auto",
                padding: "0.25rem",
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: "0.75rem",
              }}
            >
              {items.map(item => {
                const isEquipped = previewEquipped[item.category]?.id === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTryOn(item)}
                    title={`${item.name} (${item.price_in_gems} 💎)`}
                    style={{
                      background: isEquipped
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.5) 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: isEquipped ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "0.6rem",
                      padding: "0.4rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.2rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{item.icon_name}</span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: isEquipped ? "#34d399" : "#e2e8f0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                      }}
                    >
                      {item.name}
                    </span>
                    {isEquipped && (
                      <span style={{ fontSize: "0.6rem", color: "#10b981", fontWeight: 900 }}>مُجهز ✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ================= 2. SHOP INVENTORY MANAGEMENT (إدارة بيانات العتاد) ================= */}
        <div
          style={{
            background: "white",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                📋 جدول عناصر المتجر ({filteredItems.length})
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                تعديل الأسعار والمسميات وإدارة العتاد المتاح للطلاب
              </span>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setActiveCategoryFilter("all")}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: activeCategoryFilter === "all" ? "#4f46e5" : "#f1f5f9",
                  color: activeCategoryFilter === "all" ? "white" : "#475569",
                }}
              >
                الكل ({items.length})
              </button>
              {(["head", "body", "weapon", "feet"] as GearCategory[]).map(cat => {
                const count = items.filter(i => i.category === cat).length
                const isActive = activeCategoryFilter === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    style={{
                      padding: "0.3rem 0.65rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      background: isActive ? "#4f46e5" : "#f1f5f9",
                      color: isActive ? "white" : "#475569",
                    }}
                  >
                    {CATEGORY_ICONS[cat]} {CATEGORY_NAMES[cat]} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search Box */}
          <div>
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم، الوصف، أو المعرّف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none",
                background: "#f8fafc",
              }}
            />
          </div>

          {/* DATA TABLE */}
          <div style={{ overflowX: "auto", maxHeight: "480px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", color: "#475569" }}>العنصر</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", color: "#475569" }}>الفئة</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", color: "#475569" }}>الخصائص (⚔️ / 🛡️)</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", color: "#475569" }}>السعر 💎</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", color: "#475569" }}>الطبقة (SVG)</th>
                  <th style={{ padding: "0.75rem 0.5rem", fontSize: "0.8rem", color: "#475569", textAlign: "center" }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                      لا توجد عناصر مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isPreviewed = previewEquipped[item.category]?.id === item.id
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isPreviewed ? "rgba(16, 185, 129, 0.05)" : "transparent",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Name & Icon */}
                        <td style={{ padding: "0.65rem 0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.4rem" }}>{item.icon_name}</span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#1e293b" }}>{item.name}</div>
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#64748b",
                                  maxWidth: "200px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                title={item.description}
                              >
                                {item.description || "بدون وصف"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "0.65rem 0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.4rem",
                              background: "#f1f5f9",
                              color: "#334155",
                            }}
                          >
                            {CATEGORY_NAMES[item.category]}
                          </span>
                        </td>

                        {/* Stats (Attack & Defense) */}
                        <td style={{ padding: "0.65rem 0.5rem" }}>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                color: (item.base_attack ?? 0) > 0 ? "#ef4444" : "#94a3b8",
                                background: (item.base_attack ?? 0) > 0 ? "rgba(239, 68, 68, 0.1)" : "#f1f5f9",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "0.35rem",
                              }}
                            >
                              ⚔️ {item.base_attack || 0}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                color: (item.base_defense ?? 0) > 0 ? "#0284c7" : "#94a3b8",
                                background: (item.base_defense ?? 0) > 0 ? "rgba(2, 132, 199, 0.1)" : "#f1f5f9",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "0.35rem",
                              }}
                            >
                              🛡️ {item.base_defense || 0}
                            </span>
                          </div>
                        </td>

                        {/* Price in gems */}
                        <td style={{ padding: "0.65rem 0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: 800,
                              color: "#059669",
                              background: "#ecfdf5",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.4rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.2rem",
                            }}
                          >
                            <span>{item.price_in_gems}</span>
                            <span>💎</span>
                          </span>
                        </td>

                        {/* Visual preset ID */}
                        <td style={{ padding: "0.65rem 0.5rem" }}>
                          <code
                            style={{
                              fontSize: "0.7rem",
                              background: "#f1f5f9",
                              padding: "0.15rem 0.35rem",
                              borderRadius: "0.3rem",
                              color: "#6366f1",
                              fontFamily: "monospace",
                            }}
                          >
                            {item.visual_id}
                          </code>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "0.65rem 0.5rem", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center" }}>
                            {/* Try-on button */}
                            <button
                              onClick={() => handleTryOn(item)}
                              title={isPreviewed ? "خلع من غرفة القياس" : "تجربة في غرفة القياس"}
                              style={{
                                background: isPreviewed ? "#10b981" : "#f1f5f9",
                                color: isPreviewed ? "white" : "#334155",
                                border: "none",
                                borderRadius: "0.4rem",
                                padding: "0.3rem 0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {isPreviewed ? "مُرتدى ✓" : "👗 جرب"}
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="تعديل العنصر"
                              style={{
                                background: "#eff6ff",
                                color: "#2563eb",
                                border: "none",
                                borderRadius: "0.4rem",
                                padding: "0.3rem 0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ✏️ تعديل
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => setDeletingItem(item)}
                              title="حذف العنصر"
                              style={{
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "none",
                                borderRadius: "0.4rem",
                                padding: "0.3rem 0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL: ADD / EDIT ITEM ================= */}
      {(isAddModalOpen || editingItem) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => {
            setIsAddModalOpen(false)
            setEditingItem(null)
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "520px",
              padding: "1.75rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              direction: "rtl",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "0.75rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#1e293b" }}>
                {editingItem ? "✏️ تعديل بيانات العتاد" : "➕ إضافة عنصر جديد للمتجر"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingItem(null)
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingItem ? handleSubmitEdit : handleSubmitAdd}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                    اسم العنصر *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سيف الفاتح، خوذة النصر..."
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Category & Price Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                  {/* Category */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                      الفئة *
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => handleCategoryChange(e.target.value as GearCategory)}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        outline: "none",
                        background: "white",
                      }}
                    >
                      <option value="head">🧢 الرأس (Head)</option>
                      <option value="body">🥋 الجسم (Body)</option>
                      <option value="weapon">⚔️ السلاح (Weapon)</option>
                      <option value="feet">👢 القدمين (Feet)</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                      السعر بالجواهر 💎 *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      required
                      value={formData.price_in_gems}
                      onChange={e => setFormData({ ...formData, price_in_gems: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* RPG Combat Stats (Attack & Defense) */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#ef4444" }}>
                      قوة الهجوم ⚔️
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={formData.base_attack}
                      onChange={e => setFormData({ ...formData, base_attack: Math.max(0, Number(e.target.value)) })}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#0284c7" }}>
                      قوة الحماية 🛡️
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={formData.base_defense}
                      onChange={e => setFormData({ ...formData, base_defense: Math.max(0, Number(e.target.value)) })}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Visual Layer Preset & Icon Emoji */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.8rem" }}>
                  {/* Visual Preset */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                      نمط الطبقة المرئية (SVG Layer) *
                    </label>
                    <select
                      value={formData.visual_id}
                      onChange={e => setFormData({ ...formData, visual_id: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        outline: "none",
                        background: "white",
                      }}
                    >
                      {(VISUAL_PRESETS[formData.category] || []).map(preset => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Icon Emoji */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                      رمز الأيقونة
                    </label>
                    <input
                      type="text"
                      value={formData.icon_name}
                      onChange={e => setFormData({ ...formData, icon_name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #cbd5e1",
                        fontSize: "1rem",
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                    الوصف التاريخي أو التحفيزي
                  </label>
                  <textarea
                    rows={3}
                    placeholder="اكتب نبذة أو رسالة تحفيزية تصف هذا العتاد..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Submit Buttons */}
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      background: editingItem
                        ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)"
                        : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "0.75rem",
                      padding: "0.75rem",
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? "جاري الحفظ..." : editingItem ? "حفظ التعديلات 💾" : "إضافة العنصر للمتجر ➕"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setEditingItem(null)
                    }}
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      borderRadius: "0.75rem",
                      padding: "0.75rem 1.25rem",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setDeletingItem(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.25rem",
              width: "100%",
              maxWidth: "420px",
              padding: "1.75rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              direction: "rtl",
              textAlign: "center",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚠️</div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#1e293b" }}>
              تأكيد حذف العنصر
            </h3>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: "#64748b" }}>
              هل أنت متأكد من حذف عنصر <strong>"{deletingItem.name}"</strong> من متجر الطلاب؟ لن يتمكن الطلاب الجدد من شرائه.
            </p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  padding: "0.75rem",
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "جاري الحذف..." : "نعم، احذف العنصر"}
              </button>
              <button
                onClick={() => setDeletingItem(null)}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "0.75rem",
                  padding: "0.75rem 1.25rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
