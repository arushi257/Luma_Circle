import { NextResponse } from "next/server";
import { fetchProfile } from "@/lib/profileService";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { ok: false, message: "Email is required." },
      { status: 400 },
    );
  }

  const profile = await fetchProfile(email.toLowerCase());

  return NextResponse.json({
    ok: true,
    exists: profile !== null,
    hasCompletedProfile: profile?.has_completed_profile ?? false,
  });
}

