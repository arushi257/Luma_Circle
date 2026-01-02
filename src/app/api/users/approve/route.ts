import { NextResponse } from "next/server";
import { approveAdmin, getUser } from "@/lib/userStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { adminEmail, targetEmail } = await request.json();

  if (!adminEmail || typeof adminEmail !== "string" || !emailRegex.test(adminEmail)) {
    return NextResponse.json(
      { ok: false, message: "Valid admin email is required." },
      { status: 400 },
    );
  }

  if (!targetEmail || typeof targetEmail !== "string" || !emailRegex.test(targetEmail)) {
    return NextResponse.json(
      { ok: false, message: "Valid user email is required." },
      { status: 400 },
    );
  }

  const normalizedAdmin = adminEmail.toLowerCase();
  const adminRecord = getUser(normalizedAdmin);

  if (!adminRecord || adminRecord.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Admin privileges required." },
      { status: 403 },
    );
  }

  const normalizedTarget = targetEmail.toLowerCase();
  const result = approveAdmin(normalizedTarget, normalizedAdmin);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message ?? "Cannot approve this user." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

