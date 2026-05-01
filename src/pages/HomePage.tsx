import { Link } from "react-router-dom";
import { PostFeed } from "../components/post/PostFeed";
import { UserSearchPanel } from "../components/user/UserSearchPanel";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="reveal-up">
        <section className="hero-v2">
          <div className="hero-v2__content">
            <div className="hero-v2__badge">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Private & Secure
            </div>
            <h1 className="hero-v2__title">Welcome to <span className="hero-v2__brand">RepoTalk</span></h1>
            <p className="hero-v2__subtitle">
              A private social space built on trust, speed, and real connections.
              No algorithms — just you and your network.
            </p>
            <div className="hero-v2__actions">
              <Link className="hero-v2__btn hero-v2__btn--primary" to="/register">
                Get started free
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link className="hero-v2__btn hero-v2__btn--outline" to="/login">
                Sign in
              </Link>
            </div>
            <div className="hero-v2__features">
              <div className="hero-v2__feature">
                <span className="material-symbols-outlined text-[20px]">lock</span>
                <span>End-to-end private messaging</span>
              </div>
              <div className="hero-v2__feature">
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                <span>Real-time sync with WebSocket</span>
              </div>
              <div className="hero-v2__feature">
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span>Share thoughts with your network</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <header className="dashboard-header-v2">
        <div className="dashboard-header-v2__greeting">
          <h1>Welcome back, @{user.username} 👋</h1>
          <p>Your feed and network at a glance.</p>
        </div>
        <div className="dashboard-header-v2__actions">
          <Link className="dashboard-action-btn dashboard-action-btn--primary" to="/chat">
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Open Chat
          </Link>
          <Link className="dashboard-action-btn dashboard-action-btn--outline" to={`/u/${user.username}`}>
            <span className="material-symbols-outlined text-[18px]">person</span>
            View Profile
          </Link>
        </div>
      </header>

      <section className="dashboard-grid-v2">
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar__card">
            <h2 className="dashboard-sidebar__title">
              <span className="material-symbols-outlined text-[20px]">group</span>
              Discover People
            </h2>
            <UserSearchPanel />
          </div>
        </aside>

        <section className="dashboard-feed">
          <div className="dashboard-feed__card">
            <h2 className="dashboard-feed__title">
              <span className="material-symbols-outlined text-[20px]">dynamic_feed</span>
              Live Feed
            </h2>
            <PostFeed />
          </div>
        </section>
      </section>
    </div>
  );
}
