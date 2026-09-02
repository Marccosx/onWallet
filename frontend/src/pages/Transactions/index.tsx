import React, { useEffect, useState } from "react";
import { TransactionService } from '../../services/transaction.service';
import type { IAccount, ICategory, ITransaction } from "../../types";
import { CategoryService } from "../../services/category.service";
import { AccountService } from "../../services/account.service";

export function Transactions() {
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [accounts, setAccounts] = useState<IAccount[]>([]);
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [transactionsFiltered, setTransactionsFiltered] = useState<ITransaction[]>([])

    const [filterDate, setFilterDate] = useState<string>(" ");
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

    const handleSearch = async (date:string)=>{
        try{
            setIsLoading(true);
            const transactionsFiltered = await TransactionService.getAll(date);
            setTransactionsFiltered(transactionsFiltered)

        }catch(error){
            console.error("Erro ao buscar transações filtradas", error)
        }finally{
            setIsLoading(false);
        }
    }

    const handleEdit = (transaction: ITransaction) => {
        setEditingId(transaction.id);
        setFormData({
            description: transaction.description,
            type: transaction.type,
            amount: transaction.amount,
            accountId: transaction.accountId,
            categoryId: transaction.categoryId,
            date: transaction.date
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
                date: formData.date

            };

            if (editingId) {
                await TransactionService.update(editingId, transData)
            } else {
                await TransactionService.create(transData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            alert("Error ao salvar transação. Verifique os dados");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando Transações</div>;

    return(
        <div className="p-6 max-w-5xl mx-auto">
            {/*Cabeçalho*/}
            <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Transações</h1>
                    <p className="text-gray-500 text-sm">Armazene seus gastos e receitas</p>
                </div>
            </div>
            <button 
            onClick={handleOpenNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
                + Nova Transação
            </button>

            {/*Filtro*/}
            <div className="flex gap-2 mb-6">
                <div>
                    <label className="block mt-2 px-4 py-2 rounded-lg text-medium font-medium" htmlFor="filterDate">Filtrar Por Periodo</label>
                    <input className="px-4 py-2 border border-gray-500 rounded-xl" type="date" />
                    <button className="px-4 py-2 bg-blue-500 rounded-xl text-sm ml-2">filtrar</button>
                </div>
            </div>
        </div>
    );
}
