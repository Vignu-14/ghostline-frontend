import { useState } from "react";
import type { Conversation } from "../../types/message";
import type { UserSearchResult } from "../../types/user";
import { formatRelativeDate } from "../../utils/formatDate";

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
}: ChatListProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Unread", "Favourites", "Groups"];

  return (
    <aside className="chat-list-pane">
      {/* Header */}
      <header className="chat-list-pane__header">
        <h1 className="chat-list-pane__title">Chats</h1>
        <div className="chat-list-pane__header-actions">
          <button className="chat-list-pane__icon-btn" title="New chat">
            <span className="material-symbols-outlined text-[20px]">add_box</span>
          </button>
          <button className="chat-list-pane__icon-btn" title="More">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="chat-list-pane__search">
        <span className="material-symbols-outlined chat-list-pane__search-icon">search</span>
        <input
          type="text"
          className="chat-list-pane__search-input"
          placeholder="Search or start a new chat"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div className="chat-list-pane__filters">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`chat-list-pane__filter-chip ${
              activeFilter === filter ? 'chat-list-pane__filter-chip--active' : ''
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="chat-list-pane__list">
        {searchQuery.trim().length >= 1 ? (
          <div className="chat-list-pane__search-results">
            <p className="chat-list-pane__section-label">Global Search</p>
            {isSearching && (
              <div className="chat-list-pane__loading">
                <div className="chat-list-pane__spinner"></div>
              </div>
            )}
            {!isSearching && searchResults.length === 0 && (
              <p className="chat-list-pane__no-results">No users found</p>
            )}
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => onStartConversation(user)}
                className="chat-list-pane__conversation-item"
              >
                <div className="chat-list-pane__avatar">
                  {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt={user.username} />
                  ) : (
                    <span>{user.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="chat-list-pane__conv-info">
                  <p className="chat-list-pane__conv-name">@{user.username}</p>
                  <p className="chat-list-pane__conv-preview chat-list-pane__conv-preview--accent">Start conversation</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <>
            {conversations.length === 0 ? (
              <div className="chat-list-pane__empty">
                <span className="material-symbols-outlined text-[40px]">chat</span>
                <p>No conversations yet</p>
                <p className="chat-list-pane__empty-sub">Search for someone to start chatting</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.user_id}
                  onClick={() => onSelect(conversation)}
                  className={`chat-list-pane__conversation-item ${
                    activeUserID === conversation.user_id ? 'chat-list-pane__conversation-item--active' : ''
                  }`}
                >
                  <div className="chat-list-pane__avatar-wrapper">
                    <div className="chat-list-pane__avatar">
                      {conversation.profile_picture_url ? (
                        <img src={conversation.profile_picture_url} alt={conversation.username} />
                      ) : (
                        <span>{conversation.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="chat-list-pane__online-dot"></div>
                  </div>

                  <div className="chat-list-pane__conv-info">
                    <div className="chat-list-pane__conv-top">
                      <p className={`chat-list-pane__conv-name ${conversation.unread_count > 0 ? 'chat-list-pane__conv-name--unread' : ''}`}>
                        {conversation.username}
                      </p>
                      {conversation.last_message_at && (
                        <span className={`chat-list-pane__conv-time ${conversation.unread_count > 0 ? 'chat-list-pane__conv-time--unread' : ''}`}>
                          {formatRelativeDate(conversation.last_message_at).split(' ')[0]}
                        </span>
                      )}
                    </div>
                    <div className="chat-list-pane__conv-bottom">
                      <p className={`chat-list-pane__conv-preview ${conversation.unread_count > 0 ? 'chat-list-pane__conv-preview--unread' : ''}`}>
                        {conversation.last_message || "No messages yet"}
                      </p>
                      {conversation.unread_count > 0 && (
                        <div className="chat-list-pane__unread-badge">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
}
