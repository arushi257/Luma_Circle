import { CHAT_STORAGE_BUCKET, getSupabaseClient } from "@/lib/supabaseClient";
import type { SessionUser, UserRole } from "@/lib/auth";

export type ChatLabel = "team-match" | "mentor-mesh" | "lab-hub" | "admin" | null;

export type ChatRoom = {
  id: string;
  name: string;
  label: ChatLabel;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  user_email: string;
  content: string | null;
  message_type: "text" | "file";
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  storage_path?: string | null;
  created_at: string;
};

export const CHAT_LABELS: { id: ChatLabel; name: string }[] = [
  { id: null, name: "Unlabeled" },
  { id: "team-match", name: "Team Match" },
  { id: "mentor-mesh", name: "MentorMesh" },
  { id: "lab-hub", name: "Lab Hub" },
  { id: "admin", name: "Admin" },
];

function generateInviteCode(length = 7) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function ensureProfile(user: SessionUser) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      email: user.email,
      role: (user.role ?? "member") as UserRole,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) throw error;
}

export async function listRoomsForUser(email: string, label: ChatLabel | "all" = "all") {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("user_email", email);
  if (error) throw error;

  const roomIds = (data ?? []).map((row) => row.room_id);
  if (!roomIds.length) return [];

  let query = supabase.from("rooms").select("*").in("id", roomIds).order("created_at", { ascending: false });
  if (label !== "all") {
    if (label === null) {
      query = query.is("label", null);
    } else {
      query = query.eq("label", label);
    }
  }

  const { data: rooms, error: roomsError } = await query;
  if (roomsError) throw roomsError;

  return (rooms ?? []) as ChatRoom[];
}

export async function createRoom({
  name,
  label,
  user,
}: {
  name: string;
  label: ChatLabel;
  user: SessionUser;
}) {
  const supabase = getSupabaseClient();
  await ensureProfile(user);

  let inviteCode = generateInviteCode();
  let attempts = 0;
  let inserted: ChatRoom | null = null;

  while (!inserted && attempts < 5) {
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        name,
        label,
        invite_code: inviteCode,
        created_by: user.email,
      })
      .select()
      .single();

    if (!error) {
      inserted = data as ChatRoom;
      break;
    }

    if (error.code === "23505") {
      inviteCode = generateInviteCode();
      attempts += 1;
      continue;
    }

    throw error;
  }

  if (!inserted) {
    throw new Error("Could not generate a unique invite code. Please try again.");
  }

  const memberError = await addMemberToRoom(user.email, inserted.id);
  if (memberError) throw memberError;

  return inserted;
}

export async function addMemberToRoom(email: string, roomId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("room_members").upsert(
    {
      room_id: roomId,
      user_email: email,
    },
    { onConflict: "room_id,user_email" },
  );
  return error;
}

export async function joinRoomByCode({ code, user }: { code: string; user: SessionUser }) {
  const supabase = getSupabaseClient();
  await ensureProfile(user);

  const trimmed = code.trim().toUpperCase();
  const { data, error } = await supabase.from("rooms").select("*").eq("invite_code", trimmed).single();
  if (error) throw error;
  if (!data) throw new Error("Room not found for that code.");

  const memberError = await addMemberToRoom(user.email, data.id);
  if (memberError) throw memberError;

  return data as ChatRoom;
}

export async function fetchMessages(roomId: string, { limit = 50 } = {}) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendTextMessage({
  roomId,
  content,
  user,
}: {
  roomId: string;
  content: string;
  user: SessionUser;
}) {
  const supabase = getSupabaseClient();
  await ensureProfile(user);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      user_email: user.email,
      content,
      message_type: "text",
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatMessage;
}

export async function uploadAttachment({
  file,
  roomId,
}: {
  file: File;
  roomId: string;
}) {
  const supabase = getSupabaseClient();
  const path = `${roomId}/${Date.now()}-${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(CHAT_STORAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(CHAT_STORAGE_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function sendFileMessage({
  roomId,
  fileMeta,
  user,
}: {
  roomId: string;
  fileMeta: { url: string; name: string; type: string; size: number; path: string };
  user: SessionUser;
}) {
  const supabase = getSupabaseClient();
  await ensureProfile(user);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      user_email: user.email,
      content: fileMeta.url,
      message_type: "file",
      file_url: fileMeta.url,
      file_name: fileMeta.name,
      file_type: fileMeta.type,
      file_size: fileMeta.size,
      storage_path: fileMeta.path,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatMessage;
}

export function subscribeToRoomMessages(roomId: string, onInsert: (payload: ChatMessage) => void) {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const record = payload.new as ChatMessage;
        onInsert(record);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

