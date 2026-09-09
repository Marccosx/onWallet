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
    tag: '',
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
      console.error("Erro ao buscar caixinhas", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: '', tag: '', balance: 0, color: '#8A05BE' });
    setIsModalOpen(true);
  };

  const handleEdit = (account: IAccount) => {
    setEditingId(account.id);
    setFormData({
      name: account.name,
      tag: account.tag || '',
      balance: account.balance,
      color: account.color || '#CBD5E1'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
        title: 'Excluir Caixinha?',
        text: "Tem certeza que deseja excluir esta Caixinha? Isso pode falhar se houver transações vinculadas.",
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
        toast.success("Caixinha excluída com sucesso!");
        loadAccounts();
      } catch (error) {
        toast.error("Erro ao excluir. Verifique se existem transações vinculadas a ela.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accountData = {
        name: formData.name,
        tag: formData.tag,
        balance: Number(formData.balance),
        color: formData.color,
      };

      if (editingId) {
        await AccountService.update(editingId, accountData);
        toast.success("Caixinha atualizada com sucesso!");
      } else {
        await AccountService.create(accountData);
        toast.success("Caixinha criada com sucesso!");
      }
      
      setIsModalOpen(false);
      loadAccounts();
    } catch (error) {
      toast.error("Erro ao salvar Caixinha. Verifique os dados.");
    }
  };

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando contas...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
              <h1 className="text-2xl font-bold text-gray-800">Caixinhas</h1>
              <p className="text-gray-500 text-sm">Gerencie o dinheiro guardado para seus objetivos</p>
          </div>
          <div className="text-right">
              <p className="text-sm font-medium text-gray-500 mb-1">Saldo Total</p>
              <p className="text-2xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
              </p>
          </div>
      </div>

          <div className="flex justify-end">
              <button 
                  onClick={handleOpenNew}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer shadow-sm"
              >
                  + Nova Caixinha
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                      Você ainda não criou nenhuma caixinha. Que tal guardar para uma "Viagem"?
                  </div>
              ) : (
                  accounts.map(account => (
                      <div key={account.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col relative group overflow-hidden transition-all hover:shadow-md">
                          <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: account.color }}></div>
                          
                          <div className="flex justify-between items-start mb-4 mt-2">
                              <div>
                                  <h3 className="font-bold text-gray-800 text-lg">{account.name}</h3>
                                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md mt-1 inline-block">
                                      {account.tag || 'Sem tag'}
                                  </span>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(account)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded cursor-pointer transition-colors">Editar</button>
                                  <button onClick={() => handleDelete(account.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded cursor-pointer transition-colors">Excluir</button>
                              </div>
                          </div>
                          
                          <div className="mt-auto pt-4 border-t border-gray-50">
                              <p className="text-sm text-gray-500 mb-1">Saldo Guardado</p>
                              <p className="text-2xl font-bold text-gray-800">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                              </p>
                          </div>
                      </div>
                  ))
              )}
          </div>

          {isModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                          <h2 className="text-xl font-bold text-gray-800">
                              {editingId ? 'Editar Caixinha' : 'Nova Caixinha'}
                          </h2>
                          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">&times;</button>
                      </div>
                      
                      <form onSubmit={handleSave} className="p-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Caixinha</label>
                              <input 
                                  required
                                  type="text" 
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                  value={formData.name}
                                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                                  placeholder="Ex: Viagem final de ano"
                              />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Tag (Objetivo)</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                      value={formData.tag}
                                      onChange={(e) => setFormData({...formData, tag: e.target.value})}
                                      placeholder="Ex: Férias"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                                  <div className="flex h-[42px] border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                                      <input 
                                          type="color" 
                                          className="h-full w-12 cursor-pointer border-0 p-0"
                                          value={formData.color}
                                          onChange={(e) => setFormData({...formData, color: e.target.value})}
                                      />
                                      <div className="flex-1 px-3 flex items-center bg-gray-50 text-gray-600 font-mono text-sm">
                                          {formData.color.toUpperCase()}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Atual (R$)</label>
                              <input 
                                  required
                                  type="number" 
                                  step="0.01"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                  value={formData.balance === 0 ? '' : formData.balance}
                                  onChange={(e) => setFormData({...formData, balance: Number(e.target.value)})}
                                  placeholder="0.00"
                              />
                              <p className="text-xs text-gray-500 mt-1">Coloque o valor que já existe guardado nela.</p>
                          </div>

                          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer">Cancelar</button>
                              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors cursor-pointer">Salvar</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );
}