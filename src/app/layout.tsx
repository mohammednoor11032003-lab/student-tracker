import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"

export const metadata: Metadata = {
  title: "منصة الطلاب | متابعة يومية",
  description: "منصة لمتابعة الطلاب يومياً وتسجيل المهام ومنح النقاط",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Cairo', sans-serif" }}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontFamily: "'Cairo', sans-serif", direction: "rtl" },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
