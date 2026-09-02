import {api} from "./api";
import type { ITransaction } from "../types/index";

export const TransactionService = {

    getAll: async (data: string) : Promise<ITransaction[]> =>{
        const url = data ? `/transactions?create_at=${data}` : `/transactions`
        const response = await api.get(url)
        return response.data;
    },
    getById: async (id:string): Promise<ITransaction> =>{
        const response = await api.post(`/transactions/${id}`)
        return response.data;
    },
    create: async (data: Omit<ITransaction, 'id'>) : Promise<ITransaction> => {
    const response = await api.post("/transactions", data);
    return response.data;
    },
    update: async (id: string, data: Partial<ITransaction>) : Promise<ITransaction> => {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data;
    },
    delete: async (id: string) : Promise<void> => {
        await api.delete(`/transactions/${id}`);
    }
}
export default TransactionService