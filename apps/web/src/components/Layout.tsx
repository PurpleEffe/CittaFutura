import { Link, NavLink, useNavigate } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-primary text-white' : 'text-slate-700 hover:bg-slate-200'
  }`;

export function Layout({ children }: PropsWithChildren) {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-brand-secondary">
            Città Futura
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/case" className={navLinkClass}>
              Case
            </NavLink>
            {user && (
              <NavLink to="/area" className={navLinkClass}>
                Le mie richieste
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
                className="rounded px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Esci
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
          Progetto comunitario per la rete di accoglienza di Città Futura.
        </div>
      </footer>
    </div>
  );
}
