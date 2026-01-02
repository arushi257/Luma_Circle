"use client";

import type { ChatLabel, ChatRoom } from "@/lib/chatService";
import { useTheme } from "@/context/ThemeContext";

function labelToName(label: ChatLabel) {
  if (label === "team-match") return "Team Match";
  if (label === "mentor-mesh") return "MentorMesh";
  if (label === "lab-hub") return "Lab Hub";
  if (label === "admin") return "Admin";
  return "Unlabeled";
}

export function RoomList({
  rooms,
  selectedRoomId,
  onSelect,
  loading,
  emptyLabel,
}: {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
  loading?: boolean;
  emptyLabel?: string;
}) {
  const { isDark } = useTheme();

  const loadingBg = isDark ? "bg-white/10" : "bg-amber-100";
  const emptyBg = isDark
    ? "border-white/10 bg-white/5 text-white/70"
    : "border-amber-100 bg-amber-50 text-slate-600";
  const activeStyle = isDark
    ? "border-[#9b65ff]/60 bg-[#1f1433]/90 text-[#f4edff] shadow-inner shadow-[#8f63ff]/30"
    : "border-amber-300 bg-amber-50 text-amber-900";
  const inactiveStyle = isDark
    ? "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
    : "border-amber-100 bg-white/50 text-slate-700 hover:border-amber-200 hover:bg-amber-50";
  const labelStyle = isDark
    ? "border-white/10 bg-white/10 text-white/70"
    : "border-amber-200 bg-amber-100 text-amber-800";

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((key) => (
          <div key={key} className={`h-10 w-full animate-pulse rounded-xl ${loadingBg}`} />
        ))}
      </div>
    );
  }

  if (!rooms.length) {
    return (
      <div className={`rounded-xl border px-4 py-3 text-sm ${emptyBg}`}>
        {emptyLabel || "No chats in this section yet."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => {
        const isActive = room.id === selectedRoomId;
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
              isActive ? activeStyle : inactiveStyle
            }`}
          >
            <span className="truncate">{room.name}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${labelStyle}`}>
              {labelToName(room.label)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

