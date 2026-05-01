import { useEffect, useRef, useState, type RefObject } from "react";
import type { CallNotice, CallSession } from "../../types/call";
import type { DeleteMode, Message } from "../../types/message";
import { CallPanel } from "./CallPanel";
import { ChatMessage } from "./ChatMessage";
import { MessageInput } from "./MessageInput";

type DeleteDialogState =
  | {
    kind: "messages";
    description: string;
    messageIDs: string[];
    title: string;
  }
  | {
    kind: "clear";
    description: string;
    title: string;
  };

type ChatWindowProps = {
  conversationLastActivity?: string;
  conversationUserID?: string;
  currentUserID: string;
  disabled?: boolean;
  isOnline: boolean;
  messages: Message[];
  messageCount: number;
  onAcceptCall: () => void;
  onDeclineCall: () => void;
  onDismissCallNotice: () => void;
  onEndCall: () => void;
  onClearConversation: (userID: string, mode: DeleteMode) => Promise<void>;
  onDeleteMessages: (messageIDs: string[], mode: DeleteMode) => Promise<void>;
  title: string;
  onSend: (content: string) => Promise<void>;
  onStartAudioCall: () => Promise<void> | void;
  onStartVideoCall: () => Promise<void> | void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSidebar: () => void;
  callNotice: CallNotice | null;
  callSession: CallSession | null;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  socketConnected: boolean;
};

export function ChatWindow({
  conversationUserID,
  currentUserID,
  disabled,
  isOnline,
  messages,
  onAcceptCall,
  onDeclineCall,
  onDismissCallNotice,
  onEndCall,
  onClearConversation,
  onDeleteMessages,
  title,
  onSend,
  onStartAudioCall,
  onStartVideoCall,
  onToggleMute,
  onToggleVideo,
  onToggleSidebar,
  callNotice,
  callSession,
  remoteVideoRef,
  localVideoRef,
}: ChatWindowProps) {
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [localError, setLocalError] = useState("");
  const [selectedMessageIDs, setSelectedMessageIDs] = useState<string[]>([]);
  const lastScrollCountRef = useRef(0);
  const lastConversationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;

    const isNewConversation = lastConversationRef.current !== conversationUserID;
    const hasNewMessages = messages.length > lastScrollCountRef.current;

    let shouldScroll = false;

    if (isNewConversation) {
      shouldScroll = true;
    } else if (hasNewMessages) {
      const threshold = 150;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      shouldScroll = isNearBottom;
    }

    if (shouldScroll) {
      el.scrollTop = el.scrollHeight;
    }

    lastScrollCountRef.current = messages.length;
    lastConversationRef.current = conversationUserID;
  }, [messages, disabled, conversationUserID]);

  useEffect(() => {
    setSelectedMessageIDs((current) =>
      current.filter((messageID) => messages.some((message) => message.id === messageID)),
    );
  }, [messages]);

  useEffect(() => {
    setDeleteDialog(null);
    setIsSelectionMode(false);
    setSelectedMessageIDs([]);
    setLocalError("");
  }, [conversationUserID, disabled]);

  function toggleSelection(message: Message) {
    setSelectedMessageIDs((current) =>
      current.includes(message.id)
        ? current.filter((messageID) => messageID !== message.id)
        : [...current, message.id],
    );
  }

  function openSelectedDeleteDialog() {
    if (selectedMessageIDs.length === 0) {
      setLocalError("Choose at least one message first.");
      return;
    }

    setDeleteDialog({
      kind: "messages",
      description: "This will permanently remove the selected messages for you.",
      messageIDs: selectedMessageIDs,
      title: `Delete ${selectedMessageIDs.length} messages?`,
    });
  }

  function openClearDialog() {
    setDeleteDialog({
      kind: "clear",
      description: "All messages in this chat will be cleared from your side.",
      title: "Clear conversation?",
    });
  }

  async function handleDeleteConfirm(mode: DeleteMode) {
    if (!deleteDialog || deleteDialog.kind !== "messages") return;
    setIsWorking(true);
    try {
      await onDeleteMessages(deleteDialog.messageIDs, mode);
      setDeleteDialog(null);
      setSelectedMessageIDs([]);
      setIsSelectionMode(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Error deleting messages");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleClearConfirm(mode: DeleteMode) {
    if (!conversationUserID) return;
    setIsWorking(true);
    try {
      await onClearConversation(conversationUserID, mode);
      setDeleteDialog(null);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Error clearing chat");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="flex flex-col h-full w-full bg-surface-container-lowest overflow-hidden relative">
      {/* Header */}
      <header className="h-[72px] px-5 py-2 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-all active:scale-90 text-on-surface-variant"
            onClick={onToggleSidebar}
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          
          {!disabled && (
            <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-4 rounded-2xl hover:bg-surface-container transition-all min-w-0 group">
               <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-container flex items-center justify-center text-on-surface-variant font-bold text-base border-2 border-surface shadow-sm group-hover:border-primary/20 transition-all">
                     {messages[0]?.sender_avatar_url ? (
                       <img src={messages[0].sender_avatar_url} alt="avatar" className="w-full h-full object-cover" />
                     ) : (
                       <span>{title.replace('@', '').charAt(0).toUpperCase()}</span>
                     )}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0.5 w-3.5 h-3.5 bg-tertiary-fixed border-2 border-surface rounded-full shadow-sm"></div>
                  )}
               </div>
               <div className="flex flex-col min-w-0">
                  <h2 className="text-[16px] font-bold text-on-surface truncate leading-tight tracking-tight">{title}</h2>
                  <span className="text-[11px] text-on-surface-variant/70 truncate font-semibold uppercase tracking-wider mt-0.5">
                    {isOnline ? 'Online now' : 'click for info'}
                  </span>
               </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!disabled && !isSelectionMode && (
             <>
               <button 
                 onClick={() => void onStartVideoCall()}
                 className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant active:scale-90"
                 title="Video call"
               >
                 <span className="material-symbols-outlined text-[22px]">videocam</span>
               </button>
               <button 
                 onClick={() => void onStartAudioCall()}
                 className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant active:scale-90" 
                 title="Voice call"
               >
                 <span className="material-symbols-outlined text-[22px]">call</span>
               </button>
               <button className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant active:scale-90" title="Search">
                 <span className="material-symbols-outlined text-[22px]">search</span>
               </button>
               <button 
                 onClick={openClearDialog}
                 className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant active:scale-90" 
                 title="More"
               >
                 <span className="material-symbols-outlined text-[22px]">more_vert</span>
               </button>
             </>
          )}
          {isSelectionMode && (
            <div className="flex items-center gap-2 bg-surface-container rounded-full px-2 py-1 border border-outline-variant/30">
               <span className="text-xs font-bold text-primary px-2">{selectedMessageIDs.length} selected</span>
               <button 
                 disabled={selectedMessageIDs.length === 0}
                 onClick={openSelectedDeleteDialog}
                 className="px-3 py-1.5 bg-error text-on-error rounded-full text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
               >
                 Delete
               </button>
               <button 
                 onClick={() => setIsSelectionMode(false)}
                 className="px-3 py-1.5 hover:bg-surface-container-highest rounded-full text-[11px] font-bold uppercase tracking-wider"
               >
                 Cancel
               </button>
            </div>
          )}
        </div>
      </header>

      {localError && (
        <div className="absolute top-[72px] left-0 right-0 bg-error/10 text-error text-[12px] font-semibold py-2 px-6 text-center border-b border-error/20 z-30 animate-in slide-in-from-top duration-300">
          {localError}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative bg-surface-container-lowest custom-scrollbar scroll-smooth" ref={messageListRef}>
        {/* Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
          style={{ backgroundSize: '180px', filter: 'var(--ui-pattern-filter)' }}
        ></div>

        <div className="relative mx-auto flex min-h-full w-full max-w-[86rem] flex-col px-4 py-6 sm:px-6 sm:py-8">
           {disabled ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center mb-6 shadow-sm border border-primary/5">
                  <span className="material-symbols-outlined text-[48px] text-primary">chat_bubble</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface tracking-tight">Your secure space</h3>
                <p className="text-sm text-on-surface-variant/70 mt-3 max-w-[20rem] leading-relaxed">
                   Select a contact to begin a private conversation. All messages are encrypted.
                </p>
                <div className="mt-8 flex gap-3">
                   <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-2xl border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">Secure</span>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-2xl border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">lock</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">Private</span>
                   </div>
                </div>
              </div>
           ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-surface rounded-[32px] flex items-center justify-center mb-5 shadow-md border border-outline-variant/10">
                   <span className="text-3xl animate-bounce">👋</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">Say hello!</h3>
                <p className="text-sm text-on-surface-variant/70 mt-1.5">Start the conversation with {title}</p>
              </div>
           ) : (
             <div className="py-2">
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const isSameSender = prevMessage && prevMessage.sender_id === message.sender_id;
                  return (
                    <ChatMessage
                      key={message.id}
                      isOwn={message.sender_id === currentUserID}
                      isSelected={selectedMessageIDs.includes(message.id)}
                      isSelectionMode={isSelectionMode}
                      message={message}
                      onToggleSelect={toggleSelection}
                      showAvatar={!isSameSender}
                      isClustered={isSameSender}
                    />
                  );
                })}
             </div>
           )}
        </div>
      </div>

      <CallPanel
        callNotice={callNotice}
        callSession={callSession && callSession.peerID === conversationUserID ? callSession : null}
        onAccept={onAcceptCall}
        onDecline={onDeclineCall}
        onDismissNotice={onDismissCallNotice}
        onEnd={onEndCall}
        onToggleMute={onToggleMute}
        onToggleVideo={onToggleVideo}
        remoteVideoRef={remoteVideoRef}
        localVideoRef={localVideoRef}
      />

      <MessageInput disabled={disabled || isWorking} onSend={onSend} />
      
      {/* Redesigned Dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
           <div className="bg-surface w-full max-w-[340px] rounded-[32px] overflow-hidden shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-200">
              <div className="p-8 pb-6 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-error-container text-on-error-container rounded-3xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[32px]">{deleteDialog.kind === 'clear' ? 'delete_sweep' : 'delete'}</span>
                 </div>
                 <h3 className="text-xl font-bold text-on-surface tracking-tight mb-2">{deleteDialog.title}</h3>
                 <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                   {deleteDialog.description}
                 </p>
              </div>
              <div className="px-6 pb-8 flex flex-col gap-2">
                 <button 
                   onClick={() => deleteDialog.kind === 'messages' ? void handleDeleteConfirm('me') : void handleClearConfirm('me')}
                   className="w-full py-3.5 bg-error text-on-error rounded-2xl font-bold text-sm shadow-lg shadow-error/20 active:scale-[0.98] transition-all"
                 >
                   Delete for me
                 </button>
                 <button 
                   onClick={() => deleteDialog.kind === 'messages' ? void handleDeleteConfirm('everyone') : void handleClearConfirm('everyone')}
                   className="w-full py-3.5 bg-surface-container-high text-on-surface-variant rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
                 >
                   Delete for everyone
                 </button>
                 <button 
                   onClick={() => setDeleteDialog(null)}
                   className="w-full py-3.5 bg-transparent text-on-surface-variant/60 rounded-2xl font-bold text-xs uppercase tracking-widest mt-2 hover:bg-surface-container-low transition-all"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      )}
    </section>
  );
}
