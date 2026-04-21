import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="center-stage">
      <div className="panel reveal-up" style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
        <p className="eyebrow">404</p>
        <h1 style={{ fontSize: '1.5rem', marginTop: '8px', marginBottom: '12px' }}>
          Page not found
        </h1>
        <p className="support-copy" style={{ marginBottom: '24px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link className="btn btn-primary" to="/">
          Go back home
        </Link>
      </div>
    </main>
  );
}
