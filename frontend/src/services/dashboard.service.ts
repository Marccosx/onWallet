import { api } from "./api";

export interface IDashboard {
    currentAmount: number;
    monthRecipe: number;
    monthExpense: number;
    ExpensePerCategory: { categoryId: string; _sum: { amount: number } }[];
}

export const DashboardService = {
    getSummary: async (month: string): Promise<IDashboard> => {
        // Envia o mês na URL conforme o backend exige (ex: /dashboards?month=2026-09)
        const response = await api.get(`/dashboards?month=${month}`);
        return response.data;
    }
};

