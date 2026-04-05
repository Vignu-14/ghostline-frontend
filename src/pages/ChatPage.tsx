import { useEffect, useState } from "react";
import { ChatList } from "../components/chat/ChatList";
import { ChatWindow } from "../components/chat/ChatWindow";
import { useAuth } from "../hooks/useAuth";
import { useAudioCall } from "../hooks/useAudioCall";
import { useWebSocket } from "../hooks/useWebSocket";
import * as chatService from "../services/chatService";
import type { Conversation, DeleteMode, Message } from "../types/message";
import type { UserSearchResult } from "../types/user";
import { getErrorMessage } from "../utils/errorHandler";

export function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const socket = useWebSocket(Boolean(user));
  const activeConversationUsername = activeConversation?.username;

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
    remoteAudioRef,
    startCall,
    toggleMute,
  } = useAudioCall({
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
      setConversations(nextConversations);
      setActiveConversation((current) => {
        if (preferredUserID) {
          return (
            nextConversations.find((conversation) => conversation.user_id === preferredUserID) ||
            current ||
            nextConversations[0] ||
            null
          );
        }

        if (current) {
          return (
            nextConversations.find((conversation) => conversation.user_id === current.user_id) ||
            nextConversations[0] ||
            null
          );
        }

        return nextConversations[0] || null;
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load conversations."));
    }
  }

  useEffect(() => {
    void loadConversations();
  }, []);

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
    setConversations((current) =>
      current.some((conversation) => conversation.user_id === selectedUser.id)
        ? current
        : [nextConversation, ...current],
    );
  }

  return (
    <main className="page page--chat">
      <section className="page-header">
        <p className="eyebrow">Realtime direct messages</p>
        <h1>Stay in the line without breaking the flow.</h1>
        <p className="support-copy">
          {socket.isConnected ? "Live connection active." : "Socket reconnecting or waiting to connect."}
        </p>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="chat-layout">
        <ChatList
          activeUserID={activeConversation?.user_id}
          conversations={conversations}
          onSelect={setActiveConversation}
          onSearchChange={setSearchQuery}
          onStartConversation={handleStartConversation}
          isSearching={isSearching}
          searchQuery={searchQuery}
          searchResults={searchResults}
        />
        <ChatWindow
          callNotice={callNotice}
          callSession={callSession}
          conversationUserID={activeConversation?.user_id}
          currentUserID={user.id}
          disabled={!activeConversation}
          messages={messages}
          onAcceptCall={acceptIncomingCall}
          onDeclineCall={declineIncomingCall}
          onDismissCallNotice={dismissCallNotice}
          onEndCall={endCall}
          onClearConversation={handleClearConversation}
          onDeleteMessages={handleDeleteMessages}
          onSend={handleSend}
          onStartCall={() => startCall(activeConversation?.user_id || "", activeConversationUsername)}
          onToggleMute={toggleMute}
          remoteAudioRef={remoteAudioRef}
          title={activeConversation ? `@${activeConversation.username}` : "Choose a conversation"}
        />
      </section>
    </main>
  );
}
