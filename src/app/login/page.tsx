"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

const particles = ["🏆","⭐","📖","🌙","🎯","✨","🏅","💡","📚","🎉"]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()
      toast.success("اهلاً وسهلاً! 🎉")
      if (profile?.role === "teacher") router.push("/teacher")
      else if (profile?.role === "student") router.push("/student")
      else if (profile?.role === "parent") router.push("/parent")
      else router.push("/")
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "حدث خطأ"
      toast.error(msg === "Invalid login credentials" ? "البريد أو كلمة السر غلط ❌" : msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="animated-bg" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", position: "relative", overflow: "hidden"
    }}>
      {/* Floating particles */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {particles.map((p, i) => (
          <div key={i} className="particle" style={{
            position: "absolute",
            left: `${(i * 11 + 5) % 95}%`,
            top: `${(i * 13 + 10) % 85}%`,
            fontSize: `${1.5 + (i % 3) * 0.5}rem`,
            opacity: 0.3 + (i % 3) * 0.15,
            animationDelay: `${i * -0.8}s`
          }}>{p}</div>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        <div className="fade-in-down" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="bounce" style={{ fontSize: "5rem", marginBottom: "1rem", display: "inline-block" }}>🏆</div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>منصة الطلاب</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: "0.5rem", fontSize: "1.1rem" }}>
            أكمل مهامك واكسب النقاط! 🌟
          </p>
        </div>

        <div className="fade-in-up" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderRadius: "1.5rem", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", padding: "2rem" }}>
          <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
            تسجيل الدخول
          </h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem", color: "#374151", fontSize: "0.9rem" }}>
                البريد الإلكتروني
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="example@email.com" required dir="ltr" />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem", color: "#374151", fontSize: "0.9rem" }}>
                كلمة السر
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: "100%", fontSize: "1.1rem", padding: "0.875rem" }}>
              {loading ? (
                <span>⏳ جاري الدخول...</span>
              ) : (
                <span>🚀 دخول</span>
              )}
            </button>
          </form>
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "linear-gradient(to right, #f3e8ff, #fce7f3)", borderRadius: "0.75rem", textAlign: "center" }}>
            <p style={{ color: "#7c3aed", fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
              📌 حسابك يُنشأ من قِبَل المدرس
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}