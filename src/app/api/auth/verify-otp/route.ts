import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpStore";

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

  const cookieStore = await cookies();
  const otpToken = cookieStore.get("otp_token")?.value;
  const result = verifyOtp(email.toLowerCase(), code.trim(), otpToken);

  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "OTP expired. Please request a new one."
        : "Invalid OTP. Try again.";

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    role: result.role,
    pendingAdminRequest: result.pendingAdminRequest,
    pendingAdminRequestAt: result.pendingAdminRequestAt ?? null,
  });

  response.cookies.delete("otp_token");
  return response;
}

