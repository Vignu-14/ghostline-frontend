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
    <div className="p-4 pb-6 bg-surface-container-lowest flex items-center gap-2 shrink-0 z-10">
      <button 
        type="button" 
        className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all active:scale-90"
        title="Attach file"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </button>
      
      <form onSubmit={handleSubmit} className="flex-1 flex items-center bg-surface-container-low rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
        <button type="button" className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors active:scale-90" title="Emojis">
          <span className="material-symbols-outlined text-[22px]">mood</span>
        </button>
        <input
          ref={inputRef}
          disabled={disabled || isSending}
          onChange={(event) => setContent(event.target.value)}
          placeholder={disabled ? "Select a chat to start messaging" : "Type a message"}
          className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] py-2 text-on-surface placeholder:text-on-surface-variant/40 outline-none"
          value={content}
        />
      </form>

      <button 
        disabled={disabled || isSending}
        onClick={(e) => { if (content.trim()) { e.preventDefault(); void handleSubmit(e as any); } }}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-sm ${
          content.trim() 
            ? 'bg-primary text-on-primary shadow-primary/20 scale-105' 
            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
        }`}
        title={content.trim() ? "Send" : "Voice message"}
      >
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: content.trim() ? "'FILL' 1" : "" }}>
          {content.trim() ? 'send' : 'mic'}
        </span>
      </button>
    </div>
  );
}
