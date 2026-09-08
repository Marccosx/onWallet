import {api} from "./api";
import type { IBudget } from "../types/index";

export const BudgetService = {

    getAll: async (data: string) : Promise<IBudget[]> =>{
        const url = data ? `/budgets?month=${data}` : `/budgets`
        const response = await api.get(url)
        return response.data;
    },
    getById: async (id:string): Promise<IBudget> =>{
        const response = await api.post(`/budgets/${id}`)
        return response.data;
    },
    create: async (data: Omit<IBudget, 'id'>) : Promise<IBudget> => {
    const response = await api.post("/budgets", data);
    return response.data;
    },
    update: async (id: string, data: Partial<IBudget>) : Promise<IBudget> => {
        const response = await api.put(`/budgets/${id}`, data);
        return response.data;
    },
    delete: async (id: string) : Promise<void> => {
        await api.delete(`/budgets/${id}`);
    }
}
export default BudgetService