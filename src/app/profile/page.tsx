"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClientSession } from "@/lib/auth"; // Ensure this path is correct for your project
import { useTheme } from "@/context/ThemeContext"; // Ensure this path is correct
import { fetchProfile, isUsernameTaken, upsertProfile, updateUserPassword } from "@/lib/profileService"; // Ensure these functions are implemented

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

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSetupMode = searchParams.get("mode") === "setup";

  useEffect(() => {
    if (!ready || !session) return;

    async function loadProfile() {
      if (!session) return;
      try {
        const profile = await fetchProfile(session.email);
        if (profile) {
          setName(profile.name || "");
          setUsername(profile.username || "");
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

    // --- Validation ---
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (isSetupMode && !password.trim()) {
      setError("Password is required for initial setup.");
      return;
    }

    setSaving(true);

    try {
      // 1. Check if Username is Taken
      if (username.trim()) {
        const taken = await isUsernameTaken(username.trim(), session.email);
        if (taken) {
          throw new Error("Username is already taken. Please choose another.");
        }
      }

      // 2. Update Password (if provided)
      if (password.trim()) {
        const passResult = await updateUserPassword(password);
        if (!passResult.ok) {
          throw new Error(passResult.error || "Failed to update password.");
        }
      }

      // 3. Update Profile Data in Supabase
      const profileResult = await upsertProfile({
        email: session.email,
        name: name.trim(),
        username: username.trim(),
      });

      if (!profileResult.ok) {
        throw new Error(profileResult.error || "Failed to save profile.");
      }

      // Success
      setMessage("Profile saved successfully!");
      setPassword(""); // Clear password for security

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
        {/* Profile Section */}
        <div className={`rounded-xl border p-8 ${panelCard}`}>
          <h1 className="mb-6 text-2xl font-semibold">
            {isSetupMode ? "Complete Your Profile" : "Profile"}
          </h1>

          {isSetupMode && (
            <p className={`mb-6 text-sm ${textMuted}`}>
              Please complete your profile to continue. This is a one-time setup.
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
            </div>

            {/* Name */}
            <div>
              <label className={`block text-sm font-medium ${labelText}`}>
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={`mt-1 w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-1 ${inputStyle}`}
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className={`block text-sm font-medium ${labelText}`}>
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a unique username"
                className={`mt-1 w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-1 ${inputStyle}`}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium ${labelText}`}>
                Password {isSetupMode && <span className="text-red-400">*</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSetupMode ? "Create a password" : "Leave blank to keep current"}
                className={`mt-1 w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-1 ${inputStyle}`}
                required={isSetupMode}
              />
              {!isSetupMode && (
                <p className={`mt-1 text-xs ${textMuted}`}>
                  Enter a new password only if you want to change it
                </p>
              )}
            </div>

            {/* Messages */}
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

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full rounded-full border px-6 py-3 font-semibold transition disabled:opacity-50 ${buttonPrimary}`}
            >
              {saving ? "Saving..." : isSetupMode ? "Complete Setup" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Settings Section (placeholder) */}
        {!isSetupMode && (
          <div className={`rounded-xl border p-8 ${panelCard}`}>
            <h2 className="mb-4 text-xl font-semibold">Settings</h2>
            <p className={`text-sm ${textMuted}`}>Settings options will appear here.</p>
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