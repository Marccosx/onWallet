import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
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
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [searchTerm, setSearchTerm] = useState("");


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        description: '',
        amount: 0,
        type: '',
        accountId: '',
        destinationAccountId: '',
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
        const result = await Swal.fire({
            title: 'Você tem certeza?',
            text: "Deseja realmente excluir esta transação?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981', 
            cancelButtonColor: '#ef4444',  
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                setIsLoading(true);
                await TransactionService.delete(id);
                toast.success("Transação excluída com sucesso!");
                loadData();
            } catch (error) {
                console.error("Erro ao excluir a Transação", error);
                toast.error("Erro ao excluir a transação.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setFormData({ description: '', type: 'EXPENSE', amount: 0, accountId: '', destinationAccountId: '', categoryId: '', date: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (transaction: ITransaction) => {
        setEditingId(transaction.id);
        setFormData({
            description: transaction.description,
            type: transaction.type,
            amount: transaction.amount,
            accountId: transaction.accountId,
            destinationAccountId: transaction.destinationAccountId || '',
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
                type: formData.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
                amount: formData.amount,
                accountId: formData.accountId,
                destinationAccountId: formData.type === 'TRANSFER' ? formData.destinationAccountId : undefined,
                categoryId: formData.type === 'TRANSFER' ? categories[0]?.id : formData.categoryId,
                create_at: new Date(formData.date + 'T00:00:00').toISOString()
            };

            if (editingId) {
                await TransactionService.update(editingId, transData);
                toast.success("Transação atualizada com sucesso!");
            } else {
                await TransactionService.create(transData);
                toast.success("Transação criada com sucesso!");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Erro ao Salvar dados", error);
            toast.error("Erro ao salvar transação. Verifique os dados.");
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
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-end">
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filterDate">Filtrar por Mês</label>
                    <input 
                        id="filterDate"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                        type="month" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="filterType">Tipo</label>
                    <select 
                        id="filterType"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                    >
                        <option value="ALL">Todos</option>
                        <option value="INCOME">Receitas</option>
                        <option value="EXPENSE">Despesas</option>
                    </select>
                </div>
                <div className="w-full md:flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="searchTerm">Buscar Descrição</label>
                    <input 
                        id="searchTerm"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Lista de Transações */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {(() => {
                    // Aplica os filtros locais
                    const filteredTransactions = transactions.filter(t => {
                        if (filterType !== 'ALL' && t.type !== filterType) return false;
                        if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                        return true;
                    });

                    if (filteredTransactions.length === 0) {
                        return (
                            <div className="p-8 text-center text-gray-500">
                                Nenhuma transação encontrada com os filtros atuais.
                            </div>
                        );
                    }

                    return (
                        <>
                            {/* VISUALIZAÇÃO DESKTOP (Tabela) */}
                            <table className="hidden md:table w-full text-left">
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
                                    {filteredTransactions.map(transaction => {
                                        const category = categories.find(c => c.id === transaction.categoryId);
                                        const account = accounts.find(a => a.id === transaction.accountId);
                                        const destinationAccount = accounts.find(a => a.id === transaction.destinationAccountId);
                                        const isExpense = transaction.type === 'EXPENSE';
                                        const isTransfer = transaction.type === 'TRANSFER';

                                        return (
                                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-gray-800">{transaction.description}</td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {isTransfer ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-600 border-blue-200">
                                                            Transferência
                                                        </span>
                                                    ) : category ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${category.color}15`, color: category.color, borderColor: `${category.color}30` }}>
                                                            {category.name}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {isTransfer ? (
                                                        <span className="text-xs">
                                                            {account?.name} &rarr; {destinationAccount?.name}
                                                        </span>
                                                    ) : (
                                                        account?.name || '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {transaction.create_at ? new Date(transaction.create_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-medium ${isExpense ? 'text-red-600' : isTransfer ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                    {isExpense ? '-' : isTransfer ? '' : '+'} 
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

                            {/* VISUALIZAÇÃO MOBILE (Cards) */}
                            <div className="md:hidden flex flex-col divide-y divide-gray-100">
                                {filteredTransactions.map(transaction => {
                                    const category = categories.find(c => c.id === transaction.categoryId);
                                    const account = accounts.find(a => a.id === transaction.accountId);
                                    const destinationAccount = accounts.find(a => a.id === transaction.destinationAccountId);
                                    const isExpense = transaction.type === 'EXPENSE';
                                    const isTransfer = transaction.type === 'TRANSFER';

                                    return (
                                        <div key={transaction.id} className="p-4 bg-white hover:bg-gray-50 transition-colors flex justify-between items-center">
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <span className="font-semibold text-gray-800 truncate">{transaction.description}</span>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{transaction.create_at ? new Date(transaction.create_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</span>
                                                    <span>•</span>
                                                    {isTransfer ? (
                                                        <span>{account?.name} &rarr; {destinationAccount?.name}</span>
                                                    ) : (
                                                        <span>{account?.name || '-'}</span>
                                                    )}
                                                    <span>•</span>
                                                    {isTransfer ? (
                                                        <span className="font-medium text-blue-600">Transferência</span>
                                                    ) : category ? (
                                                        <span style={{ color: category.color }} className="font-medium">
                                                            {category.name}
                                                        </span>
                                                    ) : '-'}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-2 ml-4">
                                                <span className={`font-bold ${isExpense ? 'text-red-600' : isTransfer ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                    {isExpense ? '-' : isTransfer ? '' : '+'} 
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                                                </span>
                                                <div className="flex gap-3 text-xs font-medium">
                                                    <button onClick={() => handleEdit(transaction)} className="text-blue-600">Editar</button>
                                                    <button onClick={() => handleDelete(transaction.id)} className="text-red-600">Excluir</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    );
                })()}
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
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="type" 
                                                value="TRANSFER"
                                                checked={formData.type === 'TRANSFER'}
                                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-gray-700">Transferência</span>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {formData.type === 'TRANSFER' ? 'Caixinha de Origem' : 'Caixinha'}
                                        </label>
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

                                {formData.type === 'TRANSFER' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Caixinha de Destino</label>
                                        <select 
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                                            value={formData.destinationAccountId}
                                            onChange={(e) => setFormData({...formData, destinationAccountId: e.target.value})}
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id} disabled={acc.id === formData.accountId}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {formData.type !== 'TRANSFER' && (
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
                                )}
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
