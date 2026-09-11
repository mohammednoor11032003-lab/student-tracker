"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

const particles = ["🏆","⭐","📖","🌙","🎯","✨","🏅","💡","📚","🎉"]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const clean = identifier.trim().toLowerCase()
      let email = clean

      if (!clean.includes("@")) {
        const norm = clean
          .replace(/[أإآ]/g, "ا")
          .replace(/ة/g, "ه")
          .replace(/ى/g, "ي")
          .replace(/\s+/g, "")

        const map: Record<string, string> = {
          "ahmed_m": "ahmed_m@tracker.app",
          "ahmedm": "ahmed_m@tracker.app",
          "abdelrahman": "abdelrahman@tracker.app",
          "ahmed_a": "ahmed_a@tracker.app",
          "ahmeda": "ahmed_a@tracker.app",
          "anas": "anas@tracker.app",
          "bashar": "bashar@tracker.app",
          "yamen": "yamen@tracker.app",
          "mojahed": "mojahed@tracker.app",
          "mujahed": "mojahed@tracker.app",
          "abdallah": "abdallah@tracker.app",
          "abdullah": "abdallah@tracker.app",
          "yahya": "yahya@tracker.app",

          "احمدالحلو": "ahmed_m@tracker.app",
          "احمدمعتز": "ahmed_m@tracker.app",
          "احمدالعداربه": "ahmed_a@tracker.app",
          "احمدعبداللطيف": "ahmed_a@tracker.app",
          "عبدالرحمن": "abdelrahman@tracker.app",
          "عبدالرحمنالعداربه": "abdelrahman@tracker.app",
          "انس": "anas@tracker.app",
          "انسالحلو": "anas@tracker.app",
          "بشار": "bashar@tracker.app",
          "بشارالرفايعه": "bashar@tracker.app",
          "يامن": "yamen@tracker.app",
          "يامنالرفايعه": "yamen@tracker.app",
          "مجاهد": "mojahed@tracker.app",
          "مجاهدالصالحي": "mojahed@tracker.app",
          "عبدالله": "abdallah@tracker.app",
          "عبداللهالصالحي": "abdallah@tracker.app",
          "يحيي": "yahya@tracker.app",
          "يحييجمعه": "yahya@tracker.app",
          "يحييالرواشده": "yahya@tracker.app",

          // Teacher Aliases
          "معلم": "mohammednoor11032003@gmail.com",
          "المعلم": "mohammednoor11032003@gmail.com",
          "مدرس": "mohammednoor11032003@gmail.com",
          "المدرس": "mohammednoor11032003@gmail.com",
          "teacher": "mohammednoor11032003@gmail.com",
          "admin": "mohammednoor11032003@gmail.com",
        }

        email = map[norm] || `${clean}@tracker.app`
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()
      toast.success("اهلاً وسهلاً! 🎉")
      const target = profile?.role === "teacher" ? "/teacher" : profile?.role === "parent" ? "/parent" : "/student"
      window.location.href = target
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "حدث خطأ"
      toast.error(msg === "Invalid login credentials" ? "اسم المستخدم أو كلمة السر غير صحيحة ❌" : msg)
    } finally {
      setLoading(false)
    }
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

      <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 1 }}>
        <div className="fade-in-down" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="bounce" style={{ fontSize: "5rem", marginBottom: "1rem", display: "inline-block" }}>🏆</div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>منصة التحفيظ والمهام</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", marginTop: "0.5rem", fontSize: "1.1rem" }}>
            بوابة المعلم والطلاب 🌟
          </p>
        </div>

        <div className="fade-in-up" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderRadius: "1.5rem", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", padding: "2rem" }}>
          <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
            تسجيل الدخول
          </h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem", color: "#374151", fontSize: "0.95rem" }}>
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="input"
                placeholder="معلم أو anas أو أنس"
                required
                dir="auto"
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem", color: "#374151", fontSize: "0.95rem" }}>
                كلمة السر
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
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

          {/* Quick Credential Hints */}
          <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ padding: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.75rem", fontSize: "0.85rem", color: "#166534" }}>
              👨‍🏫 <strong>دخول المعلم:</strong> اسم المستخدم: <code>معلم</code> | السر: <code>123456</code>
            </div>
            <div style={{ padding: "0.75rem", background: "#f3e8ff", border: "1px solid #e9d5ff", borderRadius: "0.75rem", fontSize: "0.85rem", color: "#6b21a8" }}>
              👨‍🎓 <strong>دخول الطلاب:</strong> اسم الطالب (مثال: <code>anas</code>) | السر: <code>123456</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}