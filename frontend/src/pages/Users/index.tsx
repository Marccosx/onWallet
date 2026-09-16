import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService, type AuthUser } from '../../services/auth.service';

export function Users() {
  const { user: current } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [busy, setBusy] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = async () => { try { setUsers(await AuthService.listUsers()); } catch { toast.error('Não foi possível carregar os usuários.'); } };
  useEffect(() => { void load(); }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      await AuthService.createUser({ name, email, password, role });
      setName(''); setEmail(''); setPassword(''); setRole('USER');
      toast.success('Usuário criado.'); await load();
    } catch { toast.error('Não foi possível criar o usuário. Verifique o e-mail e a senha.'); }
    finally { setBusy(false); }
  };

  const update = async (target: AuthUser, data: Partial<AuthUser> & { password?: string }) => {
    try { await AuthService.updateUser(target.id, data); toast.success('Usuário atualizado.'); await load(); }
    catch { toast.error('Não foi possível atualizar o usuário.'); }
  };

  return <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-800">Usuários</h1><p className="text-gray-500">Gerencie quem pode acessar o onWallet.</p></div>
    <form onSubmit={create} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 grid gap-4 md:grid-cols-2">
      <h2 className="font-semibold text-lg md:col-span-2">Novo usuário</h2>
      <label className="text-sm font-medium">Nome<input value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      <label className="text-sm font-medium">E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      <label className="text-sm font-medium">Senha inicial<input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      <label className="text-sm font-medium">Papel<select value={role} onChange={e => setRole(e.target.value as 'USER' | 'ADMIN')} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"><option value="USER">Usuário</option><option value="ADMIN">Administrador</option></select></label>
      <button disabled={busy} className="md:col-span-2 justify-self-start rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium disabled:opacity-60">Criar usuário</button>
    </form>
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
      <table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Nome</th><th className="p-4">E-mail</th><th className="p-4">Papel</th><th className="p-4">Estado</th><th className="p-4">Ações</th></tr></thead>
        <tbody className="divide-y divide-gray-100">{users.map(user => <tr key={user.id}>
          <td className="p-4 font-medium">{user.name}</td><td className="p-4">{user.email}</td><td className="p-4">{user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</td><td className="p-4">{user.isActive ? 'Ativo' : 'Inativo'}</td>
          <td className="p-4"><div className="flex flex-wrap gap-2">
            <button onClick={() => { const name = window.prompt('Novo nome', user.name); if (name?.trim()) void update(user, { name }); }} className="text-blue-600">Editar nome</button>
            <button onClick={() => { const email = window.prompt('Novo e-mail', user.email); if (email?.trim()) void update(user, { email }); }} className="text-blue-600">Editar e-mail</button>
            <button onClick={() => { setResetId(user.id); setNewPassword(''); }} className="text-blue-600">Redefinir senha</button>
            {user.id !== current?.id && <><button onClick={() => void update(user, { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })} className="text-blue-600">Alterar papel</button><button onClick={() => void update(user, { isActive: !user.isActive })} className={user.isActive ? 'text-red-600' : 'text-emerald-600'}>{user.isActive ? 'Desativar' : 'Ativar'}</button></>}
          </div>{resetId === user.id && <form onSubmit={async (event) => { event.preventDefault(); await update(user, { password: newPassword }); setResetId(null); setNewPassword(''); }} className="mt-2 flex gap-2"><input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="Nova senha" className="w-36 rounded border border-gray-300 px-2 py-1" /><button className="text-emerald-700">Salvar</button><button type="button" onClick={() => setResetId(null)} className="text-gray-500">Cancelar</button></form>}</td>
        </tr>)}</tbody></table>
    </section>
  </main>;
}
