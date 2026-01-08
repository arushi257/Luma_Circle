import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// Fetch profile data
export async function fetchProfile(email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, username")
    .eq("email", email)
    .single();

  if (error) {
    // console.log(error); // Uncomment for debugging
    return null;
  }
  return data;
}

// Check if username exists (excluding the current user)
export async function isUsernameTaken(username: string, currentEmail: string) {
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", username)
    .neq("email", currentEmail) 
    .single();

  return !!data; // Returns true if username is taken
}

// Update Profile Data
export async function upsertProfile(data: { 
  email: string; 
  name: string; 
  username: string 
}) {
  const { error } = await supabase
    .from("profiles")
    .update({ 
      name: data.name, 
      username: data.username,
      has_completed_profile: true
    })
    .eq("email", data.email);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Update Password (uses Supabase Auth)
export async function updateUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}