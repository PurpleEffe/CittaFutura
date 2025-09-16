import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
      });
      navigate('/area');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrazione non riuscita');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-md">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <div>
            <h1 className="card-title text-3xl">Crea un nuovo account</h1>
            <p className="text-sm text-base-content/70">
              Con un account puoi inviare richieste di soggiorno, monitorare lo stato e dialogare con i
              gestori della rete.
            </p>
          </div>
          {error && (
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="form-control">
              <span className="label-text">Nome</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="input input-bordered"
                placeholder="Facoltativo"
              />
            </label>
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
                minLength={8}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="input input-bordered"
              />
            </label>
            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? 'Registrazione…' : 'Registrati'}
            </button>
          </form>
          <p className="text-sm text-base-content/70">
            Hai già un account?{' '}
            <Link to="/login" className="link link-primary">
              Accedi qui
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
