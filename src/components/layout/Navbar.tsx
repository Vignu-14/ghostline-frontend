import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { APP_NAME } from "../../utils/constants";
import { LogoutButton } from "../auth/LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <NavLink className="navbar-brand" to="/">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        <span>{APP_NAME}</span>
      </NavLink>

      <nav className="navbar-links">
        <NavLink to="/">Feed</NavLink>
        <NavLink to="/chat">Chat</NavLink>
        {user?.role === "admin" ? <NavLink to="/admin">Admin</NavLink> : null}
      </nav>

      <div className="navbar-actions">
        <ThemeToggle />
        {user ? (
          <>
            <NavLink
              className="btn btn-outline"
              style={{ padding: '7px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem' }}
              to={`/u/${user.username}`}
            >
              @{user.username}
            </NavLink>
            <LogoutButton />
          </>
        ) : (
          <>
            <NavLink className="btn btn-ghost" to="/login">Sign in</NavLink>
            <NavLink className="btn btn-primary" style={{ padding: '8px 18px' }} to="/register">Get started</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
