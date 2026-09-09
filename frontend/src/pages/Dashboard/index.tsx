import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DashboardService, type IDashboard } from "../../services/dashboard.service";
import { CategoryService } from "../../services/category.service";
import type { ICategory } from "../../types";

export function Dashboard() {
    const [summary, setSummary] = useState<IDashboard | null>(null);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Inicia com o mês atual para evitar erros no backend
    const [filterDate, setFilterDate] = useState<string>(
        new Date().toISOString().substring(0, 7)
    );

    useEffect(() => {
        loadData();
    }, [filterDate]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            // Busca as categorias para podermos exibir os nomes e cores delas
            const cats = await CategoryService.getAll();
            setCategories(cats);
            
            // Busca o resumo do mês selecionado
            const data = await DashboardService.getSummary(filterDate);
            setSummary(data);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Calculando seu resumo financeiro...</div>;
    if (!summary) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Cabeçalho */}
            <div className="flex justify-between items-end bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
                    <p className="text-gray-500 text-sm">Acompanhe a saúde das suas finanças</p>
                </div>
                <div>
                    <input 
                        type="month" 
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Saldo Geral (Contas)</h3>
                    <p className="text-3xl font-bold text-gray-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.currentAmount)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Receitas do Mês</h3>
                    <p className="text-3xl font-bold text-emerald-600">
                        + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.monthRecipe)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Despesas do Mês</h3>
                    <p className="text-3xl font-bold text-red-600">
                        - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.monthExpense)}
                    </p>
                </div>
            </div>

            {/* Despesas por Categoria com Gráfico */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6">Onde seu dinheiro está indo?</h2>
                
                {summary.ExpensePerCategory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">Você ainda não registrou gastos neste mês. 🎉</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Gráfico de Rosca */}
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary.ExpensePerCategory.map(exp => ({
                                            name: categories.find(c => c.id === exp.categoryId)?.name || 'Outros',
                                            value: exp._sum.amount || 0,
                                            color: categories.find(c => c.id === exp.categoryId)?.color || '#ccc'
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {summary.ExpensePerCategory.map((exp, index) => {
                                            const cat = categories.find(c => c.id === exp.categoryId);
                                            return <Cell key={`cell-${index}`} fill={cat?.color || '#ccc'} />;
                                        })}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Lista Detalhada */}
                        <div className="space-y-5">
                            {summary.ExpensePerCategory.map((expense) => {
                                const cat = categories.find(c => c.id === expense.categoryId);
                                const amount = expense._sum.amount || 0;
                                const percentage = summary.monthExpense > 0 ? (amount / summary.monthExpense) * 100 : 0;
                                
                                return (
                                    <div key={expense.categoryId} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                {cat ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: `${cat.color}15`, color: cat.color, borderColor: `${cat.color}30` }}>
                                                        {cat.icon} {cat.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 font-medium">Categoria Removida</span>
                                                )}
                                            </div>
                                            <div className="flex gap-4">
                                                <span className="text-gray-400">{percentage.toFixed(1)}%</span>
                                                <span className="font-semibold text-gray-700">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className="h-2 rounded-full" 
                                                style={{ width: `${percentage}%`, backgroundColor: cat?.color || '#ccc' }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

