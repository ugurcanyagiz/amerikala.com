"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { Profile, UserRole, hasPermission, ROLE_PERMISSIONS } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isModerator: boolean;
  can: (permission: keyof typeof ROLE_PERMISSIONS.user) => boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  role: "user",
  isAdmin: false,
  isModerator: false,
  can: () => false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile - wrapped in useCallback
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      const newProfile = await fetchProfile(user.id);
      setProfile(newProfile);
    }
  }, [user, fetchProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }

        if (currentSession?.user && mounted) {
          const userProfile = await fetchProfile(currentSession.user.id);
          if (mounted) setProfile(userProfile);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const userProfile = await fetchProfile(newSession.user.id);
          if (mounted) setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Computed values - with safe defaults
  const role: UserRole = profile?.role || "user";
  const isAdmin = role === "admin";
  const isModerator = role === "moderator" || role === "admin";

  // Permission checker
  const can = useCallback((permission: keyof typeof ROLE_PERMISSIONS.user): boolean => {
    return hasPermission(role, permission);
  }, [role]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    role,
    isAdmin,
    isModerator,
    can,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Hook for requiring auth - with safer implementation
export function useRequireAuth(redirectTo: string = "/login") {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo;
    }
  }, [user, loading, redirectTo]);

  return { user, loading };
}

// Hook for requiring specific role - with safer implementation
export function useRequireRole(
  requiredRole: UserRole | UserRole[],
  redirectTo: string = "/"
) {
  const { user, role, loading } = useAuth();
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const hasAccess = roles.includes(role);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    } else if (!loading && user && !hasAccess) {
      window.location.href = redirectTo;
    }
  }, [user, loading, hasAccess, redirectTo]);

  return { user, role, loading, hasAccess };
}
