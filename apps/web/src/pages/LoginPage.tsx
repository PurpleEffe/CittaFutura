import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/area', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate('/area');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accesso non riuscito');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div>
            <h1 className="card-title text-3xl">Accedi</h1>
            <p className="text-sm text-base-content/70">
              Utilizza le credenziali fornite oppure crea un nuovo account per inviare richieste di
              soggiorno.
            </p>
          </div>
          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="form-control">
              <span className="label-text">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="input input-bordered"
              />
            </label>
            <label className="form-control">
              <span className="label-text">Password</span>
              <input
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="input input-bordered"
              />
            </label>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Accesso in corso…' : 'Accedi'}
            </button>
          </form>
          <p className="text-sm text-base-content/70">
            Non hai un account?{' '}
            <Link to="/register" className="link link-primary">
              Registrati ora
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
