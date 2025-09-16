import { Link, NavLink, useNavigate } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-sm ${
    isActive
      ? 'btn-primary text-primary-content'
      : 'btn-ghost text-base-content/80 hover:text-base-content'
  }`;

export function Layout({ children }: PropsWithChildren) {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <header className="sticky top-0 z-40 border-b border-base-200 bg-base-100/90 backdrop-blur">
        <div className="navbar mx-auto max-w-6xl px-4">
          <div className="flex-1">
            <Link to="/" className="text-xl font-bold text-primary">
              Città Futura
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/case" className={navLinkClass}>
              Case
            </NavLink>
            {user && (
              <NavLink to="/area" className={navLinkClass}>
                Area personale
              </NavLink>
            )}
            {user && (user.role === 'GESTORE' || user.role === 'ADMIN') && (
              <NavLink to="/gestione" className={navLinkClass}>
                Gestione
              </NavLink>
            )}
            {!user && !loading && (
              <NavLink to="/login" className={navLinkClass}>
                Accedi
              </NavLink>
            )}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
              >
                Esci
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
      <footer className="border-t border-base-200 bg-base-100">
        <div className="footer footer-center mx-auto max-w-6xl items-center px-4 py-8 text-sm text-base-content/70">
          <aside>
            <p className="font-semibold text-base-content">Città Futura – Prenotazioni</p>
            <p>Progetto solidale per la rete di accoglienza diffusa.</p>
          </aside>
        </div>
      </footer>
    </div>
  );
}
