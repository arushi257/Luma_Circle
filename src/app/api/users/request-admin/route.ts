import { NextResponse } from "next/server";
import { createAdminRequest } from "@/lib/userStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const normalized = email.toLowerCase();
  const result = createAdminRequest(normalized);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message ?? "Cannot request admin access." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    requestedAt: result.requestedAt ?? null,
    alreadyRequested: Boolean(result.alreadyRequested),
  });
}

