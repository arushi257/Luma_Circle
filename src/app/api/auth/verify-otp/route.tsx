import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const emailRegex = /^[^\s@]+@iitk\.ac\.in$/i;

export async function POST(request: Request) {
  const { email, code } = await request.json();

  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Please use your IITK email (…@iitk.ac.in)." },
      { status: 400 },
    );
  }

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { ok: false, message: "OTP code is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Verify the OTP
  const { data: authData, error: authError } = await supabase.auth.verifyOtp({
    email: email.toLowerCase(),
    token: code.trim(),
    type: "email",
  });

  if (authError) {
    return NextResponse.json(
      { ok: false, message: "Invalid or expired OTP." },
      { status: 400 },
    );
  }

  // Fetch Profile Data after successful verification
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, requested_admin, requested_at")
    .eq("id", authData.user?.id)
    .single();

  return NextResponse.json({
    ok: true,
    role: profile?.role ?? "member",
    pendingAdminRequest: profile?.requested_admin ?? false,
    pendingAdminRequestAt: profile?.requested_at ?? null,
  });
}