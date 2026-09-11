'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { StudentBankSummary, BankTransaction, TransactionType } from '@/lib/bank-types'
import { Landmark, TrendingUp, ShoppingCart, Wallet, ArrowDownRight, ArrowUpRight, Scale, RefreshCw, Calendar, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface StudentBankViewProps {
  studentId: string
  studentName: string
  initialSummary?: StudentBankSummary
}

export default function StudentBankView({
  studentId,
  studentName,
  initialSummary,
}: StudentBankViewProps) {
  const [summary, setSummary] = useState<StudentBankSummary>(
    initialSummary || {
      student_id: studentId,
      student_name: studentName,
      total_earned: 0,
      total_spent: 0,
      current_balance: 0,
      transactions: [],
    }
  )
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | TransactionType>('all')

  // Fetch updated summary on mount and on refresh
  async function fetchSummary(quiet = false) {
    if (!studentId) return
    if (!quiet) setLoading(true)
    try {
      const res = await fetch(`/api/bank?studentId=${studentId}`)
      const data = await res.json()
      if (data.success && data.summary) {
        setSummary(data.summary)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("student_dinars_updated", { detail: { dinars: data.summary.current_balance } }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch student bank summary:', err)
    } finally {
      if (!quiet) setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary(true)
  }, [studentId])

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return summary.transactions
    return summary.transactions.filter(t => t.type === activeFilter)
  }, [summary.transactions, activeFilter])

  // Format Arabic Date & Time
  function formatTxDate(dateStr: string) {
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    } catch {
      return dateStr
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
          borderRadius: '1.5rem',
          padding: '1.25rem 1.5rem',
          border: '2px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            🏦
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#ffffff', fontSize: '1.35rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>بنك الدنانير القرآني</span>
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontWeight: 800,
                }}
              >
                مكافآت واقعية 💰
              </span>
            </h2>
            <p style={{ margin: '0.2rem 0 0', color: '#a7f3d0', fontSize: '0.82rem' }}>
              حوّل تفوقك القرآني وتميزك بين زملائك إلى دنانير حقيقية وجوائز ملموسة!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchSummary()
            toast.success('تم تحديث بيانات الحساب البنكي 🔄')
          }}
          disabled={loading}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: 'white',
            borderRadius: '0.85rem',
            padding: '0.55rem 0.95rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            lineHeight: 1.2,
            transition: 'all 0.15s ease',
            fontFamily: "'Tajawal', 'Cairo', sans-serif",
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>تحديث الحساب</span>
        </button>
      </div>

      {/* 3 Prominent Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        {/* 1. المجموع الكلي للدنانير المجمعة */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '1.25rem',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6ee7b7' }}>المجموع الكلي المكتسب</span>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.6rem', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
            {summary.total_earned.toFixed(2)}{' '}
            <span style={{ fontSize: '1rem', color: '#10b981', fontWeight: 800 }}>د.أ</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            إجمالي الدنانير التي حصدتها بالتفوق
          </div>
        </div>

        {/* 2. المصروف الكلي */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1.5px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '1.25rem',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fda4af' }}>المصروف الكلي</span>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.6rem', background: 'rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
              <ShoppingCart size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
            {summary.total_spent.toFixed(2)}{' '}
            <span style={{ fontSize: '1rem', color: '#f43f5e', fontWeight: 800 }}>د.أ</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            ما تم صرفه على جوائز ووجبات واقعية
          </div>
        </div>

        {/* 3. الرصيد الحالي المتبقي (Featured Glowing Card) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: '2px solid #38bdf8',
            borderRadius: '1.25rem',
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            boxShadow: '0 10px 30px rgba(2, 132, 199, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e0f2fe' }}>الرصيد المتبقي للصرف</span>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.6rem', background: 'rgba(255, 255, 255, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>
            {summary.current_balance.toFixed(2)}{' '}
            <span style={{ fontSize: '1.1rem', color: '#fef08a', fontWeight: 900 }}>د.أ</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#e0f2fe', fontWeight: 700 }}>
            رصيدك الجاهز لطلب المكافآت من المعلم 🌟
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Section Header & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontWeight: 800 }}>
              📜 سجل الحركات المالية
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              توثيق شفاف لجميع حركات الكسب والاستبدال والتعديلات الإدارية
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(
              [
                { id: 'all', label: 'الكل' },
                { id: 'earn', label: 'كسب 🟢' },
                { id: 'spend', label: 'صرف 🔴' },
                { id: 'adjustment', label: 'تعديل 🔵' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  background: activeFilter === tab.id ? 'white' : 'transparent',
                  color: activeFilter === tab.id ? '#0f172a' : '#94a3b8',
                  border: 'none',
                  borderRadius: '0.55rem',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🪙</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e2e8f0' }}>لا توجد معاملات مسجلة في هذا التبويب</div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#64748b' }}>
              ثابر في حفظك وتسميعك اليومي لتكون من نجوم الأسبوع والشهر وتحصد الدنانير في رصيدك!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredTransactions.map(tx => {
              const isEarn = tx.type === 'earn'
              const isSpend = tx.type === 'spend'
              const isAdj = tx.type === 'adjustment'
              const isPositive = tx.amount >= 0

              return (
                <div
                  key={tx.id}
                  style={{
                    background: isEarn
                      ? 'rgba(16, 185, 129, 0.08)'
                      : isSpend
                      ? 'rgba(244, 63, 94, 0.08)'
                      : 'rgba(56, 189, 248, 0.08)',
                    border: isEarn
                      ? '1px solid rgba(16, 185, 129, 0.25)'
                      : isSpend
                      ? '1px solid rgba(244, 63, 94, 0.25)'
                      : '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '1rem',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left Side: Icon & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: isEarn
                          ? 'rgba(16, 185, 129, 0.2)'
                          : isSpend
                          ? 'rgba(244, 63, 94, 0.2)'
                          : 'rgba(56, 189, 248, 0.2)',
                        color: isEarn ? '#34d399' : isSpend ? '#f87171' : '#38bdf8',
                        fontSize: '1.1rem',
                      }}
                    >
                      {isEarn ? <ArrowDownRight size={18} /> : isSpend ? <ArrowUpRight size={18} /> : <Scale size={18} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {tx.description}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                        <Calendar size={11} />
                        <span>{formatTxDate(tx.created_at)}</span>
                        {isEarn && (
                          <span style={{ color: '#10b981', fontWeight: 700, marginRight: '0.35rem' }}>• مكافأة استحقاق 🏆</span>
                        )}
                        {isSpend && (
                          <span style={{ color: '#f43f5e', fontWeight: 700, marginRight: '0.35rem' }}>• صرف مكافأة 🛍️</span>
                        )}
                        {isAdj && (
                          <span style={{ color: '#38bdf8', fontWeight: 700, marginRight: '0.35rem' }}>• تعديل إداري ⚖️</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Amount Badge */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: '1.05rem',
                        color: isEarn
                          ? '#34d399'
                          : isSpend
                          ? '#f87171'
                          : isPositive
                          ? '#38bdf8'
                          : '#fb7185',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <span>{isEarn ? '+' : isSpend ? '-' : isPositive ? '+' : '-'}</span>
                      <span>{Math.abs(tx.amount).toFixed(2)}</span>
                      <span style={{ fontSize: '0.8rem' }}>د.أ</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
