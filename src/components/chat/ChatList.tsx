import type { Conversation } from "../../types/message";
import type { UserSearchResult } from "../../types/user";
import { formatRelativeDate } from "../../utils/formatDate";
import { UnreadBadge } from "./UnreadBadge";

type ChatListProps = {
  conversations: Conversation[];
  activeUserID?: string;
  onSelect: (conversation: Conversation) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: UserSearchResult[];
  isSearching: boolean;
  onStartConversation: (user: UserSearchResult) => void;
  isOpen?: boolean;
};

export function ChatList({
  conversations,
  activeUserID,
  onSelect,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onStartConversation,
  isOpen,
}: ChatListProps) {
  return (
    <aside className={`chat-sidebar ${isOpen ? "chat-sidebar--open" : ""}`}>
      <div className="chat-sidebar__header">
        <h2>Messages</h2>
        <div className="chat-sidebar__search">
          <span className="chat-sidebar__search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            className="input-base"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search people..."
            value={searchQuery}
          />
        </div>

        {searchQuery.trim().length >= 1 ? (
          <div style={{ marginTop: '12px' }}>
            {isSearching ? (
              <p className="text-muted text-sm" style={{ padding: '4px 0' }}>Searching...</p>
            ) : null}

            {!isSearching && searchResults.length === 0 ? (
              <p className="text-muted text-sm" style={{ padding: '4px 0' }}>No matching users found.</p>
            ) : null}

            {searchResults.map((user) => (
              <button
                key={user.id}
                className={`user-list-item ${activeUserID === user.id ? "active" : ""}`}
                onClick={() => onStartConversation(user)}
                type="button"
              >
                <div className="user-avatar">
                  {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt={user.username} className="user-avatar__img" />
                  ) : (
                    user.username.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="user-list-item__info">
                  <span className="font-medium text-sm">@{user.username}</span>
                  <span className="text-faint text-xs">Start conversation</span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="chat-sidebar__section-label">
        Recent
      </div>

      <div className="chat-sidebar__list">
        {conversations.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}>
            <div className="empty-state__icon">💬</div>
            <p className="text-sm">No conversations yet. Search for someone to start chatting.</p>
          </div>
        ) : null}

        {conversations.map((conversation) => (
          <button
            key={conversation.user_id}
            className={`user-list-item ${activeUserID === conversation.user_id ? "active" : ""}`}
            onClick={() => onSelect(conversation)}
            type="button"
          >
            <div className="user-avatar">
              {conversation.profile_picture_url ? (
                <img src={conversation.profile_picture_url} alt={conversation.username} className="user-avatar__img" />
              ) : (
                conversation.username.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="user-list-item__info">
              <div className="user-list-item__top">
                <span className="font-medium text-sm truncate">@{conversation.username}</span>
                {conversation.last_message_at ? (
                  <span className="text-faint text-xs" style={{ whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {formatRelativeDate(conversation.last_message_at).split(' ')[0]}
                  </span>
                ) : null}
              </div>
              <span className="text-muted text-xs truncate" style={{ display: 'block', marginTop: '2px' }}>
                {conversation.last_message || "No messages yet"}
              </span>
            </div>
            <UnreadBadge count={conversation.unread_count} />
          </button>
        ))}
      </div>
    </aside>
  );
}
