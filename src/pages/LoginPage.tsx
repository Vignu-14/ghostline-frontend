import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";

export function LoginPage() {
  return (
    <main className="auth-container">
      <div className="auth-hero">
        <div className="auth-hero__content">
          <div className="auth-hero__brand">Ghostline</div>
          <p className="auth-hero__tagline">
            Where real conversations happen. Private, fast, and built for genuine connection.
          </p>
          <div className="auth-hero__features">
            <div className="auth-hero__feature">
              <span className="auth-hero__feature-icon">🔒</span>
              <span>Private by design — your data stays yours</span>
            </div>
            <div className="auth-hero__feature">
              <span className="auth-hero__feature-icon">⚡</span>
              <span>Real-time messaging with voice calling</span>
            </div>
            <div className="auth-hero__feature">
              <span className="auth-hero__feature-icon">🌐</span>
              <span>Share thoughts and moments with your network</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card reveal-up">
          <h1>Welcome back</h1>
          <p className="subtitle">Sign in to continue where you left off.</p>
          <LoginForm />
          <p className="auth-link">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
