import { Link } from "react-router-dom";
import { PostFeed } from "../components/post/PostFeed";
import { UserSearchPanel } from "../components/user/UserSearchPanel";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="reveal-up">
        <section className="hero">
          <h1>Welcome to RepoTalk</h1>
          <p>
            A private social space built on trust, speed, and real connections.
            No algorithms — just you and your network.
          </p>
          <div className="hero__actions">
            <Link className="btn btn-primary" to="/register">
              Get started free
            </Link>
            <Link className="btn btn-outline" to="/login">
              Sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="dashboard-header">
        <h1>Welcome back, @{user.username} 👋</h1>
        <p>Your feed and network at a glance.</p>
        <div className="dashboard-quick-actions">
          <Link className="btn btn-primary btn--sm" to="/chat">
            💬 Open Chat
          </Link>
          <Link className="btn btn-outline btn--sm" to={`/u/${user.username}`}>
            👤 View Profile
          </Link>
        </div>
      </header>

      <section className="dashboard-grid">
        <aside>
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 24px)' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Discover People</h2>
            <UserSearchPanel />
          </div>
        </aside>

        <section>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '24px' }}>Live Feed</h2>
            <PostFeed />
          </div>
        </section>
      </section>
    </div>
  );
}
