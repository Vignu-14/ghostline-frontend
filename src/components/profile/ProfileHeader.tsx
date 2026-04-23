import { useAuth } from "../../hooks/useAuth";

interface ProfileHeaderProps {
  username: string;
  postCount: number;
  profilePictureUrl?: string | null;
  onAvatarClick?: () => void;
}

export function ProfileHeader({ username, postCount, profilePictureUrl, onAvatarClick }: ProfileHeaderProps) {
  const avatarSrc = profilePictureUrl;
  const firstLetter = username ? username.charAt(0).toUpperCase() : '?';

  return (
    <header className="profile-header">
      <div className="profile-header__avatar-container">
        <button 
          className="profile-header__avatar-btn"
          onClick={onAvatarClick}
          title="Change Profile Picture"
        >
          <div className="profile-header__avatar-wrapper">
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                alt={username} 
                className="profile-header__avatar"
              />
            ) : (
              <div className="profile-header__avatar-fallback">
                {firstLetter}
              </div>
            )}
            <div className="profile-header__avatar-overlay">
              <span>Edit</span>
            </div>
          </div>
        </button>
      </div>

      <div className="profile-header__info">
        <div className="profile-header__title-row">
          <h2 className="profile-header__username">{username}</h2>
        </div>

        <div className="profile-header__stats">
          <div className="profile-header__stat">
            <span className="profile-header__stat-value">{postCount}</span>
            <span className="profile-header__stat-label">tweets</span>
          </div>
        </div>
      </div>
    </header>
  );
}
