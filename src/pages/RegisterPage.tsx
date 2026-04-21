import { Link } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";

export function RegisterPage() {
  return (
    <main className="auth-container">
      <div className="auth-hero">
        <div className="auth-hero__content">
          <div className="auth-hero__brand">Ghostline</div>
          <p className="auth-hero__tagline">
            Join a social space designed around trust, simplicity, and meaningful interactions.
          </p>
          <div className="auth-hero__features">
            <div className="auth-hero__feature">
              <span className="auth-hero__feature-icon">✨</span>
              <span>Set up your account in seconds</span>
            </div>
            <div className="auth-hero__feature">
              <span className="auth-hero__feature-icon">💬</span>
              <span>Start chatting and sharing instantly</span>
            </div>
            <div className="auth-hero__feature">
              <span className="auth-hero__feature-icon">🎯</span>
              <span>No ads, no algorithms — just your network</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card reveal-up">
          <h1>Create your account</h1>
          <p className="subtitle">It only takes a moment to get started.</p>
          <RegisterForm />
          <p className="auth-link">
            Already on Ghostline? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
