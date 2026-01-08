import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const emailRegex = /^[^\s@]+@iitk\.ac\.in$/i;

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // 1. Validation
  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Please use your IITK email (…@iitk.ac.in)." },
      { status: 400 },
    );
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { ok: false, message: "Password is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // 2. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password: password,
  });

  if (authError) {
    return NextResponse.json(
      { ok: false, message: "Invalid email or password." },
      { status: 401 },
    );
  }

  // 3. Fetch additional profile info (Role, Admin requests, etc.)
  // Assumes you have a 'profiles' table linked to auth.users
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, has_completed_profile, requested_admin, requested_at")
    .eq("id", authData.user.id) // Use the User ID from auth, not email
    .single();

  return NextResponse.json({
    ok: true,
    role: profile?.role ?? "member",
    hasCompletedProfile: profile?.has_completed_profile ?? false,
    pendingAdminRequest: profile?.requested_admin ?? false,
    pendingAdminRequestAt: profile?.requested_at ?? null,
  });
}