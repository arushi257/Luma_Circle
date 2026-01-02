export type Role = "member" | "admin";

type UserRecord = {
  role: Role;
  requestedAdmin?: boolean;
  requestedAt?: number;
  approvedBy?: string;
};

const users = new Map<string, UserRecord>();

export type PendingAdminRequest = {
  email: string;
  requestedAt: number;
};

export function ensureUser(email: string, shouldSeedAdmin: boolean) {
  let record = users.get(email);
  if (!record) {
    record = {
      role: shouldSeedAdmin ? "admin" : "member",
    };
    users.set(email, record);
    return record;
  }

  if (shouldSeedAdmin && record.role !== "admin") {
    record.role = "admin";
  }

  return record;
}

export function getUser(email: string) {
  return users.get(email);
}

export function createAdminRequest(email: string) {
  const record = users.get(email);
  if (!record) {
    return { ok: false, message: "User must verify first." };
  }
  if (record.role === "admin") {
    return { ok: false, message: "Already an admin." };
  }
  if (record.requestedAdmin) {
    return {
      ok: true,
      alreadyRequested: true,
      requestedAt: record.requestedAt,
    };
  }

  const requestedAt = Date.now();
  record.requestedAdmin = true;
  record.requestedAt = requestedAt;

  return { ok: true, requestedAt };
}

export function listPendingAdminRequests(): PendingAdminRequest[] {
  const pending: PendingAdminRequest[] = [];
  for (const [email, record] of users.entries()) {
    if (record.requestedAdmin && record.role === "member") {
      pending.push({
        email,
        requestedAt: record.requestedAt ?? Date.now(),
      });
    }
  }
  return pending;
}

export function approveAdmin(targetEmail: string, approvedBy: string) {
  const target = users.get(targetEmail);
  if (!target) {
    return { ok: false, message: "Target user not found." };
  }
  if (!target.requestedAdmin) {
    return { ok: false, message: "No pending admin request for this user." };
  }

  target.role = "admin";
  target.requestedAdmin = false;
  target.requestedAt = undefined;
  target.approvedBy = approvedBy;

  return { ok: true };
}

