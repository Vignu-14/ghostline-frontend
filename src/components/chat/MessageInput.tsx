import { useState, useRef, useEffect, type FormEvent } from "react";

type MessageInputProps = {
  disabled?: boolean;
  onSend: (content: string) => Promise<void> | void;
};

export function MessageInput({ disabled, onSend }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextContent = content.trim();

    if (!nextContent || disabled || isSending) {
      return;
    }

    setIsSending(true);

    try {
      await onSend(nextContent);
      setContent("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch {
      return;
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chat-input-dock" style={{ background: 'transparent', borderTop: 'none' }}>
      <form 
        className="chat-input-form" 
        onSubmit={handleSubmit}
        style={{
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-full)',
          padding: '8px 16px',
          margin: '16px',
          background: 'var(--surface-strong)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <input
          className="chat-input-field"
          ref={inputRef}
          disabled={disabled || isSending}
          onChange={(event) => setContent(event.target.value)}
          placeholder={disabled ? "Select a conversation..." : "Type your message..."}
          style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: '4px 8px'
          }}
          value={content}
        />
        <button 
          className="chat-send-btn" 
          disabled={disabled || isSending || !content.trim()} 
          type="submit"
          aria-label="Send message"
          style={{
            height: '36px',
            width: '36px',
            minWidth: '36px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
