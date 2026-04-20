import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logoImage from "../../logo.png";
import { useAuth } from "../hooks/useAuth";
import { userRoleLabels } from "../utils/status-labels";

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    setIsOpen(false);
    navigate("/login");
  }

  return (
    <header className="top-nav-shell">
      <nav className="top-nav" aria-label="Основная навигация">
        <div className="top-nav-row">
          <NavLink to="/dashboard" className="top-nav-brand-block top-nav-brand-link" aria-label="На главную">
            <span className="top-nav-logo" aria-hidden="true">
              <BrandLogo />
            </span>
          </NavLink>

          <div className="top-nav-links top-nav-links-desktop">
            <NavLink to="/dashboard">Панель</NavLink>
            <NavLink to="/devices">Приборы</NavLink>
            {user?.role === "admin" ? <NavLink to="/audit">Аудит</NavLink> : null}
            {user?.role === "admin" ? <NavLink to="/users">Пользователи</NavLink> : null}
          </div>

          <div className="top-nav-user top-nav-user-desktop">
            <div className="top-nav-user-copy">
              <strong>{user?.fullName}</strong>
              <small>{user ? userRoleLabels[user.role] : ""}</small>
            </div>
            <button
              type="button"
              className="ghost-button top-nav-logout top-nav-icon-button"
              onClick={handleLogout}
              aria-label="Выйти"
              title="Выйти"
            >
              <LogoutIcon />
            </button>
          </div>

          <button
            type="button"
            className="top-nav-toggle"
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsOpen((value) => !value)}
          >
            Меню
          </button>
        </div>

        {isOpen ? (
          <div className="top-nav-mobile" id="mobile-nav">
            <div className="top-nav-links top-nav-links-mobile">
              <NavLink to="/dashboard">Панель</NavLink>
              <NavLink to="/devices">Приборы</NavLink>
              {user?.role === "admin" ? <NavLink to="/audit">Аудит</NavLink> : null}
              {user?.role === "admin" ? <NavLink to="/users">Пользователи</NavLink> : null}
            </div>
            <div className="top-nav-user top-nav-user-mobile">
              <div className="top-nav-user-copy">
                <strong>{user?.fullName}</strong>
                <small>{user ? userRoleLabels[user.role] : ""}</small>
              </div>
              <button
                type="button"
                className="ghost-button top-nav-logout top-nav-icon-button"
                onClick={handleLogout}
                aria-label="Выйти"
                title="Выйти"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}

function BrandLogo() {
  return <img src={logoImage} alt="NDT" />;
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 19.05 19.05"
      width="20"
      height="20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 3.7945813,9.3068532 H 10.102473"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 10.102473,9.3068532 7.8236618,7.0583536"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 10.102473,9.3068532 7.8236752,11.632994"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m 7.6253166,1.9134596 5.7800954,3.7e-6 c 1.024904,0 1.850007,0.827633 1.850007,1.855682 V 15.280859 c 0,1.028047 -0.825103,1.855681 -1.850007,1.855681 H 7.6253166"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
