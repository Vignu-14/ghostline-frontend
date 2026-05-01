import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatList } from "../components/chat/ChatList";
import { ChatWindow } from "../components/chat/ChatWindow";
import { IconSidebar } from "../components/layout/IconSidebar";
import { useAuth } from "../hooks/useAuth";
import { useCall } from "../hooks/useCall";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useWebSocket } from "../hooks/useWebSocket";
import * as chatService from "../services/chatService";
import type { Conversation, DeleteMode, Message } from "../types/message";
import type { UserSearchResult } from "../types/user";
import { getErrorMessage } from "../utils/errorHandler";
import { formatRelativeDate } from "../utils/formatDate";
import { playNotificationSound } from "../utils/audio";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isDesktop;
}

export function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLoadDoneRef = useRef(false);
  const userIdParam = searchParams.get("u");
  const usernameParam = searchParams.get("n");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const isOnline = useOnlineStatus();
  const socket = useWebSocket(Boolean(user));
  const activeConversationUsername = activeConversation?.username;
  const isDesktop = useIsDesktop();

  function ensureConversation(selectedUser: { id: string; username?: string }) {
    const nextConversation: Conversation = {
      user_id: selectedUser.id,
      username: selectedUser.username || "ghost",
      profile_picture_url: null,
      unread_count: 0,
      last_message: "",
      last_message_at: "",
    };

    setActiveConversation((current) => (current?.user_id === selectedUser.id ? current : nextConversation));
    setConversations((current) =>
      current.some((conversation) => conversation.user_id === selectedUser.id)
        ? current
        : [nextConversation, ...current],
    );
  }

  const {
    acceptIncomingCall,
    callNotice,
    callSession,
    declineIncomingCall,
    dismissCallNotice,
    endCall,
    remoteVideoRef,
    localVideoRef,
    startCall,
    toggleMute,
    toggleVideo,
  } = useCall({
    currentUserID: user?.id || "",
    currentUsername: user?.username || "",
    lastEvent: socket.lastEvent,
    onEnsureConversation: ensureConversation,
    send: socket.send,
    socketConnected: socket.isConnected,
  });

  if (!user) {
    return null;
  }

  const totalUnread = conversations.reduce((count, conversation) => count + conversation.unread_count, 0);
  const latestActivity = activeConversation?.last_message_at || conversations[0]?.last_message_at || "";
  const connectionTone = !isOnline ? "offline" : socket.isConnected ? "live" : "warming";
  const connectionLabel = !isOnline ? "Offline" : socket.isConnected ? "Live sync" : "Reconnecting";

  async function loadMessagesForConversation(conversationUserID: string, showErrors = true) {
    try {
      if (showErrors) {
        setError("");
      }

      const response = await chatService.getConversation(conversationUserID);
      setMessages(response.messages || []);
    } catch (loadError) {
      if (showErrors) {
        setError(getErrorMessage(loadError, "Unable to load messages."));
      }
    }
  }

  async function loadConversations(preferredUserID?: string) {
    try {
      setError("");
      const response = await chatService.listConversations();
      const nextConversations = response.conversations || [];
      
      setConversations((prev) => {
        // If we have a preferred user (like a newly started chat) that isn't on the server yet,
        // keep it in the list so it doesn't disappear from the UI.
        const ghost = prev.find(c => c.user_id === preferredUserID && !nextConversations.some(nc => nc.user_id === preferredUserID));
        return ghost ? [ghost, ...nextConversations] : nextConversations;
      });

      setActiveConversation((current) => {
        const targetID = preferredUserID || current?.user_id;
        if (!targetID) return nextConversations[0] || null;

        const found = nextConversations.find((c) => c.user_id === targetID);
        if (found) return found;

        // If not found on server but it was our active/preferred chat, keep it as is (ghost chat)
        if (current && current.user_id === targetID) return current;
        
        // Fallback to first available or null
        return current || nextConversations[0] || null;
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load conversations."));
    }
  }

  useEffect(() => {
    if (initialLoadDoneRef.current) return;

    void (async () => {
      await loadConversations(userIdParam || undefined);

      if (userIdParam) {
        ensureConversation({ id: userIdParam, username: usernameParam || "ghost" });
        setSearchParams({}, { replace: true });
      }
      initialLoadDoneRef.current = true;
    })();
  }, [userIdParam, usernameParam, setSearchParams]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 1) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutID = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await chatService.searchUsers(trimmedQuery);
          setSearchResults(response.users);
        } catch (searchError) {
          setError(getErrorMessage(searchError, "Unable to search users."));
        } finally {
          setIsSearching(false);
        }
      })();
    }, 250);

    return () => {
      window.clearTimeout(timeoutID);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    void loadMessagesForConversation(activeConversation.user_id);
  }, [activeConversation]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalID = window.setInterval(() => {
      void loadConversations(activeConversation?.user_id);

      if (activeConversation) {
        void loadMessagesForConversation(activeConversation.user_id, false);
      }
    }, 2000);

    return () => {
      window.clearInterval(intervalID);
    };
  }, [user, activeConversation]);

  useEffect(() => {
    const latestEvent = socket.lastEvent;
    if (!latestEvent) {
      return;
    }

    if (latestEvent.type === "error" && latestEvent.message) {
      setError(latestEvent.message);
      return;
    }

    if (latestEvent.type !== "message" || !latestEvent.payload || !user) {
      return;
    }

    const message = latestEvent.payload as Message;
    const conversationUserID = message.sender_id === user.id ? message.receiver_id : message.sender_id;

    if (message.sender_id !== user.id) {
      playNotificationSound();
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.user_id === conversationUserID
          ? {
              ...conversation,
              last_message: message.content,
              last_message_at: message.created_at,
              unread_count:
                message.sender_id === user.id || activeConversation?.user_id === conversationUserID
                  ? 0
                  : conversation.unread_count + 1,
            }
          : conversation,
      ),
    );

    if (activeConversation?.user_id === conversationUserID) {
      setMessages((current) =>
        current.some((entry) => entry.id === message.id) ? current : [...current, message],
      );
    }

    void loadConversations(conversationUserID);
  }, [activeConversation?.user_id, socket.lastEvent, user]);

  useEffect(() => {
    if (!callSession) {
      return;
    }

    ensureConversation({
      id: callSession.peerID,
      username: callSession.peerUsername,
    });
  }, [callSession]);

  async function handleSend(content: string) {
    if (!activeConversation || !user) {
      return;
    }

    setError("");

    if (socket.isConnected) {
      socket.send({
        receiver_id: activeConversation.user_id,
        content,
      });
      window.setTimeout(() => {
        void loadConversations(activeConversation.user_id);
        void loadMessagesForConversation(activeConversation.user_id, false);
      }, 250);
      return;
    }

    try {
      const response = await chatService.sendMessage({
        receiver_id: activeConversation.user_id,
        content,
      });

      setMessages((current) =>
        current.some((message) => message.id === response.message.id)
          ? current
          : [...current, response.message],
      );
      setConversations((current) => {
        const updated = current.map((conversation) =>
          conversation.user_id === activeConversation.user_id
            ? {
                ...conversation,
                last_message: response.message.content,
                last_message_at: response.message.created_at,
              }
            : conversation,
        );

        return updated;
      });
      await loadConversations(activeConversation.user_id);
    } catch (sendError) {
      const nextError = getErrorMessage(sendError, "Unable to send the message.");
      setError(nextError);
      throw new Error(nextError);
    }
  }

  async function handleDeleteMessages(messageIDs: string[], mode: DeleteMode) {
    if (!activeConversation) {
      return;
    }

    setError("");

    try {
      await chatService.deleteMessages({
        message_ids: messageIDs,
        mode,
      });
      await loadMessagesForConversation(activeConversation.user_id, false);
      await loadConversations(activeConversation.user_id);
    } catch (deleteError) {
      const nextError = getErrorMessage(deleteError, "Unable to delete messages.");
      setError(nextError);
      throw new Error(nextError);
    }
  }

  async function handleClearConversation(userID: string, mode: DeleteMode) {
    setError("");

    try {
      await chatService.clearConversation(userID, { mode });
      setMessages([]);
      await loadConversations(userID);
    } catch (clearError) {
      const nextError = getErrorMessage(clearError, "Unable to clear the conversation.");
      setError(nextError);
      throw new Error(nextError);
    }
  }

  function handleStartConversation(selectedUser: UserSearchResult) {
    const nextConversation: Conversation = {
      user_id: selectedUser.id,
      username: selectedUser.username,
      profile_picture_url: selectedUser.profile_picture_url,
      unread_count: 0,
      last_message: "",
      last_message_at: "",
    };

    setActiveConversation(nextConversation);
    setMessages([]);
    setSearchQuery("");
    setSearchResults([]);
    setIsSidebarOpen(false);
    setConversations((current) =>
      current.some((conversation) => conversation.user_id === selectedUser.id)
        ? current
        : [nextConversation, ...current],
    );
  }

  function handleSelectConversation(conversation: Conversation) {
    setActiveConversation(conversation);
    setIsSidebarOpen(false);
  }

  // Layout logic based on desktop/mobile state
  const showIconSidebar = isDesktop;
  
  // On desktop, always show chat list. On mobile, show it if there's no chat, OR if the drawer is open.
  const showChatList = isDesktop || !activeConversation || isSidebarOpen;
  
  // On desktop, always show chat window. On mobile, show it only if there is an active chat.
  const showChatWindow = isDesktop || !!activeConversation;

  return (
    <div className="flex h-full w-full bg-background text-on-background overflow-hidden font-body select-none">
      
      {/* 1. Nav Sidebar (WhatsApp-like thin icon bar on far left) */}
      {showIconSidebar && (
        <div style={{ width: '64px', minWidth: '64px' }} className="shrink-0 flex flex-col border-r border-outline-variant bg-surface-container-low z-10">
          <IconSidebar />
        </div>
      )}

      {/* 2. Conversation List Pane */}
      {showChatList && (
        <div 
          style={{ width: isDesktop ? '380px' : (!activeConversation ? '100%' : '320px') }}
          className={`
            shrink-0 flex flex-col bg-surface border-r border-outline-variant h-full
            ${!isDesktop ? 'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out' : 'relative z-10'}
            ${!isDesktop && activeConversation && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          `}
        >
          <ChatList
            activeUserID={activeConversation?.user_id}
            conversations={conversations}
            onSelect={handleSelectConversation}
            onSearchChange={setSearchQuery}
            onStartConversation={handleStartConversation}
            isSearching={isSearching}
            searchQuery={searchQuery}
            searchResults={searchResults}
            isOpen={isSidebarOpen}
          />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {!isDesktop && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 3. Main Chat Window */}
      {showChatWindow && (
        <div className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest h-full relative">
          <ChatWindow
            callNotice={callNotice}
            callSession={callSession}
            conversationLastActivity={activeConversation?.last_message_at}
            conversationUserID={activeConversation?.user_id}
            currentUserID={user.id}
            disabled={!activeConversation}
            isOnline={isOnline}
            messages={messages}
            messageCount={messages.length}
            onAcceptCall={acceptIncomingCall}
            onDeclineCall={declineIncomingCall}
            onDismissCallNotice={dismissCallNotice}
            onEndCall={endCall}
            onClearConversation={handleClearConversation}
            onDeleteMessages={handleDeleteMessages}
            onSend={handleSend}
            onStartAudioCall={() => startCall(activeConversation?.user_id || "", activeConversationUsername, "audio")}
            onStartVideoCall={() => startCall(activeConversation?.user_id || "", activeConversationUsername, "video")}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
            remoteVideoRef={remoteVideoRef}
            localVideoRef={localVideoRef}
            socketConnected={socket.isConnected}
            title={activeConversation ? `@${activeConversation.username}` : "Choose a conversation"}
          />
        </div>
      )}
    </div>
  );
}
