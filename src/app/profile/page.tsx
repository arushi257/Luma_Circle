"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClientSession } from "@/lib/auth";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/utils/supabase/client";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, ready } = useClientSession({ require: true });
  const { isDark } = useTheme();

  // Styles
  const pageBackground = isDark
    ? "bg-[radial-gradient(circle_at_20%_20%,#2f184d_0%,#130c26_45%,#05030d_100%)] text-[#f4edff]"
    : "bg-gradient-to-br from-[#fdf3e8] via-[#f8e7ff] to-[#ffe4d1] text-slate-900";
  const panelCard = isDark
    ? "border-[#9b65ff]/30 bg-[rgba(20,12,34,0.82)] shadow-xl shadow-[#8f63ff]/20"
    : "border-amber-100 bg-white/90 shadow-xl shadow-amber-100/40";
  const labelText = isDark ? "text-[#e9defa]" : "text-slate-800";
  const textMuted = isDark ? "text-[#cbb8f5]" : "text-slate-500";
  const inputStyle = isDark
    ? "border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] placeholder-[#9b65ff]/50 focus:border-[#9b65ff] focus:ring-[#9b65ff]"
    : "border-amber-200 bg-white text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:ring-amber-400";
  const inputDisabled = isDark
    ? "border-[#9b65ff]/40 bg-[#1f1433]/60 text-[#f5e6ff] opacity-60"
    : "border-amber-200 bg-amber-50 text-slate-700 opacity-60";
  const buttonPrimary = isDark
    ? "border-[#9b65ff]/40 bg-[#7c3aed] text-white shadow-lg shadow-[#8f63ff]/40 hover:bg-[#6d28d9] hover:shadow-[#8f63ff]/50"
    : "border-amber-300 bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-400";

  // 1. UPDATED STATE NAMES
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSetupMode = searchParams.get("mode") === "setup";

  useEffect(() => {
    if (!ready || !session) return;

    async function loadProfile() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("profiles")
          // 2. UPDATED SELECT QUERY: Asking for the new column names
          .select("full_name, user_name") 
          .eq("email", session?.email)
          .single();

        if (error && error.code !== "PGRST116") {
           console.error("Error loading profile:", error);
        }

        if (data) {
          // 3. UPDATED MAPPING: Using the new keys from data
          setFullName(data.full_name || "");
          setUserName(data.user_name || "");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [ready, session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!session) return;

    if (!fullName.trim()) {
      setError("Name is required.");
      return;
    }

    if (!userName.trim()) {
      setError("Username is required.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      // 4. UPDATED SAVE: Using .update() and the new column names
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          user_name: userName.trim(),
        })
        .eq("email", session.email);

      if (updateError) {
        if (updateError.code === "23505") {
             throw new Error("This username is already taken.");
        }
        throw new Error(updateError.message || "Failed to save profile.");
      }

      setMessage("Profile saved successfully!");

      if (isSetupMode) {
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${pageBackground}`}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 py-12 transition-colors duration-300 ${pageBackground}`}>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className={`rounded-xl border p-8 ${panelCard}`}>
          <h1 className="mb-6 text-2xl font-semibold">
            {isSetupMode ? "Complete Your Profile" : "Profile"}
          </h1>

          {isSetupMode && (
            <p className={`mb-6 text-sm ${textMuted}`}>
              Please set your display name and username to continue.
            </p>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Email (readonly) */}
            <div>
              <label className={`block text-sm font-medium ${labelText}`}>Email</label>
              <input
                type="email"
                value={session?.email || ""}
                disabled
                className={`mt-1 w-full rounded-md border px-4 py-2 ${inputDisabled}`}
              />
              <p className={`mt-1 text-xs ${textMuted}`}>Managed by Institutional Login</p>
            </div>

            {/* Name Input */}
            <div>
              <label className={`block text-sm font-medium ${labelText}`}>
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName} // Updated state
                onChange={(e) => setFullName(e.target.value)} // Updated setter
                placeholder="Enter your full name"
                className={`mt-1 w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-1 ${inputStyle}`}
                required
              />
            </div>

            {/* Username Input */}
            <div>
              <label className={`block text-sm font-medium ${labelText}`}>
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={userName} // Updated state
                onChange={(e) => setUserName(e.target.value)} // Updated setter
                placeholder="Choose a unique username"
                className={`mt-1 w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-1 ${inputStyle}`}
                required
              />
              <p className={`mt-1 text-xs ${textMuted}`}>This will be visible in chats.</p>
            </div>

            {error && (
              <div className={`rounded-md border px-4 py-2 text-sm ${isDark ? "border-red-400/30 bg-red-900/20 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                {error}
              </div>
            )}

            {message && (
              <div className={`rounded-md border px-4 py-2 text-sm ${isDark ? "border-green-400/30 bg-green-900/20 text-green-300" : "border-green-200 bg-green-50 text-green-700"}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`w-full rounded-full border px-6 py-3 font-semibold transition disabled:opacity-50 ${buttonPrimary}`}
            >
              {saving ? "Saving..." : isSetupMode ? "Complete Setup" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Account Management */}
        {!isSetupMode && (
          <div className={`rounded-xl border p-8 ${panelCard}`}>
            <h2 className={`mb-4 text-xl font-semibold ${labelText}`}>Account Security</h2>
            <p className={`mb-4 text-sm ${textMuted}`}>
              Need to change your password? We will send you an email link.
            </p>
            <button
              onClick={async () => {
                const supabase = createClient();
                const { error } = await supabase.auth.resetPasswordForEmail(session!.email, {
                    redirectTo: `${window.location.origin}/profile?mode=reset`,
                });
                if (error) alert(error.message);
                else alert("Password reset email sent! Check your inbox.");
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                 isDark ? "border-white/20 hover:bg-white/10" : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              Send Password Reset Email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileFallback() {
  const { isDark } = useTheme();
  const bg = isDark
    ? "bg-[radial-gradient(circle_at_20%_20%,#2f184d_0%,#130c26_45%,#05030d_100%)] text-[#f4edff]"
    : "bg-gradient-to-br from-[#fdf3e8] via-[#f8e7ff] to-[#ffe4d1] text-slate-900";
  return (
    <div className={`flex min-h-screen items-center justify-center ${bg}`}>
      <p>Loading profile...</p>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileContent />
    </Suspense>
  );
}