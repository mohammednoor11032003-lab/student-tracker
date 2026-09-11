"use client"
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import { usePathname } from "next/navigation"
import { User, Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import LoadingScreen from "@/components/LoadingScreen"

export interface UserProfile {
  id: string
  full_name: string
  role: "student" | "teacher" | "parent"
  avatar_svg?: string | null
  phone?: string | null
  student_id?: string | null
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  role: "student" | "teacher" | "parent" | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const pathname = usePathname()
  const isMountedRef = useRef(true)

  // Helper to fetch user profile directly from database with timeout
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    console.log("[AuthContext] fetchProfile: Starting query for userId:", userId)
    try {
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      // Timeout after 3 seconds so profile fetching never blocks loading forever
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 3000)
      )

      const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any

      if (error) {
        console.error("[AuthContext] fetchProfile: Error or query failure:", error)
        return null
      }

      if (data) {
        console.log("[AuthContext] fetchProfile: Profile loaded successfully for:", data.full_name, "Role:", data.role)
        return data as UserProfile
      }
    } catch (err) {
      console.error("[AuthContext] fetchProfile: Unexpected exception:", err)
    }
    return null
  }, [supabase])

  // Centralized robust signOut
  const signOut = useCallback(async () => {
    console.log("[AuthContext] signOut: Initiating full sign out...")
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
    } catch (err) {
      console.error("[AuthContext] signOut: Error signing out from Supabase:", err)
    } finally {
      console.log("[AuthContext] signOut: Cleaning state and local storage...")
      setUser(null)
      setSession(null)
      setProfile(null)

      if (typeof window !== "undefined") {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (storageErr) {
          console.error("[AuthContext] signOut: Storage clear error:", storageErr)
        }
        window.location.href = "/login"
      }
    }
  }, [supabase])

  // Public Profile refresher
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      console.log("[AuthContext] refreshProfile: Refreshing profile for user:", user.id)
      const fresh = await fetchProfile(user.id)
      if (fresh && isMountedRef.current) setProfile(fresh)
    }
  }, [user?.id, fetchProfile])

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Initial Auth Check & Auth State Listener (Runs ONCE on mount)
  useEffect(() => {
    console.log("[AuthContext] Mount: Initializing authentication check...")
    let didCancel = false

    // Safety Fallback Timer: Under no circumstance allow isLoading to remain true longer than 3.5s
    const safetyTimer = setTimeout(() => {
      if (!didCancel && isMountedRef.current) {
        setIsLoading(prev => {
          if (prev) {
            console.warn("[AuthContext] Safety fallback triggered: forcing isLoading = false after 3.5s timeout")
            return false
          }
          return false
        })
      }
    }, 3500)

    async function initAuth() {
      console.log("[AuthContext] initAuth: Fetching session from Supabase...")
      try {
        const { data: { session: initSession }, error } = await supabase.auth.getSession()

        if (didCancel) return

        if (error) {
          console.error("[AuthContext] initAuth: Supabase getSession error:", error)
          setUser(null)
          setSession(null)
          setProfile(null)
          return
        }

        if (!initSession?.user) {
          console.log("[AuthContext] initAuth: No active session found.")
          setUser(null)
          setSession(null)
          setProfile(null)
          return
        }

        console.log("[AuthContext] initAuth: Active session found for user:", initSession.user.id)
        setUser(initSession.user)
        setSession(initSession)

        const userProfile = await fetchProfile(initSession.user.id)
        if (didCancel) return

        if (userProfile) {
          console.log("[AuthContext] initAuth: User profile attached successfully:", userProfile.full_name)
          setProfile(userProfile)
        } else {
          console.warn("[AuthContext] initAuth: No profile row found in DB for user:", initSession.user.id)
        }
      } catch (err) {
        console.error("[AuthContext] initAuth: Critical caught error during auth init:", err)
        if (!didCancel) {
          setUser(null)
          setSession(null)
          setProfile(null)
        }
      } finally {
        if (!didCancel && isMountedRef.current) {
          console.log("[AuthContext] initAuth: Completed. Setting isLoading = false.")
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Supabase Auth State Change Listener
    console.log("[AuthContext] Subscribing to onAuthStateChange...")
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[AuthContext] onAuthStateChange event received: '${event}'`, currentSession?.user?.id ? `for user: ${currentSession.user.id}` : "no user")
        if (didCancel || !isMountedRef.current) return

        if (event === "SIGNED_OUT" || !currentSession?.user) {
          console.log("[AuthContext] User signed out or session destroyed.")
          setUser(null)
          setSession(null)
          setProfile(null)
          setIsLoading(false)

          if (typeof window !== "undefined") {
            try {
              localStorage.clear()
              sessionStorage.clear()
            } catch {}
            if (window.location.pathname !== "/login") {
              window.location.href = "/login"
            }
          }
          return
        }

        if (
          event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          setUser(currentSession.user)
          setSession(currentSession)

          try {
            const userProfile = await fetchProfile(currentSession.user.id)
            if (!didCancel && isMountedRef.current) {
              setProfile(userProfile)
            }
          } catch (profileErr) {
            console.error("[AuthContext] onAuthStateChange: Error fetching profile:", profileErr)
          } finally {
            if (!didCancel && isMountedRef.current) {
              setIsLoading(false)
            }
          }
        }
      }
    )

    return () => {
      console.log("[AuthContext] Unmounting: cleaning up auth subscription and safety timer.")
      didCancel = true
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const role = profile?.role ?? null

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    session,
    profile,
    role,
    isLoading,
    signOut,
    refreshProfile,
  }), [user, session, profile, role, isLoading, signOut, refreshProfile])

  // Determine if current route is protected
  const isProtectedRoute =
    pathname.startsWith("/student") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/parent") ||
    pathname === "/"

  // 1. Gatekeeper: Never render protected components while isLoading
  if (isLoading && isProtectedRoute) {
    return <LoadingScreen message="جاري التحقق من الجلسة وتحميل البيانات..." />
  }

  // 2. Unauthenticated Gatekeeper: If not loading and no user on a protected route, redirect to login
  if (!isLoading && !user && isProtectedRoute) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return <LoadingScreen message="جاري تحويلك لصفحة تسجيل الدخول..." />
  }

  // 3. Role-Based Gatekeeper: Strictly enforce route access per user role
  if (!isLoading && user && profile?.role) {
    if (pathname.startsWith("/teacher") && profile.role !== "teacher") {
      const redirectUrl = profile.role === "student" ? "/student" : profile.role === "parent" ? "/parent" : "/login"
      if (typeof window !== "undefined") {
        window.location.href = redirectUrl
      }
      return <LoadingScreen message="غير مصرح لك بالوصول إلى لوحة المعلم. جاري تحويلك..." />
    }

    if (pathname.startsWith("/student") && profile.role !== "student") {
      const redirectUrl = profile.role === "teacher" ? "/teacher" : profile.role === "parent" ? "/parent" : "/login"
      if (typeof window !== "undefined") {
        window.location.href = redirectUrl
      }
      return <LoadingScreen message="جاري تحويلك إلى لوحتك الخاصة..." />
    }

    if (pathname.startsWith("/parent") && profile.role !== "parent") {
      const redirectUrl = profile.role === "teacher" ? "/teacher" : profile.role === "student" ? "/student" : "/login"
      if (typeof window !== "undefined") {
        window.location.href = redirectUrl
      }
      return <LoadingScreen message="جاري تحويلك إلى لوحتك الخاصة..." />
    }
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
