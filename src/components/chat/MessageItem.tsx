"use client";

import type { ChatMessage } from "@/lib/chatService";
import { useTheme } from "@/context/ThemeContext";

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

function isImage(type: string | null | undefined) {
  return Boolean(type && type.startsWith("image/"));
}

export function MessageItem({ message, isSelf }: { message: ChatMessage; isSelf: boolean }) {
  const { isDark } = useTheme();

  const selfStyle = isDark
    ? "ml-auto bg-gradient-to-r from-[#8f63ff]/80 to-[#f6d47c]/80 text-[#0c0817] border-transparent"
    : "ml-auto bg-gradient-to-r from-amber-400 to-amber-500 text-white border-transparent";
  const otherStyle = isDark
    ? "mr-auto bg-white/5 text-white/90 border-white/10"
    : "mr-auto bg-white/80 text-slate-900 border-amber-100";
  const base = isSelf ? selfStyle : otherStyle;

  const metaText = isDark ? "text-white/70" : isSelf ? "text-white/80" : "text-slate-500";
  const textStrong = isDark ? "text-white" : isSelf ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-white/60" : "text-slate-500";
  const imgBorder = isDark ? "border-white/10" : "border-amber-100";
  const pillBg = isDark ? "bg-white/10" : "bg-amber-100";
  const captionBg = isDark ? "bg-black/20 text-white/70" : "bg-slate-100 text-slate-600";

  return (
    <div className={`max-w-xl rounded-2xl border px-4 py-3 shadow-sm ${base}`}>
      <div className={`flex items-center justify-between gap-3 text-[11px] font-semibold ${metaText}`}>
        <span className="truncate">{isSelf ? "You" : message.user_email}</span>
        <span>{formatTime(message.created_at)}</span>
      </div>
      {message.message_type === "file" ? (
        <div className="mt-2 space-y-2">
          <p className={`text-sm font-semibold ${textStrong}`}>{message.file_name || "Attachment"}</p>
          {isImage(message.file_type) ? (
            <img
              src={message.file_url || ""}
              alt={message.file_name || "attachment"}
              className={`max-h-80 w-full rounded-xl border object-cover ${imgBorder}`}
            />
          ) : (
            <a
              href={message.file_url || ""}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 text-sm font-semibold underline ${textStrong}`}
            >
              Download file
              {message.file_type && <span className={`rounded-full px-2 py-0.5 text-[11px] ${pillBg}`}>{message.file_type}</span>}
            </a>
          )}
          {message.file_size ? (
            <p className={`text-[11px] ${textMuted}`}>
              {(message.file_size / (1024 * 1024)).toFixed(2)} MB
            </p>
          ) : null}
          {message.content && (
            <p className={`rounded-lg px-3 py-2 text-xs break-words ${captionBg}`}>{message.content}</p>
          )}
        </div>
      ) : (
        <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 break-words ${textStrong}`}>{message.content}</p>
      )}
    </div>
  );
}

