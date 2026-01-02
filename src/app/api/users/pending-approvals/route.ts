import { NextResponse } from "next/server";
import { getUser, listPendingAdminRequests } from "@/lib/userStore";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { adminEmail } = await request.json();

  if (!adminEmail || typeof adminEmail !== "string" || !emailRegex.test(adminEmail)) {
    return NextResponse.json(
      { ok: false, message: "Valid admin email is required." },
      { status: 400 },
    );
  }

  const normalizedAdminEmail = adminEmail.toLowerCase();
  const adminRecord = getUser(normalizedAdminEmail);

  if (!adminRecord || adminRecord.role !== "admin") {
    return NextResponse.json(
      { ok: false, message: "Admin privileges required." },
      { status: 403 },
    );
  }

  const pending = listPendingAdminRequests();

  return NextResponse.json({
    ok: true,
    pending,
  });
}

