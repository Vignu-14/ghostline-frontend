import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../common/Button";
import type { CallNotice, CallSession } from "../../types/call";
import type { DeleteMode, Message } from "../../types/message";
import { formatRelativeDate } from "../../utils/formatDate";
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
  onStartCall: () => Promise<void> | void;
  onToggleMute: () => void;
  onToggleSidebar: () => void;
  callNotice: CallNotice | null;
  callSession: CallSession | null;
  remoteAudioRef: RefObject<HTMLAudioElement | null>;
  socketConnected: boolean;
};

export function ChatWindow({
  conversationLastActivity,
  conversationUserID,
  currentUserID,
  disabled,
  isOnline,
  messages,
  messageCount,
  onAcceptCall,
  onDeclineCall,
  onDismissCallNotice,
  onEndCall,
  onClearConversation,
  onDeleteMessages,
  title,
  onSend,
  onStartCall,
  onToggleMute,
  onToggleSidebar,
  callNotice,
  callSession,
  remoteAudioRef,
  socketConnected,
}: ChatWindowProps) {
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [localError, setLocalError] = useState("");
  const [selectedMessageIDs, setSelectedMessageIDs] = useState<string[]>([]);
  const connectionTone = !isOnline ? "offline" : socketConnected ? "live" : "warming";
  const connectionLabel = !isOnline ? "You are offline" : socketConnected ? "Connected" : "Reconnecting...";

  useEffect(() => {
    if (!messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, disabled, title]);

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
      description:
        "Delete for everyone will remove only your selected messages from both sides. Messages sent by the other person will only be removed for you.",
      messageIDs: selectedMessageIDs,
      title:
        selectedMessageIDs.length === 1
          ? "Delete the selected message?"
          : `Delete ${selectedMessageIDs.length} selected messages?`,
    });
  }

  function openClearDialog() {
    setDeleteDialog({
      kind: "clear",
      description:
        "Delete for me clears the whole chat only from your side. Delete for everyone clears the chat for you and removes only your own sent messages from the other person's side.",
      title: "Clear this chat?",
    });
  }

  async function handleDeleteConfirm(mode: DeleteMode) {
    if (!deleteDialog || deleteDialog.kind !== "messages") {
      return;
    }

    setIsWorking(true);
    setLocalError("");

    try {
      await onDeleteMessages(deleteDialog.messageIDs, mode);
      setDeleteDialog(null);
      setSelectedMessageIDs([]);
      setIsSelectionMode(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Unable to delete messages.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleClearConfirm(mode: DeleteMode) {
    if (!conversationUserID) {
      return;
    }

    setIsWorking(true);
    setLocalError("");

    try {
      await onClearConversation(conversationUserID, mode);
      setDeleteDialog(null);
      setSelectedMessageIDs([]);
      setIsSelectionMode(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Unable to clear the conversation.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="chat-main">
      <header className="chat-header">
        <div className="chat-header__left">
          <button
            className="mobile-sidebar-toggle"
            onClick={onToggleSidebar}
            type="button"
            aria-label="Toggle conversations"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="chat-header__info">
            <h2>{title}</h2>
            <div className="chat-header__meta">
              <span className={`chat-header__status chat-header__status--${connectionTone}`}>
                <span className={`status-dot status-dot--${connectionTone}`} />
                {connectionLabel}
              </span>
              {messageCount > 0 && (
                <span className="text-faint text-xs">• {messageCount} messages</span>
              )}
            </div>
          </div>
        </div>

        {!disabled ? (
          <div className="chat-header__actions">
            {isSelectionMode ? (
              <>
                <span className="text-muted text-xs" style={{ marginRight: '4px' }}>
                  {selectedMessageIDs.length > 0
                    ? `${selectedMessageIDs.length} selected`
                    : "Tap to select"}
                </span>
                <Button
                  disabled={selectedMessageIDs.length === 0 || isWorking}
                  onClick={openSelectedDeleteDialog}
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  Delete
                </Button>
                <Button
                  disabled={isWorking}
                  onClick={() => {
                    setDeleteDialog(null);
                    setIsSelectionMode(false);
                    setLocalError("");
                    setSelectedMessageIDs([]);
                  }}
                  type="button"
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button disabled={isWorking} onClick={() => setIsSelectionMode(true)} type="button" variant="ghost" size="sm">
                  Select
                </Button>
                <Button
                  disabled={isWorking || !conversationUserID || Boolean(callSession)}
                  onClick={() => void onStartCall()}
                  type="button"
                  variant="ghost"
                  size="sm"
                >
                  <CallIcon />
                  <span>{callSession ? "In call" : "Call"}</span>
                </Button>
                <Button disabled={isWorking} onClick={openClearDialog} type="button" variant="outline" size="sm">
                  Clear
                </Button>
              </>
            )}
          </div>
        ) : null}
      </header>

      {localError ? (
        <div style={{ padding: '8px 24px' }}>
          <p className="form-error">{localError}</p>
        </div>
      ) : null}

      <CallPanel
        callNotice={callNotice}
        callSession={callSession && callSession.peerID === conversationUserID ? callSession : null}
        onAccept={onAcceptCall}
        onDecline={onDeclineCall}
        onDismissNotice={onDismissCallNotice}
        onEnd={onEndCall}
        onToggleMute={onToggleMute}
        remoteAudioRef={remoteAudioRef}
      />

      <div className="chat-messages" ref={messageListRef}>
        {disabled ? (
          <div className="empty-state">
            <div className="empty-state__icon">💬</div>
            <h3>No chat selected</h3>
            <p>Pick a conversation from the sidebar or search for someone new.</p>
          </div>
        ) : null}

        {!disabled && messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">👋</div>
            <h3>Start the conversation</h3>
            <p>Send the first message — say hello!</p>
          </div>
        ) : null}

        {!disabled
          ? messages.map((message) => (
            <ChatMessage
              key={message.id}
              isOwn={message.sender_id === currentUserID}
              isSelected={selectedMessageIDs.includes(message.id)}
              isSelectionMode={isSelectionMode}
              message={message}
              onToggleSelect={toggleSelection}
            />
          ))
          : null}
      </div>

      <MessageInput disabled={disabled || isWorking} onSend={onSend} />

      {deleteDialog ? (
        <div className="chat-dialog-overlay">
          <div className="chat-dialog">
            <p className="chat-dialog__label">
              {deleteDialog.kind === "clear" ? "Clear conversation" : "Delete options"}
            </p>
            <h3>{deleteDialog.title}</h3>
            <p>{deleteDialog.description}</p>

            <div className="chat-dialog__actions">
              <Button disabled={isWorking} onClick={() => setDeleteDialog(null)} type="button" variant="ghost" size="sm">
                Cancel
              </Button>
              {deleteDialog.kind === "messages" ? (
                <Button disabled={isWorking} onClick={() => void handleDeleteConfirm("everyone")} type="button" variant="outline" size="sm">
                  Delete for everyone
                </Button>
              ) : null}
              {deleteDialog.kind === "messages" ? (
                <Button disabled={isWorking} onClick={() => void handleDeleteConfirm("me")} type="button" variant="primary" size="sm">
                  Delete for me
                </Button>
              ) : (
                <>
                  <Button disabled={isWorking} onClick={() => void handleClearConfirm("everyone")} type="button" variant="outline" size="sm">
                    Delete for everyone
                  </Button>
                  <Button disabled={isWorking} onClick={() => void handleClearConfirm("me")} type="button" variant="primary" size="sm">
                    Delete for me
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CallIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  );
}
