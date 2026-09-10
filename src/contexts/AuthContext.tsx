"use client"
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
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

  // Helper to fetch user profile directly from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
      if (!error && data) {
        return data as UserProfile
      }
    } catch (err) {
      console.error("Error fetching user profile:", err)
    }
    return null
  }, [supabase])

  // Centralized robust signOut
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Error signing out from Supabase:", err)
    } finally {
      // 1. Wipe all React State immediately
      setUser(null)
      setSession(null)
      setProfile(null)

      // 2. Clear entire browser storage (localStorage & sessionStorage) to destroy stale student keys
      if (typeof window !== "undefined") {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch (storageErr) {
          console.error("Storage clear error:", storageErr)
        }

        // 3. Hard redirect to purge all in-memory React/Next.js memory caches & cookies
        window.location.href = "/login"
      }
    }
  }, [supabase])

  // Public Profile refresher
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const fresh = await fetchProfile(user.id)
      if (fresh) setProfile(fresh)
    }
  }, [user?.id, fetchProfile])

  // Initial Auth Check & Auth State Listener
  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      try {
        const { data: { session: initSession }, error } = await supabase.auth.getSession()
        if (!isMounted) return

        if (error || !initSession?.user) {
          setUser(null)
          setSession(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        const userProfile = await fetchProfile(initSession.user.id)
        if (!isMounted) return

        setUser(initSession.user)
        setSession(initSession)
        setProfile(userProfile)
      } catch (err) {
        console.error("Auth initialization error:", err)
        if (isMounted) {
          setUser(null)
          setSession(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // 3. Supabase Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return

        if (event === "SIGNED_OUT" || !currentSession?.user) {
          // Immediately wipe state upon SIGNED_OUT
          setUser(null)
          setSession(null)
          setProfile(null)
          setIsLoading(false)

          if (typeof window !== "undefined") {
            try {
              localStorage.clear()
              sessionStorage.clear()
            } catch {}
            if (pathname !== "/login") {
              window.location.href = "/login"
            }
          }
          return
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          setUser(currentSession.user)
          setSession(currentSession)

          // Fetch fresh profile from database for newly authenticated user
          const userProfile = await fetchProfile(currentSession.user.id)
          if (isMounted) {
            setProfile(userProfile)
            setIsLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, pathname])

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

  // 1. Strict Gatekeeper: Never render protected components while isLoading
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
