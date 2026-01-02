import { getSupabaseClient } from "./supabaseClient";

export type UserProfile = {
  email: string;
  name: string | null;
  username: string | null;
  password_hash: string | null;
  has_completed_profile: boolean;
  created_at?: string;
  updated_at?: string;
};

/**
 * Hash a password using SHA-256 (client-side hashing for storage).
 * Note: This is a simple hash for demo purposes. Production should use bcrypt/argon2 server-side.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Fetch a user's profile from Supabase by email.
 */
export async function fetchProfile(email: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as UserProfile | null;
}

/**
 * Create or update a user's profile in Supabase.
 */
export async function upsertProfile(profile: {
  email: string;
  name: string;
  username: string;
  passwordHash?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  const payload: Partial<UserProfile> = {
    email: profile.email,
    name: profile.name,
    username: profile.username,
    has_completed_profile: true,
  };

  if (profile.passwordHash) {
    payload.password_hash = profile.passwordHash;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "email" });

  if (error) {
    console.error("Error upserting profile:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Check if a user has completed their profile setup.
 */
export async function checkProfileComplete(email: string): Promise<boolean> {
  const profile = await fetchProfile(email);
  return profile?.has_completed_profile ?? false;
}

/**
 * Check if a username is already taken by another user.
 */
export async function isUsernameTaken(username: string, currentEmail: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", username)
    .neq("email", currentEmail)
    .maybeSingle();

  if (error) {
    console.error("Error checking username:", error);
    return false;
  }

  return data !== null;
}

