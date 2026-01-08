"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

type Stage = "email" | "otp" | "dashboard";
type Role = "member" | "admin";
type LoginMode = "password" | "otp";

type PersistedSession = {
  stage: Stage;
  email: string;
  userRole: Role | null;
};

type PulsePost = {
  channel: string;
  excerpt: string;
  minutesAgo: number;
};

type TeamMatch = {
  title: string;
  overlap: number;
  availability: string;
  seniority: string;
};

type LabRating = {
  lab: string;
  inclusivity: number;
  safety: number;
  comfort: number;
};

const pulsePosts: PulsePost[] = [
  {
    channel: "#academic-struggles",
    excerpt: "Feeling lost in EE210 labs—any tips on handling TA bias?",
    minutesAgo: 7,
  },
  {
    channel: "#incident-reporting",
    excerpt: "Anonymous note about lab late-night safety protocols missing.",
    minutesAgo: 18,
  },
  {
    channel: "#mental-health",
    excerpt: "Juggling CPI pressure + project deadlines—any coping routines?",
    minutesAgo: 42,
  },
];

const teamMatches: TeamMatch[] = [
  { title: "DL comp project · vision", overlap: 86, availability: "Evenings", seniority: "Mixed" },
  { title: "Robotics club build · controls", overlap: 78, availability: "Weekends", seniority: "Balanced" },
  { title: "Web3 research sprint", overlap: 65, availability: "Mornings", seniority: "Junior-friendly" },
];

const labRatings: LabRating[] = [
  { lab: "CSE · Vision Lab", inclusivity: 4.7, safety: 4.5, comfort: 4.6 },
  { lab: "EE · Power Systems", inclusivity: 3.8, safety: 4.1, comfort: 3.9 },
  { lab: "ME · Design Hub", inclusivity: 4.2, safety: 4.0, comfort: 4.3 },
];

const SESSION_KEY = "lc-session";

export default function Home() {
  const [stage, setStage] = useState<Stage>("email");
  const [loginMode, setLoginMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [debugCode, setDebugCode] = useState<string | undefined>();
  const [sentinelText, setSentinelText] = useState("");
  const [sentinelResult, setSentinelResult] = useState<string | null>(null);
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [cpi, setCpi] = useState<number>(8.2);
  const [skillLevel, setSkillLevel] = useState<"junior" | "mid" | "senior">("mid");

  const { isDark } = useTheme();

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as PersistedSession;
      if (parsed.stage === "dashboard") {
        setStage("dashboard");
        setEmail(parsed.email);
        setUserRole(parsed.userRole);
      }
    } catch {
      // ignore malformed cache
    }
  }, []);

  const persistSession = (next: PersistedSession | null) => {
    if (!next) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  };

  const formCard = isDark
    ? "border-[#9b65ff]/30 bg-[rgba(20,12,34,0.82)] shadow-xl shadow-[#8f63ff]/20"
    : "border-white/70 bg-white/90 shadow-xl shadow-amber-100/60";
  const panelCard = isDark
    ? "border-[#9b65ff]/20 bg-[rgba(20,12,34,0.72)] shadow-lg shadow-[#8f63ff]/15"
    : "border-white/70 bg-white/90 shadow-lg shadow-amber-100/60";
  const textStrong = isDark ? "text-[#f9f5ff]" : "text-slate-900";
  const textMuted = isDark ? "text-[#cbb8f5]" : "text-slate-500";
  const labelText = isDark ? "text-[#e9defa]" : "text-slate-800";
  const pageBackground = isDark
    ? "bg-[radial-gradient(circle_at_15%_20%,#2f184d_0%,#130c26_45%,#05030d_100%)] text-[#f4edff]"
    : "bg-gradient-to-br from-[#fdf3e8] via-[#f8e7ff] to-[#ffe4d1] text-slate-900";

  const resumeStrength = 76;
  const fairRange = (() => {
    const base = 12;
    const levelFactor = skillLevel === "junior" ? 0.9 : skillLevel === "mid" ? 1.2 : 1.45;
    const cpiFactor = 1 + (cpi - 7.5) * 0.05;
    const low = Math.round(base * levelFactor * cpiFactor);
    const high = Math.round(low * 1.35);
    return { low, high };
  })();

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setDebugCode(undefined);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Could not send OTP.");
      }
      setStage("otp");
      setMessage("OTP sent. Check your inbox and enter the 6-digit code.");
      if (data.debugCode) {
        setDebugCode(data.debugCode as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      setUserRole(data.role as Role);
      persistSession({ stage: "dashboard", email, userRole: data.role as Role });

      // Check if profile is complete
      if (!data.hasCompletedProfile) {
        window.location.href = "/profile?mode=setup";
        return;
      }

      setStage("dashboard");
      setMessage("Access granted. Welcome to LumaCircle.");
      // Reload to show sidebar
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Invalid OTP.");
      }

      setUserRole(data.role as Role);
      persistSession({ stage: "dashboard", email, userRole: data.role as Role });

      // Check profile completion after OTP login
      const profileRes = await fetch("/api/auth/check-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const profileData = await profileRes.json();

      if (!profileData.hasCompletedProfile) {
        window.location.href = "/profile?mode=setup";
        return;
      }

      setStage("dashboard");
      setMessage("Access granted. Welcome to LumaCircle.");
      // Reload to show sidebar
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSentinelCheck = () => {
    setSentinelLoading(true);
    setSentinelResult(null);
    setTimeout(() => {
      const text = sentinelText.toLowerCase();
      const flagged =
        text.includes("sorry") ||
        text.includes("just") ||
        text.includes("apologize") ||
        text.includes("maybe if");
      setSentinelResult(
        flagged
          ? "Detected apologetic/minimizing tone. Try a neutral-assertive rewrite before you send."
          : "Tone looks balanced. Add clear asks, timelines, and sources if you need a stronger stance.",
      );
      setSentinelLoading(false);
    }, 450);
  };

  // Login form (before dashboard)
  if (stage !== "dashboard") {
    return (
      <div className={`relative min-h-screen ${pageBackground} transition-colors duration-300`}>
        <div className="mx-auto flex max-w-4xl items-start justify-between px-6 py-10">
          <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div
              className={`relative h-16 w-16 overflow-hidden rounded-full border shadow-lg ${
                isDark
                  ? "border-[#9b65ff]/40 shadow-[#8f63ff]/25"
                  : "border-white/70 shadow-amber-100/60"
              }`}
            >
              <Image
                src="/lumacircle_just_logo.png"
                alt="LumaCircle logo"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                priority
                unoptimized
              />
            </div>
            <div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${textStrong}`}>
                LumaCircle · IITK
              </h1>
              <p
                className={`mt-1 text-sm font-semibold uppercase tracking-[0.2em] ${
                  isDark ? "text-[#f6d47c]" : "text-amber-700"
                }`}
              >
                Safety & Growth Access
              </p>
            </div>
          </div>

          {/* Login card */}
          <div className={`rounded-3xl border p-8 backdrop-blur ${formCard}`}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                    isDark ? "text-[#f6d47c]" : "text-amber-700"
                  }`}
                >
                  OTP Login
                </p>
                <h2 className={`mt-1 text-2xl font-semibold ${textStrong}`}>
                  {stage === "otp"
                    ? "Enter the 6-digit code"
                    : loginMode === "password"
                      ? "Sign in with Password"
                      : "Sign in with IITK Email"}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isDark
                    ? "border border-[#9b65ff]/30 bg-[#1f1433]/80 text-[#f5e6ff]"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                Secure · Anonymous in-app
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <label className={`block text-sm font-medium ${labelText}`}>
                Institutional Email
                <input
                  type="email"
                  placeholder="name@iitk.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ring-2 ring-transparent transition ${
                    isDark
                      ? "border-[#9b65ff]/30 bg-[#1b1430] text-[#f5ecff] placeholder:text-[#cbb8f5]/70 focus:border-[#9b65ff] focus:ring-[#7c5ae6]/50"
                      : "border-amber-100 bg-white placeholder:text-slate-400 focus:border-amber-200 focus:ring-amber-100"
                  }`}
                  disabled={stage === "otp"}
                />
              </label>

              {stage !== "otp" && loginMode === "password" && (
                <label className={`block text-sm font-medium ${labelText}`}>
                  Password
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ring-2 ring-transparent transition ${
                      isDark
                        ? "border-[#9b65ff]/30 bg-[#1b1430] text-[#f5ecff] placeholder:text-[#cbb8f5]/70 focus:border-[#9b65ff] focus:ring-[#7c5ae6]/50"
                        : "border-amber-100 bg-white placeholder:text-slate-400 focus:border-amber-200 focus:ring-amber-100"
                    }`}
                  />
                </label>
              )}

              {stage === "otp" && (
                <label className={`block text-sm font-medium ${labelText}`}>
                  One-Time Passcode
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm tracking-[0.38em] outline-none ring-2 ring-transparent transition ${
                      isDark
                        ? "border-[#9b65ff]/30 bg-[#1b1430] text-[#f5ecff] placeholder:text-[#cbb8f5]/70 focus:border-[#9b65ff] focus:ring-[#7c5ae6]/50"
                        : "border-amber-100 bg-white placeholder:text-slate-400 focus:border-amber-200 focus:ring-amber-100"
                    }`}
                  />
                </label>
              )}

              <div className="flex items-center justify-between">
                <p className={`text-xs ${textMuted}`}>
                  {stage === "otp"
                    ? "OTP expires in a few minutes—request again if needed."
                    : loginMode === "password"
                      ? "Secure password-based authentication."
                      : "We send a one-time code to verify your email."}
                </p>
                <button
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed ${
                    isDark
                      ? "bg-gradient-to-r from-[#8f63ff] to-[#f6d47c] text-[#0c0817] hover:brightness-110 disabled:bg-[#2f214b]"
                      : "bg-amber-500 hover:bg-amber-400 disabled:bg-amber-200"
                  }`}
                  onClick={
                    stage === "otp"
                      ? handleVerifyOtp
                      : loginMode === "password"
                        ? handlePasswordLogin
                        : handleSendOtp
                  }
                  disabled={
                    loading ||
                    (stage === "otp"
                      ? !email || otp.length !== 6
                      : loginMode === "password"
                        ? !email || !password
                        : !email)
                  }
                >
                  {loading
                    ? "Working..."
                    : stage === "otp"
                      ? "Verify & Enter"
                      : loginMode === "password"
                        ? "Sign In"
                        : "Send OTP"}
                </button>
              </div>

              {/* Toggle between password and OTP mode */}
              {stage !== "otp" && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode(loginMode === "password" ? "otp" : "password");
                      setError(null);
                      setMessage(null);
                    }}
                    className={`text-xs font-medium underline ${textMuted} hover:${textStrong} transition`}
                  >
                    {loginMode === "password" ? "Sign up" : "Back to login"}
                  </button>
                </div>
              )}

              {message && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    isDark
                      ? "border-[#3fbf9c]/30 bg-[#0f2f25]/80 text-[#b5f5e6]"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {message}
                </div>
              )}
              {error && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    isDark
                      ? "border-[#ff7b95]/30 bg-[#3a0d1d]/80 text-[#ffc2d2]"
                      : "border-rose-100 bg-rose-50 text-rose-700"
                  }`}
                >
                  {error}
                </div>
              )}
              {debugCode && (
                <div className={`text-xs ${textMuted}`}>
                  Dev-only OTP: <span className="font-semibold">{debugCode}</span>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard content (sidebar is handled by AppShell)
  return (
    <div className={`relative min-h-screen ${pageBackground} transition-colors duration-300 p-6 lg:p-10`}>
      <div className="grid gap-6 lg:grid-cols-[60%_40%]">
        {/* Main content */}
        <div className="space-y-6">
          {/* Sentinel Mirror */}
          <div className={`rounded-2xl border p-5 ${panelCard}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] ${textMuted}`}>Sentinel Mirror</p>
                <h4 className={`text-lg font-semibold ${textStrong}`}>
                  Drafting an email or feedback? Check for bias first.
                </h4>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isDark
                    ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff]"
                    : "border border-amber-100 bg-amber-50 text-amber-800"
                }`}
              >
                Quick check
              </span>
            </div>
            <textarea
              value={sentinelText}
              onChange={(e) => setSentinelText(e.target.value)}
              placeholder="Paste your draft to flag apologetic tone or microaggressions..."
              className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                isDark
                  ? "border-[#9b65ff]/30 bg-[#1b1430] text-[#f5ecff] placeholder:text-[#cbb8f5]/70 focus:border-[#9b65ff] focus:ring-2 focus:ring-[#7c5ae6]/40"
                  : "border-slate-200 bg-white placeholder:text-slate-400 focus:border-amber-200 focus:ring-2 focus:ring-amber-100"
              }`}
              rows={4}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className={`text-xs ${textMuted}`}>
                Uses Perspective-style guardrails to catch minimizing language.
              </p>
              <button
                onClick={handleSentinelCheck}
                disabled={!sentinelText || sentinelLoading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed ${
                  isDark
                    ? "bg-gradient-to-r from-[#8f63ff] to-[#f6d47c] text-[#0c0817] hover:brightness-110 disabled:bg-[#2f214b]"
                    : "bg-amber-500 hover:bg-amber-400 disabled:bg-amber-200"
                }`}
              >
                {sentinelLoading ? "Checking..." : "Check tone"}
              </button>
            </div>
            {sentinelResult && (
              <div
                className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-[#3fbf9c]/30 bg-[#0f2f25]/80 text-[#b5f5e6]"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
                }`}
              >
                {sentinelResult}
              </div>
            )}
          </div>

          {/* Community Pulse */}
          <div className={`rounded-2xl border p-5 ${panelCard}`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-lg font-semibold ${textStrong}`}>Community Pulse</h4>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isDark
                    ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff]"
                    : "border border-amber-100 bg-amber-50 text-amber-800"
                }`}
              >
                Anonymous mode
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {pulsePosts.map((post) => (
                <div
                  key={`${post.channel}-${post.minutesAgo}`}
                  className={`rounded-xl border px-4 py-3 ${panelCard}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${textMuted}`}>
                      {post.channel}
                    </p>
                    <span className={`text-[11px] ${textMuted}`}>{post.minutesAgo}m ago</span>
                  </div>
                  <p className={`mt-1 text-sm ${textStrong}`}>{post.excerpt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Matches */}
          <div className={`rounded-2xl border p-5 ${panelCard}`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-lg font-semibold ${textStrong}`}>Top Team Matches for you</h4>
              <span className={`text-[11px] ${textMuted}`}>Skill & availability overlap</span>
            </div>
            <div className="mt-3 space-y-3">
              {teamMatches.map((match) => (
                <div
                  key={match.title}
                  className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${panelCard}`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${textStrong}`}>{match.title}</p>
                    <p className={`text-xs ${textMuted}`}>
                      Availability: {match.availability} · Seniority: {match.seniority}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isDark
                        ? "bg-[#0f2f25]/80 text-[#7cf5c6] border border-[#3fbf9c]/40"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}
                  >
                    {match.overlap}% match
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Ratings */}
          <div className={`rounded-2xl border p-5 ${panelCard}`}>
            <div className="flex items-center justify-between">
              <h4 className={`text-lg font-semibold ${textStrong}`}>Recently Rated Labs</h4>
              <button
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isDark
                    ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] hover:border-[#9b65ff]"
                    : "border border-amber-200 bg-white text-amber-800 hover:border-amber-300"
                }`}
              >
                Write a review
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {labRatings.map((lab) => (
                <div
                  key={lab.lab}
                  className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${panelCard}`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${textStrong}`}>{lab.lab}</p>
                    <p className={`text-xs ${textMuted}`}>Inclusivity · Safety · Comfort</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-1 ${
                        isDark ? "bg-[#0f2f25]/80 text-[#7cf5c6]" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {lab.inclusivity.toFixed(1)}★
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 ${
                        isDark ? "bg-[#0f2f25]/80 text-[#7cf5c6]" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {lab.safety.toFixed(1)}★
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 ${
                        isDark ? "bg-[#0f2f25]/80 text-[#7cf5c6]" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {lab.comfort.toFixed(1)}★
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar - Career tools */}
        <div className="space-y-6">
          {/* Resume Strength */}
          <div className={`rounded-2xl border p-5 ${panelCard}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] ${textMuted}`}>
                  Resume Optimization
                </p>
                <h4 className={`text-lg font-semibold ${textStrong}`}>Resume Strength</h4>
              </div>
              <div className="relative h-16 w-16">
                <div
                  className={`absolute inset-0 rounded-full ${isDark ? "bg-[#1b1430]" : "bg-amber-50"}`}
                />
                <div
                  className={`absolute inset-0 rounded-full border-4 ${
                    isDark ? "border-[#9b65ff]/40" : "border-amber-200"
                  }`}
                />
                <div
                  className={`absolute inset-0 rounded-full border-4 border-t-amber-400 ${
                    isDark ? "border-t-[#f6d47c]" : "border-t-amber-500"
                  }`}
                  style={{ transform: `rotate(${(resumeStrength / 100) * 270 - 135}deg)` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                  {resumeStrength}%
                </div>
              </div>
            </div>
            <p className={`mt-2 text-sm ${textMuted}`}>
              Power-Verb Injection pending. Replace &quot;assisted&quot; with &quot;architected&quot;, &quot;helped&quot; with
              &quot;led&quot;.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "bg-gradient-to-r from-[#8f63ff] to-[#f6d47c] text-[#0c0817] hover:brightness-110"
                    : "bg-amber-500 text-white hover:bg-amber-400"
                }`}
              >
                Enhance resume
              </button>
              <button
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] hover:border-[#9b65ff]"
                    : "border border-amber-200 bg-white text-amber-800 hover:border-amber-300"
                }`}
              >
                View suggestions
              </button>
            </div>
          </div>

          {/* Fair Market Range */}
          <div className={`rounded-2xl border p-5 ${panelCard}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] ${textMuted}`}>Market Value</p>
                <h4 className={`text-lg font-semibold ${textStrong}`}>Fair Market Range</h4>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isDark
                    ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff]"
                    : "border border-amber-100 bg-amber-50 text-amber-800"
                }`}
              >
                Data anchor
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className={`text-xs font-semibold ${textMuted}`}>
                CPI
                <input
                  type="number"
                  min={5}
                  max={10}
                  step={0.1}
                  value={cpi}
                  onChange={(e) => setCpi(parseFloat(e.target.value) || 0)}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    isDark
                      ? "border-[#9b65ff]/30 bg-[#1b1430] text-[#f5ecff] placeholder:text-[#cbb8f5]/70 focus:border-[#9b65ff]"
                      : "border-slate-200 bg-white placeholder:text-slate-400 focus:border-amber-200"
                  }`}
                />
              </label>
              <label className={`text-xs font-semibold ${textMuted}`}>
                Skill set
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as "junior" | "mid" | "senior")}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    isDark
                      ? "border-[#9b65ff]/30 bg-[#1b1430] text-[#f5ecff] focus:border-[#9b65ff]"
                      : "border-slate-200 bg-white focus:border-amber-200"
                  }`}
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-xl border border-dashed px-4 py-3">
              <p className={`text-sm font-semibold ${textStrong}`}>
                ₹{fairRange.low}k – ₹{fairRange.high}k / month
              </p>
              <p className={`text-xs ${textMuted}`}>
                Based on CPI, skill level, and alumnae benchmarks. Avoid underpricing.
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "bg-gradient-to-r from-[#8f63ff] to-[#f6d47c] text-[#0c0817] hover:brightness-110"
                    : "bg-amber-500 text-white hover:bg-amber-400"
                }`}
              >
                Update skills
              </button>
              <button
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "border border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] hover:border-[#9b65ff]"
                    : "border border-amber-200 bg-white text-amber-800 hover:border-amber-300"
                }`}
              >
                Save range
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
