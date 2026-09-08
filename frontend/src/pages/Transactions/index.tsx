import React, { useEffect, useState } from "react";
import { TransactionService } from '../../services/transaction.service';
import type { IAccount, ICategory, ITransaction } from "../../types";
import { CategoryService } from "../../services/category.service";
import { AccountService } from "../../services/account.service";

export function Transactions() {
    const today = new Date().toISOString().split('T')[0];
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [accounts, setAccounts] = useState<IAccount[]>([]);
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [filterDate, setFilterDate] = useState<string>("");
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: 0,
        type: '',
        accountId: '',
        categoryId: '',
        date: ''
    })

    useEffect(() => {
        loadData();
    }, [filterDate, filterType])

    const loadData = async () => {
        try {
            setIsLoading(true);
            const dataCategories = await CategoryService.getAll(filterType === 'ALL' ? undefined : filterType);
            setCategories(dataCategories);
        } catch (error) {
            console.error("Error ao buscar categorias", error)
        }
        try {
            const dataAccounts = await AccountService.getAll();
            setAccounts(dataAccounts);
        } catch (error) {
            console.error("Error ao buscar Contas", error)
        }
        try {
            const dataTransactions = await TransactionService.getAll(filterDate);
            setTransactions(dataTransactions);
        } catch (error) {
            console.error("Error ao buscar Transação", error)
        } finally {
            setIsLoading(false);
        }

    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Deseja excluir essa categoria?")) {
            try {
                setIsLoading(true);
                await TransactionService.delete(id);
                loadData();
            } catch (error) {
                console.error("Erro ao excluir a Transação", error)
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setFormData({ description: '', type: 'EXPENSE', amount: 0, accountId: '', categoryId: '', date: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (transaction: ITransaction) => {
        setEditingId(transaction.id);
        setFormData({
            description: transaction.description,
            type: transaction.type,
            amount: transaction.amount,
            accountId: transaction.accountId,
            categoryId: transaction.categoryId,
            date: transaction.create_at.split('T')[0]
        })
        setIsModalOpen(true);
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const transData = {
                description: formData.description,
                type: formData.type as 'INCOME' | 'EXPENSE',
                amount: formData.amount,
                accountId: formData.accountId,
                categoryId: formData.categoryId,
                create_at: new Date(formData.date + 'T00:00:00').toISOString()
            };

            if (editingId) {
                await TransactionService.update(editingId, transData)
            } else {
                await TransactionService.create(transData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Erro ao Salvar dados", error)
            alert("Error ao salvar transação. Verifique os dados");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando Transações</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Transações</h1>
                    <p className="text-gray-500 text-sm">Armazene seus gastos e receitas</p>
                </div>
                <button 
                    onClick={handleOpenNew}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
                >
                    + Nova Transação
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filterDate">Filtrar por Mês/Data</label>
                    <input 
                        id="filterDate"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                        type="month" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filterType">Tipo</label>
                    <select 
                        id="filterType"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                    >
                        <option value="ALL">Todos</option>
                        <option value="INCOME">Receitas</option>
                        <option value="EXPENSE">Despesas</option>
                    </select>
                </div>
            </div>

            {/* Lista de Transações */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma transação encontrada.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Descrição</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Categoria</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Conta</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Data</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Valor</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map(transaction => {
                                const category = categories.find(c => c.id === transaction.categoryId);
                                const account = accounts.find(a => a.id === transaction.accountId);
                                const isExpense = transaction.type === 'EXPENSE';

                                return (
                                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-800">{transaction.description}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {category ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${category.color}15`, color: category.color, borderColor: `${category.color}30` }}>
                                                    {category.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{account?.name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {/* Ajuste simples para não quebrar caso a data seja inválida */}
                                            {transaction.create_at ? new Date(transaction.create_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {isExpense ? '-' : '+'} 
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleEdit(transaction)}
                                                className="text-blue-600 hover:text-blue-800 mr-3 font-medium text-sm transition-colors cursor-pointer"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(transaction.id)}
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
                )}
            </div>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? 'Editar Transação' : 'Nova Transação'}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="type" 
                                                value="EXPENSE"
                                                checked={formData.type === 'EXPENSE'}
                                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-gray-700">Despesa</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="type" 
                                                value="INCOME"
                                                checked={formData.type === 'INCOME'}
                                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-gray-700">Receita</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Ex: Conta de Luz"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                                    <input 
                                        required
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={formData.amount || ''}
                                        onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                        <input 
                                            required
                                            type="date" 
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                            value={formData.date ? formData.date.split('T')[0] : ''}
                                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                                            max={today}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
                                        <select 
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                                            value={formData.accountId}
                                            onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                    >
                                        <option value="" disabled>Selecione...</option>
                                        {categories
                                            .filter(cat => formData.type === '' || cat.type === formData.type)
                                            .map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
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
