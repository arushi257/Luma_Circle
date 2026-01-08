import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { ok: false, message: "Email is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const normalizedEmail = email.toLowerCase();

  // Query the 'profiles' table in Supabase
  // We assume 'email' is a column in your public.profiles table
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("has_completed_profile")
    .eq("email", normalizedEmail)
    .single();

  // If no profile is found, the user doesn't exist
  if (error || !profile) {
    return NextResponse.json({
      ok: true,
      exists: false,
      hasCompletedProfile: false,
    });
  }

  return NextResponse.json({
    ok: true,
    exists: true,
    hasCompletedProfile: profile.has_completed_profile ?? false,
  });
}