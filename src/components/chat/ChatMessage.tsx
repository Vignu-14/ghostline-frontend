import type { Message } from "../../types/message";
import { formatChatTime } from "../../utils/formatDate";

type ChatMessageProps = {
  isOwn: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  message: Message;
  onToggleSelect: (message: Message) => void;
};

export function ChatMessage({
  isOwn,
  isSelected,
  isSelectionMode,
  message,
  onToggleSelect,
}: ChatMessageProps) {

  const bubbleClass = isOwn ? "chat-bubble--own" : "chat-bubble--other";
  const wrapperClass = isOwn ? "chat-bubble-wrapper--own" : "chat-bubble-wrapper--other";

  return (
    <div className={`chat-bubble-wrapper ${wrapperClass}`}>
      {!isOwn && (
        <div className="chat-bubble__avatar">
          {message.sender_avatar_url ? (
            <img src={message.sender_avatar_url} alt="avatar" className="chat-bubble__avatar-img" />
          ) : (
            <div className="chat-bubble__avatar-fallback">
              ?
            </div>
          )}
        </div>
      )}
      <div className="chat-bubble-container">
        <div
          className={`chat-bubble ${bubbleClass}`}
          style={{
            opacity: message.deleted_for_everyone ? 0.5 : 1,
            fontStyle: message.deleted_for_everyone ? 'italic' : 'normal',
            outline: isSelected ? '2px solid var(--accent)' : 'none',
            outlineOffset: '2px',
            cursor: isSelectionMode ? 'pointer' : 'default',
            borderRadius: isSelected ? '18px' : undefined,
          }}
          onClick={isSelectionMode ? () => onToggleSelect(message) : undefined}
        >
          {message.deleted_for_everyone ? "This message was deleted" : message.content}
        </div>
        <div className="chat-meta">
          <span>{formatChatTime(message.created_at)}</span>
          {isOwn && message.is_read && !message.deleted_for_everyone ? (
            <span className="chat-meta__seen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Seen
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
