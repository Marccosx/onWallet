import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { BudgetService } from "../../services/budget.service";
import type { IBudget, ICategory } from "../../types";
import CategoryService from "../../services/category.service";

export function Budgets() {
    const [budgets, setBudgets] = useState<IBudget[]>([]);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [filterDate, setFilterDate] = useState<string>(
        new Date().toISOString().substring(0, 7)
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState('');
    const [formData, setFormData] = useState({
        categoryId: '',
        month: '',
        limit: 0,
    });

    useEffect(() => {
        loadData();
    }, [filterDate])

    const loadData = async () => {
        try {
            setIsLoading(true);
            const dataCategories = await CategoryService.getAll();
            setCategories(dataCategories);
        } catch (error) {
            console.error("Erro ao buscar as categorias", error)
        } finally {
            setIsLoading(false);
        }

        try {
            setIsLoading(true);
            const dataBudgets = await BudgetService.getAll(filterDate);
            setBudgets(dataBudgets);
        } catch (error) {
            console.error("Erro ao buscar os orçamentos", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Excluir Orçamento?',
            text: "Você tem certeza que deseja remover este limite de gastos?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                setIsLoading(true);
                await BudgetService.delete(id);
                toast.success("Orçamento excluído com sucesso!");
                loadData();
            } catch (error) {
                console.error("Erro ao excluir o Orçamento", error);
                toast.error("Erro ao excluir o Orçamento.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOpenNew = () => {
        setEditingId('');
        setFormData({ month: '', categoryId: '', limit: 0 });
        setIsModalOpen(true);
    };

    const handleEdit = (budget: IBudget) => {
        setEditingId(budget.id);
        setFormData({
            categoryId: budget.categoryId,
            limit: budget.limit,
            month: budget.month.split('T')[0]
        })
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const transData = {
                categoryId: formData.categoryId,
                limit: formData.limit,
                month: new Date(formData.month + 'T00:00:00').toISOString()
            };

            if (editingId) {
                await BudgetService.update(editingId, transData);
                toast.success("Orçamento atualizado!");
            } else {
                await BudgetService.create(transData);
                toast.success("Orçamento criado!");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Erro ao Salvar dados", error);
            toast.error("Erro ao salvar orçamento. Verifique se já não existe um para esta categoria no mês.");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando dados...</div>
    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Orçamentos</h1>
                    <p className="text-gray-500 text-sm">Defina limites de gastos para cada categoria</p>
                </div>
                <button
                    onClick={handleOpenNew}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
                >
                    + Novo Orçamento
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filterDate">Filtrar por Mês</label>
                    <input
                        id="filterDate"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        type="month"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Lista de Orçamentos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {budgets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhum orçamento definido para este período.
                    </div>
                ) : (
                    <>
                        {/* VISUALIZAÇÃO DESKTOP (Tabela) */}
                        <table className="hidden md:table w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Categoria</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Mês Ref.</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">Progresso</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Limite (R$)</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {budgets.map(budget => {
                                    const category = categories.find(c => c.id === budget.categoryId);

                                    // Extraindo Mês/Ano amigável (ex: 09/2026)
                                    const budgetDate = budget.month ? new Date(budget.month) : null;
                                    const monthDisplay = budgetDate
                                        ? `${String(budgetDate.getUTCMonth() + 1).padStart(2, '0')}/${budgetDate.getUTCFullYear()}`
                                        : '-';

                                    // Lógica de Progresso
                                    const spent = budget.spent || 0;
                                    const percentage = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
                                    const isOverBudget = spent > budget.limit;

                                    return (
                                        <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">
                                                {category ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${category.color}15`, color: category.color, borderColor: `${category.color}30` }}>
                                                        {category.name}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">
                                                {monthDisplay}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 w-48">
                                                    <div className="flex justify-between text-xs">
                                                        <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                                                            Gasto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)}
                                                        </span>
                                                        <span className="text-gray-500">{percentage.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-700">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.limit)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleEdit(budget)}
                                                    className="text-blue-600 hover:text-blue-800 mr-3 font-medium text-sm transition-colors cursor-pointer"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(budget.id)}
                                                    className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors cursor-pointer"
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* VISUALIZAÇÃO MOBILE (Cards) */}
                        <div className="md:hidden flex flex-col divide-y divide-gray-100">
                            {budgets.map(budget => {
                                const category = categories.find(c => c.id === budget.categoryId);

                                const budgetDate = budget.month ? new Date(budget.month) : null;
                                const monthDisplay = budgetDate
                                    ? `${String(budgetDate.getUTCMonth() + 1).padStart(2, '0')}/${budgetDate.getUTCFullYear()}`
                                    : '-';

                                const spent = budget.spent || 0;
                                const percentage = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
                                const isOverBudget = spent > budget.limit;

                                return (
                                    <div key={budget.id} className="p-4 bg-white hover:bg-gray-50 transition-colors flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {category ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${category.color}15`, color: category.color, borderColor: `${category.color}30` }}>
                                                        {category.name}
                                                    </span>
                                                ) : '-'}
                                                <span className="text-xs text-gray-500 font-medium">{monthDisplay}</span>
                                            </div>
                                            <div className="flex gap-3 text-xs font-medium">
                                                <button onClick={() => handleEdit(budget)} className="text-blue-600">Editar</button>
                                                <button onClick={() => handleDelete(budget.id)} className="text-red-600">Excluir</button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 w-full mt-1">
                                            <div className="flex justify-between text-xs">
                                                <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                                                    Gasto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)}
                                                </span>
                                                <span className="text-gray-700 font-bold">
                                                    Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.limit)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                <div
                                                    className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? 'Editar Orçamento' : 'Novo Orçamento'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mês de Referência</label>
                                    <input
                                        required
                                        type="month"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={formData.month ? formData.month.substring(0, 7) : ''} // Pega apenas YYYY-MM
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (Somente Despesas)</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    >
                                        <option value="" disabled>Selecione uma categoria...</option>
                                        {categories
                                            .filter(cat => cat.type === 'EXPENSE') // Orçamentos costumam fazer sentido apenas para gastos
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite (R$)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={formData.limit || ''}
                                        onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
                                        placeholder="Ex: 500,00"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}