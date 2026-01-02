import { NextResponse } from "next/server";
import { fetchProfile } from "@/lib/profileService";
import { getUser } from "@/lib/userStore";
import crypto from "crypto";

const emailRegex = /^[^\s@]+@iitk\.ac\.in$/i;

/**
 * Server-side password hashing using SHA-256.
 */
function hashPasswordServer(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

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

  const normalizedEmail = email.toLowerCase();

  // Fetch profile from Supabase
  const profile = await fetchProfile(normalizedEmail);

  if (!profile || !profile.password_hash) {
    return NextResponse.json(
      { ok: false, message: "No password set. Please use OTP login." },
      { status: 401 },
    );
  }

  // Hash submitted password and compare
  const hashedPassword = hashPasswordServer(password);

  if (hashedPassword !== profile.password_hash) {
    return NextResponse.json(
      { ok: false, message: "Invalid password." },
      { status: 401 },
    );
  }

  // Get user role from otpStore
  const user = getUser(normalizedEmail);
  const role = user?.role ?? "member";

  return NextResponse.json({
    ok: true,
    role,
    hasCompletedProfile: profile.has_completed_profile,
    pendingAdminRequest: user?.requestedAdmin ?? false,
    pendingAdminRequestAt: user?.requestedAt ?? null,
  });
}

