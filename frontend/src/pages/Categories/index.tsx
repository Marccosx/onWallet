import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {CategoryService} from '../../services/category.service';
import type { ICategory } from "../../types";
import { renderIcon, AVAILABLE_ICONS } from "../../utils/icons";
import { PageHeader } from "../../components/PageHeader";

export function Categories(){
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'EXPENSE',
        color: '#FF5722',
        icon: '🏷️',
        budgetLimit: 0
    });

    useEffect(()=>{
        loadCategories();
    }, [filterType]);

    const loadCategories = async()=>{
        try{
            setIsLoading(true);
            const data = await CategoryService.getAll(filterType === 'ALL' ? undefined : filterType);
            setCategories(data);
        }catch(error){
            console.error("Erro ao buscar categorias", error);
        }finally{
            setIsLoading(false);
        }
    };

  const handleDelete = async (id: string) =>{
      const result = await Swal.fire({
          title: 'Excluir Categoria?',
          text: "Se houver transações vinculadas a ela, ocorrerá um erro.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#ef4444',
          confirmButtonText: 'Sim, excluir',
          cancelButtonText: 'Cancelar'
      });

      if(result.isConfirmed){
          try{
              await CategoryService.delete(id);
              toast.success("Categoria excluída com sucesso!");
              loadCategories();
          }catch(error){
              toast.error("Erro! Pode haver transações vinculadas a essa categoria.");
          }
      }
  };

  const handleOpenNew = () => {
  setEditingId(null);
  setFormData({ name: '', type: 'EXPENSE', color: '#FF5722', icon: '🛒', budgetLimit: 0 });
  setShowIconPicker(false);
  setIsModalOpen(true);
};

const handleEdit = (category: ICategory) => {
  setEditingId(category.id);
  setFormData({
    name: category.name,
    type: category.type,
    color: category.color || '#CBD5E1',
    icon: category.icon || '🏷️',
    budgetLimit: category.budgetLimit || 0
  });
  setShowIconPicker(false);
  setIsModalOpen(true);
};

const handleSaveCategory = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const catData = {
      name: formData.name,
      type: formData.type as 'INCOME' | 'EXPENSE',
      color: formData.color,
      icon: formData.icon,
      budgetLimit: Number(formData.budgetLimit)
    };

    if (editingId) {
      await CategoryService.update(editingId, catData);
      toast.success("Categoria atualizada com sucesso!");
    } else {
      await CategoryService.create(catData);
      toast.success("Categoria criada com sucesso!");
    }
    
    setIsModalOpen(false);
    loadCategories();
  } catch (error) {
    toast.error("Erro ao salvar categoria. Verifique os dados.");
  }
};

  if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando categorias...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Cabeçalho */}
      <PageHeader 
        title="Categorias" 
        subtitle="Organize suas receitas e despesas" 
        buttonText="+ Nova Categoria" 
        onButtonClick={handleOpenNew} 
      />

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['ALL', 'INCOME', 'EXPENSE'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filterType === type 
                ? 'bg-gray-800 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {type === 'ALL' ? 'Todas' : type === 'INCOME' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(category => (
          <div key={category.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 relative group transition-all hover:shadow-md">
            
            <div 
              className="w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ backgroundColor: `${category.color}20`, color: category.color || '#333' }}
            >
              {renderIcon(category.icon, 24)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{category.name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase whitespace-nowrap">
                    {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
                  </span>
                  {(category.budgetLimit || 0) > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase whitespace-nowrap truncate max-w-full">
                          Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(category.budgetLimit || 0)}
                      </span>
                  )}
              </div>
            </div>

            {/* Ações (Hover) */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded px-1">
              <button onClick={() => handleEdit(category)} className="text-blue-500 hover:bg-blue-50 p-1 rounded cursor-pointer" title="Editar">✏️</button>
              <button onClick={() => handleDelete(category.id)} className="text-red-500 hover:bg-red-50 p-1 rounded cursor-pointer" title="Excluir">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Editar Categoria' : 'Adicionar Categoria'}</h2>
            
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Mercado, Salário..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as 'INCOME' | 'EXPENSE'})}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                >
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                  <div className="relative">
                    {/* Botão que mostra o emoji selecionado */}
                    <button 
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        className="w-full border border-gray-300 rounded-lg p-2 flex items-center justify-center bg-gray-50 h-11 hover:bg-gray-100 cursor-pointer transition-colors" 
                        style={{ color: formData.color }}
                    >
                        {renderIcon(formData.icon, 24)}
                    </button>
                    {/* Grid de opções de ícones */}
                    {showIconPicker && (
                        <div className="absolute top-12 left-0 w-64 p-2 border border-gray-200 rounded-lg bg-white shadow-xl grid grid-cols-6 gap-1 h-48 overflow-y-auto z-50">
                            {AVAILABLE_ICONS.map(iconName => (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => { setFormData({...formData, icon: iconName}); setShowIconPicker(false); }}
                                    className={`p-2 flex justify-center items-center rounded hover:bg-emerald-50 transition-colors cursor-pointer text-gray-600 hover:text-emerald-600 ${formData.icon === iconName ? 'bg-emerald-100 ring-1 ring-emerald-400 text-emerald-600' : ''}`}
                                >
                                    {renderIcon(iconName, 20)}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
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

              {formData.type === 'EXPENSE' && (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Mensal (Opcional)</label>
                      <input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.budgetLimit === 0 ? '' : formData.budgetLimit}
                          onChange={e => setFormData({...formData, budgetLimit: Number(e.target.value)})}
                          className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ex: 500.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">Defina um limite para te avisarmos se você extrapolar.</p>
                  </div>
              )}

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
                  {editingId ? 'Salvar Alterações' : 'Salvar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}