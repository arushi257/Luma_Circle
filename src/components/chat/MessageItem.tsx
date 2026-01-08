// components/chat/MessageItem.tsx

import { ChatMessage } from "@/lib/chatService";

interface MessageItemProps {
  message: ChatMessage;
  isSelf: boolean;
}

export function MessageItem({ message, isSelf }: MessageItemProps) {
  return (
    <div className={`flex flex-col mb-4 ${isSelf ? "items-end" : "items-start"}`}>
      {/* Sender Name: Only show if it's NOT the current user */}
      {!isSelf && (
        <span className="text-[10px] font-bold mb-1 ml-2 uppercase tracking-wide opacity-70">
          {/* {message.user_email.split('@')[0]} or message.user_name if available */
            message.user_name
          }
        </span>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isSelf
            ? "bg-gradient-to-br from-[#8f63ff] to-[#7c5ae6] text-white rounded-tr-none"
            : "bg-white/10 border border-white/10 text-inherit rounded-tl-none"
        }`}
      >
        {/* Handle Text Content */}
        {message.content && <p className="leading-relaxed">{message.content}</p>}

        {/* Handle File Attachments */}
        {message.file_url && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <a 
              href={message.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs underline hover:opacity-80 flex items-center gap-2"
            >
              📎 {message.file_name || "Attachment"}
            </a>
          </div>
        )}
        
        <p className={`mt-1 text-[9px] opacity-50 text-right`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}