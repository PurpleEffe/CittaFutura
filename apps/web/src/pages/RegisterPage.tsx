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
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-secondary">Crea un nuovo account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Con un account puoi richiedere soggiorni e seguire lo stato delle tue prenotazioni.
      </p>
      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="Facoltativo"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-secondary disabled:opacity-70"
        >
          {submitting ? 'Registrazione…' : 'Registrati'}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Hai già un account?{' '}
        <Link to="/login" className="text-brand-primary hover:underline">
          Accedi qui
        </Link>
        .
      </p>
    </section>
  );
}
