import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try { await login(email, password); }
    catch { setError('E-mail ou senha inválidos.'); }
    finally { setSubmitting(false); }
  };

  return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg border border-gray-100 space-y-5">
      <div><h1 className="text-3xl font-bold text-emerald-600">onWallet</h1><p className="text-gray-500 mt-2">Entre para cuidar das suas finanças.</p></div>
      <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label><input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
      <div><label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60">{submitting ? 'Entrando...' : 'Entrar'}</button>
    </form>
  </main>;
}
