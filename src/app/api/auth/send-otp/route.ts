import { NextResponse } from "next/server";
import { issueOtp, OTP_TTL_MS } from "@/lib/otpStore";

const emailRegex = /^[^\s@]+@iitk\.ac\.in$/i;

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Please use your IITK email (…@iitk.ac.in)." },
      { status: 400 },
    );
  }

  const { code, token, expiresAt } = issueOtp(email.toLowerCase());

  // In production, send via email/SMS provider. Expose in dev for testing.
  const payload: Record<string, unknown> = { ok: true };
  if (process.env.NODE_ENV !== "production") {
    payload.debugCode = code;
  }

  const response = NextResponse.json(payload, { status: 200 });
  response.cookies.set("otp_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.round(OTP_TTL_MS / 1000),
    expires: new Date(expiresAt),
  });

  return response;
}

