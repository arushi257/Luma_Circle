/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useClientSession } from "@/lib/auth";
import { useTheme } from "@/context/ThemeContext";
import {
  CHAT_LABELS,
  type ChatLabel,
  type ChatMessage,
  type ChatRoom,
  createRoom,
  fetchMessages,
  joinRoomByCode,
  listRoomsForUser,
  sendFileMessage,
  sendTextMessage,
  subscribeToRoomMessages,
  uploadAttachment,
} from "@/lib/chatService";
import { MessageItem } from "@/components/chat/MessageItem";
import { RoomList } from "@/components/chat/RoomList";

type SectionKey = ChatLabel | "all";

const SECTION_TABS: { id: SectionKey; label: string; description: string }[] = [
  { id: "all", label: "All chats", description: "Everything you’ve joined" },
  { id: "team-match", label: "Team Match", description: "Project & team rooms" },
  { id: "mentor-mesh", label: "MentorMesh", description: "Mentor/mentee rooms" },
  { id: "lab-hub", label: "Lab Hub", description: "Lab & research rooms" },
];

const MAX_MESSAGE_LEN = 800;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function labelName(label: ChatLabel) {
  return CHAT_LABELS.find((item) => item.id === label)?.name ?? "Unlabeled";
}

function SafeSpaceContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session, ready } = useClientSession({ require: true, redirectTo: "/" });
  const [section, setSection] = useState<SectionKey>("all");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [sidebarSuccess, setSidebarSuccess] = useState<string | null>(null);
  const [sidebarError, setSidebarError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createForm, setCreateForm] = useState<{ name: string; label: ChatLabel }>({ name: "", label: null });
  const [joinCode, setJoinCode] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { isDark } = useTheme();

  const pageBackground = isDark
    ? "bg-[radial-gradient(circle_at_20%_20%,#2f184d_0%,#130c26_45%,#05030d_100%)] text-[#f4edff]"
    : "bg-gradient-to-br from-[#fdf3e8] via-[#f8e7ff] to-[#ffe4d1] text-slate-900";
  const panelCard = isDark
    ? "border-[#9b65ff]/20 bg-[rgba(20,12,34,0.72)] shadow-lg shadow-[#8f63ff]/15"
    : "border-amber-100 bg-white/90 shadow-lg shadow-amber-100/40";
  const labelText = isDark ? "text-[#e9defa]" : "text-slate-800";
  const textMuted = isDark ? "text-[#cbb8f5]" : "text-slate-500";
  const textStrong = isDark ? "text-white" : "text-slate-900";
  const inputStyle = isDark
    ? "border-[#9b65ff]/30 bg-[#1b1430] text-[#f5ecff] focus:border-[#9b65ff]"
    : "border-amber-100 bg-white text-slate-900 focus:border-amber-300";
  const buttonPrimary = isDark
    ? "bg-gradient-to-r from-[#8f63ff] to-[#f6d47c] text-[#0c0817]"
    : "bg-amber-500 text-white hover:bg-amber-400";
  const buttonSecondary = isDark
    ? "bg-[#1f1433] text-[#f5e6ff] ring-1 ring-[#9b65ff]/50 hover:bg-[#2a1b44]"
    : "bg-white text-amber-800 ring-1 ring-amber-200 hover:ring-amber-300";
  const pillStyle = isDark
    ? "border-[#9b65ff]/40 bg-[#1f1433]/80 text-[#f5e6ff] shadow-sm shadow-[#8f63ff]/30"
    : "border-amber-200 bg-white/90 text-amber-800 shadow-sm";
  const headerBorder = isDark ? "border-[#2d1a44]" : "border-amber-100";
  const tabActive = isDark
    ? "border-[#9b65ff]/60 bg-[#1f1433]/90 text-[#f4edff] shadow-inner shadow-[#8f63ff]/30"
    : "border-amber-300 bg-amber-50 text-amber-900";
  const tabInactive = isDark
    ? "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
    : "border-amber-100 bg-white/50 text-slate-700 hover:border-amber-200 hover:bg-amber-50";
  const messageBg = isDark ? "bg-[#0e0a1a]/70" : "bg-white/70";
  const errorStyle = isDark
    ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
    : "border-rose-200 bg-rose-50 text-rose-700";
  const successStyle = isDark
    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const subtleBg = isDark ? "border-white/10 bg-white/5" : "border-amber-100 bg-amber-50/50";

  useEffect(() => {
    const param = searchParams?.get("section");
    const allowed: SectionKey[] = ["all", "team-match", "mentor-mesh", "lab-hub"];
    if (param && allowed.includes(param as SectionKey)) {
      setSection(param as SectionKey);
    } else {
      setSection("all");
    }
  }, [searchParams]);

  const filteredRooms = useMemo(() => {
    if (section === "all") return rooms;
    return rooms.filter((room) => room.label === section);
  }, [rooms, section]);

  useEffect(() => {
    if (!ready || !session) return;
    const loadRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const data = await listRoomsForUser(session.email, "all");
        setRooms(data);
        if (!selectedRoomId && data.length) {
          setSelectedRoomId(data[0].id);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load chats.";
        setRoomsError(message);
      } finally {
        setRoomsLoading(false);
      }
    };
    loadRooms();
  }, [ready, session]);

  useEffect(() => {
    if (!selectedRoomId) return;
    if (!filteredRooms.find((room) => room.id === selectedRoomId)) {
      const next = filteredRooms[0]?.id ?? null;
      setSelectedRoomId(next);
    }
  }, [filteredRooms, selectedRoomId]);

  useEffect(() => {
    if (!session || !selectedRoomId) {
      setMessages([]);
      return undefined;
    }

    let unsub: (() => void) | undefined;
    const loadMessages = async () => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const data = await fetchMessages(selectedRoomId);
        setMessages(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load messages.";
        setMessagesError(message);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
    unsub = subscribeToRoomMessages(selectedRoomId, (incoming) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    });

    return () => {
      if (unsub) unsub();
    };
  }, [session, selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateRoom = async () => {
    if (!session) return;
    if (!createForm.name.trim()) {
      setSidebarError("Room name is required.");
      return;
    }

    setCreating(true);
    setSidebarError(null);
    setSidebarSuccess(null);
    try {
      const room = await createRoom({
        name: createForm.name.trim(),
        label: createForm.label,
        user: session,
      });
      setRooms((prev) => {
        const withoutDupes = prev.filter((r) => r.id !== room.id);
        return [room, ...withoutDupes];
      });
      setSelectedRoomId(room.id);
      setSection(room.label ?? "all");
      setCreateForm({ name: "", label: null });
      setSidebarSuccess(`Created "${room.name}". Share code ${room.invite_code} to invite others.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create chat.";
      setSidebarError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!session) return;
    if (!joinCode.trim()) {
      setSidebarError("Enter an invite code.");
      return;
    }
    setJoining(true);
    setSidebarError(null);
    setSidebarSuccess(null);
    try {
      const room = await joinRoomByCode({ code: joinCode, user: session });
      setRooms((prev) => {
        const withoutDupes = prev.filter((r) => r.id !== room.id);
        return [room as ChatRoom, ...withoutDupes];
      });
      setSelectedRoomId(room.id);
      setSection(room.label ?? "all");
      setJoinCode("");
      setSidebarSuccess(`Joined "${room.name}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not join chat.";
      setSidebarError(message);
    } finally {
      setJoining(false);
    }
  };

  const handleSend = async () => {
    if (!session || !selectedRoomId) return;
    if (!composer.trim() && !pendingFile) {
      setMessagesError("Type a message or attach a file.");
      return;
    }
    if (composer.trim().length > MAX_MESSAGE_LEN) {
      setMessagesError(`Messages must be under ${MAX_MESSAGE_LEN} characters.`);
      return;
    }

    setSending(true);
    setMessagesError(null);
    try {
      if (pendingFile) {
        if (pendingFile.size > MAX_FILE_BYTES) {
          throw new Error("File must be under 10MB.");
        }
        const upload = await uploadAttachment({ file: pendingFile, roomId: selectedRoomId });
        const sentFile = await sendFileMessage({
          roomId: selectedRoomId,
          user: session,
          fileMeta: {
            url: upload.publicUrl,
            name: pendingFile.name,
            type: pendingFile.type || "application/octet-stream",
            size: pendingFile.size,
            path: upload.path,
          },
        });
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentFile.id)) return prev;
          return [...prev, sentFile];
        });
        setPendingFile(null);
      }

      if (composer.trim()) {
        const sent = await sendTextMessage({
          roomId: selectedRoomId,
          content: composer.trim(),
          user: session,
        });
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        setComposer("");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send message.";
      setMessagesError(message);
    } finally {
      setSending(false);
    }
  };

  if (!ready) {
    return (
      <div className={`min-h-screen ${pageBackground}`}>
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-6 py-12 lg:px-10">
          <div className={`rounded-2xl border p-8 ${panelCard}`}>
            <p className="text-sm font-semibold text-white/70">Loading session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // redirected by useClientSession
  }

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${pageBackground}`}>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10 px-6 py-12 lg:px-10">
        <header className={`flex flex-col gap-2 border-b pb-4 ${headerBorder}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${textMuted}`}>Community</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className={`text-3xl font-bold ${textStrong}`}>Safe Space · Realtime Chat</h1>
            <div className={`rounded-full border px-4 py-2 text-xs font-semibold ${pillStyle}`}>
              Signed in as {session.email} {session.role ? `(${session.role})` : ""}
            </div>
          </div>
          <p className={`text-sm ${textMuted}`}>
            Sections filter chats by label: Team Match, MentorMesh, or Lab Hub. Share invite codes so others can join
            instantly.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[30%_70%]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:max-h-[85vh] overflow-y-auto">
            <div className={`rounded-2xl border ${panelCard} p-5`}>
              <div>
                <p className={`text-xs uppercase tracking-[0.2em] ${textMuted}`}>Sections</p>
                <h3 className={`text-lg font-semibold ${textStrong}`}>Community chat</h3>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SECTION_TABS.map((tab) => (
                  <button
                    key={`${tab.id ?? "null"}`}
                    onClick={() => {
                      const next = tab.id;
                      setSection(next);
                      const params = new URLSearchParams(searchParams?.toString());
                      if (next === "all" || next === null) {
                        params.delete("section");
                      } else {
                        params.set("section", next);
                      }
                      const qs = params.toString();
                      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
                    }}
                    className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                      section === tab.id ? tabActive : tabInactive
                    }`}
                  >
                    <span className="block whitespace-nowrap">{tab.label}</span>
                    <p className={`mt-1 text-[11px] leading-tight ${textMuted}`}>{tab.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-semibold ${textStrong}`}>Chats</h4>
                  <span className={`text-[11px] ${textMuted}`}>{filteredRooms.length} total</span>
                </div>
                <RoomList
                  rooms={filteredRooms}
                  selectedRoomId={selectedRoomId}
                  onSelect={setSelectedRoomId}
                  loading={roomsLoading}
                  emptyLabel="No chats here yet. Create one or join with a code."
                />
                {roomsError && (
                  <div className={`rounded-xl border px-3 py-2 text-sm ${errorStyle}`}>
                    {roomsError}
                  </div>
                )}
              </div>

              <div className={`mt-6 space-y-4 rounded-2xl border p-4 ${subtleBg}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-semibold ${textStrong}`}>Create a chat</h4>
                    <span className={`text-[11px] ${textMuted}`}>Default label is Unlabeled</span>
                  </div>
                  <label className={`text-xs font-semibold ${labelText}`}>
                    Name
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${inputStyle}`}
                      placeholder="e.g. Night study group"
                    />
                  </label>
                  <label className={`text-xs font-semibold ${labelText}`}>
                    Label / section
                    <select
                      value={createForm.label ?? ""}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          label: (e.target.value || null) as ChatLabel,
                        }))
                      }
                      className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${inputStyle}`}
                    >
                      {CHAT_LABELS.filter((opt) => opt.id !== "admin").map((opt) => (
                        <option key={`${opt.id ?? "none"}`} value={opt.id ?? ""}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    onClick={handleCreateRoom}
                    disabled={creating}
                    className={`w-full rounded-xl px-3 py-2 text-sm font-semibold shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 ${buttonPrimary}`}
                  >
                    {creating ? "Creating..." : "Create chat"}
                  </button>
                </div>

                <div className={`space-y-2 border-t pt-4 ${isDark ? "border-white/10" : "border-amber-100"}`}>
                  <h4 className={`text-sm font-semibold ${textStrong}`}>Join with a code</h4>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Enter invite code"
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${inputStyle}`}
                    />
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${buttonSecondary}`}
                    >
                      {joining ? "Joining..." : "Join"}
                    </button>
                  </div>
                  <p className={`text-xs ${textMuted}`}>Shareable alphanumeric codes appear on each chat header.</p>
                </div>

                {sidebarSuccess && (
                  <div className={`rounded-xl border px-3 py-2 text-sm ${successStyle}`}>
                    {sidebarSuccess}
                  </div>
                )}
                {sidebarError && (
                  <div className={`rounded-xl border px-3 py-2 text-sm ${errorStyle}`}>
                    {sidebarError}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className={`rounded-2xl border ${panelCard} p-5`}>
            {!selectedRoom ? (
              <div className={`flex min-h-[400px] flex-col items-center justify-center text-center ${textMuted}`}>
                <p className={`text-lg font-semibold ${textStrong}`}>Pick or create a chat to get started.</p>
                <p className={`mt-2 text-sm ${textMuted}`}>
                  Use the sidebar to create a new room or join with an invite code.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col gap-4">
                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${subtleBg}`}>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.18em] ${textMuted}`}>{labelName(selectedRoom.label)}</p>
                    <h3 className={`text-xl font-bold ${textStrong}`}>{selectedRoom.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${pillStyle}`}>
                      Invite code: {selectedRoom.invite_code}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${subtleBg}`}>
                      Created by {selectedRoom.created_by}
                    </span>
                  </div>
                </div>

                <div className={`flex-1 overflow-hidden rounded-2xl border p-4 ${isDark ? "border-white/10" : "border-amber-100"} ${messageBg}`}>
                  {messagesLoading ? (
                    <div className={`flex h-full items-center justify-center text-sm ${textMuted}`}>Loading messages…</div>
                  ) : (
                    <div className="flex h-full flex-col gap-3 overflow-y-auto pr-2">
                      {messages.map((msg) => (
                        <MessageItem key={msg.id} message={msg} isSelf={msg.user_email === session.email} />
                      ))}
                      <div ref={messagesEndRef} />
                      {!messages.length && (
                        <div className={`mt-12 text-center text-sm ${textMuted}`}>
                          No messages yet. Start the conversation!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {messagesError && (
                  <div className={`rounded-xl border px-3 py-2 text-sm ${errorStyle}`}>
                    {messagesError}
                  </div>
                )}

                <div className={`rounded-2xl border p-4 ${subtleBg}`}>
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      placeholder="Send a supportive note, share context, or link an update…"
                      maxLength={MAX_MESSAGE_LEN}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 ${inputStyle} ${isDark ? "focus:ring-[#7c5ae6]/40" : "focus:ring-amber-200"}`}
                      rows={3}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className={`flex flex-wrap items-center gap-2 text-xs ${textMuted}`}>
                        <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 font-semibold ${pillStyle}`}>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setPendingFile(file);
                            }}
                          />
                          Attach file (max 10MB)
                        </label>
                        {pendingFile && (
                          <span className={`rounded-full px-3 py-1 text-[11px] ${isDark ? "bg-white/10" : "bg-amber-100"}`}>
                            {pendingFile.name} · {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        )}
                        <span className={`text-[11px] ${textMuted}`}>
                          Text, images, PDFs, and files supported.
                        </span>
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 ${buttonPrimary}`}
                      >
                        {sending ? "Sending..." : "Send message"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </section>
      </div>
    </div>
  );
}

function SafeSpaceFallback() {
  const { isDark } = useTheme();
  const bg = isDark
    ? "bg-[radial-gradient(circle_at_20%_20%,#2f184d_0%,#130c26_45%,#05030d_100%)] text-[#f4edff]"
    : "bg-gradient-to-br from-[#fdf3e8] via-[#f8e7ff] to-[#ffe4d1] text-slate-900";
  return (
    <div className={`flex min-h-screen items-center justify-center ${bg}`}>
      <p>Loading community...</p>
    </div>
  );
}

export default function SafeSpacePage() {
  return (
    <Suspense fallback={<SafeSpaceFallback />}>
      <SafeSpaceContent />
    </Suspense>
  );
}

