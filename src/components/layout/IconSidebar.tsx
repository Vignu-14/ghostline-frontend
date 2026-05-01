import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function IconSidebar() {
  const { user } = useAuth();
  const firstLetter = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  const navItems = [
    { icon: "chat", label: "Chats", path: "/chat", active: true },
    { icon: "call", label: "Calls", path: "#" },
    { icon: "update", label: "Status", path: "#" },
    { icon: "forum", label: "Channels", path: "#" },
    { icon: "group", label: "Communities", path: "#" },
  ];

  return (
    <nav className="chat-icon-sidebar">
      {/* Top nav icons */}
      <div className="chat-icon-sidebar__top">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`chat-icon-sidebar__btn ${item.active ? 'chat-icon-sidebar__btn--active' : ''}`}
            title={item.label}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: item.active ? "'FILL' 1" : "" }}
            >
              {item.icon}
            </span>
          </Link>
        ))}
      </div>

      {/* Bottom: settings + avatar */}
      <div className="chat-icon-sidebar__bottom">
        <Link to="#" className="chat-icon-sidebar__btn" title="Settings">
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </Link>
        <Link
          to={user ? `/u/${user.username}` : '/login'}
          className="chat-icon-sidebar__avatar"
          title={user?.username || 'Profile'}
        >
          {user?.profile_picture_url ? (
            <img src={user.profile_picture_url} alt={user.username} />
          ) : (
            <span>{firstLetter}</span>
          )}
        </Link>
      </div>
    </nav>
  );
}
