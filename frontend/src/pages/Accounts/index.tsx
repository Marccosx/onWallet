import { useEffect, useState } from 'react';
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { AccountService } from '../../services/account.service';
import type { IAccount } from '../../types';

export function Accounts() {
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controle do Modal e Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECKING',
    balance: 0,
    color: '#8A05BE'
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await AccountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error("Erro ao buscar contas", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNewAccount = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'CHECKING', balance: 0, color: '#8A05BE' });
    setIsModalOpen(true);
  };

  const handleEdit = (account: IAccount) => {
    setEditingId(account.id);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      color: account.color || '#CBD5E1'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
        title: 'Excluir Conta?',
        text: "Tem certeza que deseja excluir esta conta? Isso pode falhar se houver transações vinculadas.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await AccountService.delete(id);
        toast.success("Conta excluída com sucesso!");
        loadAccounts();
      } catch (error) {
        toast.error("Erro ao excluir conta. Verifique se existem transações vinculadas a ela.");
      }
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accountData = {
        name: formData.name,
        type: formData.type as any,
        balance: Number(formData.balance),
        color: formData.color,
      };

      if (editingId) {
        await AccountService.update(editingId, accountData);
        toast.success("Conta atualizada com sucesso!");
      } else {
        await AccountService.create(accountData);
        toast.success("Conta criada com sucesso!");
      }
      
      setIsModalOpen(false);
      loadAccounts();
    } catch (error) {
      toast.error("Erro ao salvar conta. Verifique os dados.");
    }
  };

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando contas...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Minhas Contas</h1>
          <p className="text-gray-500 text-sm">Gerencie suas carteiras e cartões</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right border-r pr-6 border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Saldo Total</p>
            <p className="text-3xl font-bold text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
            </p>
          </div>
          
          <button 
            onClick={handleOpenNewAccount}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            + Nova Conta
          </button>
        </div>
      </div>

      {/* Grid de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden transition-all hover:shadow-md group">
            <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: account.color || '#CBD5E1' }} />
            
            <div className="ml-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{account.name}</h3>
                  <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mt-1">
                    {account.type}
                  </p>
                </div>
                
                {/* Botões de Ação (Aparecem no hover da linha) */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(account)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded cursor-pointer transition-colors" title="Editar">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(account.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded cursor-pointer transition-colors" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>

              <p className="mt-4 text-2xl font-medium text-gray-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE NOVA/EDITAR CONTA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Conta' : 'Adicionar Conta'}</h2>
            
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Nubank, Carteira..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                >
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="SAVINGS">Poupança</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="CASH">Dinheiro Vivo</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Atual (R$)</label>
                  <input 
                    type="number" step="0.01" required
                    value={formData.balance}
                    onChange={e => setFormData({...formData, balance: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <input 
                    type="color" 
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    className="h-11 w-14 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  {editingId ? 'Salvar Alterações' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}