import { useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/auth.service';

export function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    try { await AuthService.updateMe(name, email); await refresh(); toast.success('Perfil atualizado.'); }
    catch { toast.error('Não foi possível atualizar o perfil.'); }
  };
  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    try { await AuthService.changePassword(currentPassword, newPassword); toast.success('Senha alterada. Faça login novamente.'); window.dispatchEvent(new Event('onwallet:unauthorized')); }
    catch { toast.error('Confira a senha atual e a nova senha.'); }
  };

  return <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
    <h1 className="text-2xl font-bold text-gray-800">Minha conta</h1>
    <form onSubmit={saveProfile} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-lg">Dados pessoais</h2>
      <label className="block text-sm font-medium">Nome<input value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      <label className="block text-sm font-medium">E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      <button className="rounded-lg bg-emerald-600 text-white px-4 py-2 font-medium">Salvar dados</button>
    </form>
    <form onSubmit={savePassword} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-lg">Alterar senha</h2>
      <label className="block text-sm font-medium">Senha atual<input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      <label className="block text-sm font-medium">Nova senha<input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      <button className="rounded-lg bg-emerald-600 text-white px-4 py-2 font-medium">Alterar senha</button>
    </form>
  </main>;
}
