"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // Use the new client
import { User } from "@supabase/supabase-js";

export type UserRole = "member" | "admin";

export type SessionUser = {
  email: string;
  role: UserRole | null;
  id: string; // Added ID as it is often needed
};

export function useClientSession(options?: { require?: boolean; redirectTo?: string }) {
  const { require = false, redirectTo = "/" } = options ?? {};
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      // 1. Get the current Auth User
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setSession(null);
        setReady(true);
        if (require) router.push(redirectTo);
        return;
      }

      // 2. Fetch extra profile data (like Role) from the database
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // 3. Set the session state
      setSession({
        id: user.id,
        email: user.email,
        role: (profile?.role as UserRole) || "member",
      });
      setReady(true);
    }

    // Listen for auth changes (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        getUser();
      }
    });

    getUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [require, redirectTo, router]);

  return { session, ready };
}

// Helper to sign out
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.href = "/";
}