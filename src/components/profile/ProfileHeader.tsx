import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProfileHeaderProps {
  userId: string;
  username: string;
  postCount: number;
  profilePictureUrl?: string | null;
  onAvatarClick?: () => void;
}

const expertiseChips = [
  "React", "TypeScript", "UI Design", "Design Systems", "Node.js", "Open Source"
];

const connectionLinks = [
  { icon: "camera_alt", label: "instagram.com", handle: "" },
  { icon: "business_center", label: "linkedin.com/in/", handle: "" },
  { icon: "alternate_email", label: "@", handle: "" },
];

export function ProfileHeader({ userId, username, postCount, profilePictureUrl, onAvatarClick }: ProfileHeaderProps) {
  const { user } = useAuth();
  const avatarSrc = profilePictureUrl;
  const firstLetter = username ? username.charAt(0).toUpperCase() : '?';
  const isOwnProfile = user?.username === username;

  return (
    <header className="profile-header-v2">
      {/* Cover / Top Section */}
      <div className="profile-header-v2__top">
        <div className="profile-header-v2__avatar-area">
          <button 
            className="profile-header-v2__avatar-btn"
            onClick={onAvatarClick}
            title={isOwnProfile ? "Change Profile Picture" : username}
          >
            <div className="profile-header-v2__avatar-wrapper">
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt={username} 
                  className="profile-header-v2__avatar"
                />
              ) : (
                <div className="profile-header-v2__avatar-fallback">
                  {firstLetter}
                </div>
              )}
              {isOwnProfile && (
                <div className="profile-header-v2__avatar-overlay">
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="profile-header-v2__identity">
          <h1 className="profile-header-v2__display-name">{username}</h1>
          <p className="profile-header-v2__handle">@{username}</p>
          <p className="profile-header-v2__bio">
            Passionate about clean code, UI design systems, and open-source tooling.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="profile-header-v2__stats-row">
        <div className="profile-header-v2__stat">
          <span className="profile-header-v2__stat-value">{postCount}</span>
          <span className="profile-header-v2__stat-label">Posts</span>
        </div>
        <div className="profile-header-v2__stat-divider" />
        <div className="profile-header-v2__stat">
          <span className="profile-header-v2__stat-value">—</span>
          <span className="profile-header-v2__stat-label">Followers</span>
        </div>
        <div className="profile-header-v2__stat-divider" />
        <div className="profile-header-v2__stat">
          <span className="profile-header-v2__stat-value">—</span>
          <span className="profile-header-v2__stat-label">Following</span>
        </div>
      </div>

      {/* Action Buttons */}
      {!isOwnProfile && (
        <div className="profile-header-v2__actions">
          <Link 
            to={`/chat?u=${userId}&n=${username}`} 
            className="profile-header-v2__action-btn profile-header-v2__action-btn--primary"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Message
          </Link>
          <button className="profile-header-v2__action-btn profile-header-v2__action-btn--outline">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Follow
          </button>
        </div>
      )}


      {isOwnProfile && (
        <div className="profile-header-v2__actions">
          <button className="profile-header-v2__action-btn profile-header-v2__action-btn--outline" style={{ flex: 1 }}>
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
        </div>
      )}

      {/* Expertise Section */}
      <div className="profile-header-v2__section">
        <h3 className="profile-header-v2__section-title">Expertise</h3>
        <div className="profile-header-v2__chips">
          {expertiseChips.map((chip) => (
            <span key={chip} className="profile-header-v2__chip">{chip}</span>
          ))}
        </div>
      </div>

      {/* Connections Section */}
      <div className="profile-header-v2__section">
        <h3 className="profile-header-v2__section-title">Connections</h3>
        <div className="profile-header-v2__connections">
          {connectionLinks.map((link) => (
            <a key={link.icon} href="#" className="profile-header-v2__connection-link">
              <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
              <span>{link.label}{username}</span>
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
