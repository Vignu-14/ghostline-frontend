import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function MobileNav() {
  const { user } = useAuth();

  return (
    <nav aria-label="Mobile navigation" className="mobile-nav">
      <div className="mobile-nav__shell">
        <NavLink to="/">
          <span className="mobile-nav__icon">🏠</span>
          Feed
        </NavLink>
        <NavLink to="/chat">
          <span className="mobile-nav__icon">💬</span>
          Chat
        </NavLink>
        {user ? (
          <>
            <NavLink to={`/u/${user.username}`}>
              <span className="mobile-nav__icon">👤</span>
              Profile
            </NavLink>
            {user.role === "admin" ? (
              <NavLink to="/admin">
                <span className="mobile-nav__icon">⚙️</span>
                Admin
              </NavLink>
            ) : null}
          </>
        ) : (
          <>
            <NavLink to="/login">
              <span className="mobile-nav__icon">🔑</span>
              Login
            </NavLink>
            <NavLink to="/register">
              <span className="mobile-nav__icon">✨</span>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
