import crypto from "node:crypto";
import { ensureUser } from "@/lib/userStore";

type OtpPayload = {
  email: string;
  code: string;
  exp: number;
};

export const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_SECRET = process.env.OTP_SECRET || "dev-otp-secret";

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);
const adminDomain = process.env.ADMIN_DOMAIN?.trim().toLowerCase();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signOtp(payload: OtpPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", OTP_SECRET).update(body).digest();
  const signature = Buffer.from(hmac).toString("base64url");
  return `${body}.${signature}`;
}

function verifySignedOtp(token: string | undefined): OtpPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = crypto.createHmac("sha256", OTP_SECRET).update(body).digest();
  const provided = Buffer.from(signature, "base64url");

  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OtpPayload;
    return payload;
  } catch {
    return null;
  }
}

export function issueOtp(email: string) {
  const code = generateCode();
  const expiresAt = Date.now() + OTP_TTL_MS;
  const token = signOtp({ email, code, exp: expiresAt });
  return { code, token, expiresAt };
}

export function verifyOtp(email: string, code: string, token?: string) {
  const payload = verifySignedOtp(token);
  if (!payload) return { ok: false as const, reason: "not-found" as const };

  if (Date.now() > payload.exp) {
    return { ok: false as const, reason: "expired" as const };
  }

  if (payload.email !== email || payload.code !== code) {
    return { ok: false as const, reason: "mismatch" as const };
  }

  const normalized = email.toLowerCase();
  const isAdminExplicit = adminEmails.includes(normalized);
  const isAdminDomain = adminDomain
    ? normalized.endsWith(`@${adminDomain}`)
    : false;
  const user = ensureUser(normalized, isAdminExplicit || isAdminDomain);

  return {
    ok: true as const,
    role: user.role,
    pendingAdminRequest: Boolean(user.requestedAdmin),
    pendingAdminRequestAt: user.requestedAt ?? null,
  };
}

