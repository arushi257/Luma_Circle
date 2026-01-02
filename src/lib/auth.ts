"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "member" | "admin";

export type SessionUser = {
  email: string;
  role: UserRole | null;
};

const SESSION_KEY = "lc-session";

/**
 * Reads the client-side session persisted by the OTP flow. Accepts both the current
 * `{ stage, email, userRole }` shape and a minimal `{ email, role }` shape.
 */
export function loadSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as
      | { stage?: string; email?: string; userRole?: UserRole | null }
      | SessionUser;

    const email = (parsed as SessionUser).email || parsed.email;
    const role = (parsed as SessionUser).role ?? (parsed as { userRole?: UserRole }).userRole ?? null;
    const stage = (parsed as { stage?: string }).stage;
    if (!email) return null;

    // Require dashboard stage if present; otherwise accept legacy minimal sessions.
    if (stage && stage !== "dashboard") return null;
    return { email, role };
  } catch {
    return null;
  }
}

export function saveSession(session: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ stage: "dashboard", email: session.email, userRole: session.role }),
  );
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function useClientSession(options?: { require?: boolean; redirectTo?: string }) {
  const { require = false, redirectTo = "/" } = options ?? {};
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = loadSession();
    setSession(current);
    setReady(true);

    if (require && !current) {
      router.push(redirectTo);
    }
  }, [require, redirectTo, router]);

  return { session, ready };
}

