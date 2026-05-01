import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function MobileNav() {
  const { user } = useAuth();

  return (
    <nav aria-label="Mobile navigation" className="mobile-nav">
      <div className="mobile-nav__shell">
        <NavLink end to="/">
          <span className="material-symbols-outlined mobile-nav__icon">home</span>
          Feed
        </NavLink>
        <NavLink to="/chat">
          <span className="material-symbols-outlined mobile-nav__icon">chat</span>
          Chat
        </NavLink>
        {user ? (
          <>
            <NavLink to={`/u/${user.username}`}>
              <span className="material-symbols-outlined mobile-nav__icon">person</span>
              Profile
            </NavLink>
            {user.role === "admin" ? (
              <NavLink to="/admin">
                <span className="material-symbols-outlined mobile-nav__icon">admin_panel_settings</span>
                Admin
              </NavLink>
            ) : null}
          </>
        ) : (
          <>
            <NavLink to="/login">
              <span className="material-symbols-outlined mobile-nav__icon">login</span>
              Login
            </NavLink>
            <NavLink to="/register">
              <span className="material-symbols-outlined mobile-nav__icon">person_add</span>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
