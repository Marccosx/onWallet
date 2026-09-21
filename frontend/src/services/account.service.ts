import {api} from "./api";
import type { IAccount, GoalPlan } from "../types/index";

export const AccountService = {
    previewGoal: async (data: Partial<IAccount>, signal: AbortSignal): Promise<GoalPlan | null> => {
        const response = await api.post('/accounts/goal-preview', data, { signal });
        return response.data;
    },
    getAll: async () : Promise<IAccount[]> => {
        const response = await api.get("/accounts");
        return response.data;
    },
    getById: async (id: string) : Promise<IAccount> => {
        const response = await api.get(`/accounts/${id}`);
        return response.data;
    },
    create: async (data: Omit<IAccount, 'id'>) : Promise<IAccount> => {
        const response = await api.post("/accounts", data);
        return response.data;
    },
    update: async (id: string, data: Partial<IAccount>) : Promise<IAccount> => {
        const response = await api.put(`/accounts/${id}`, data);
        return response.data;
    },
    delete: async (id: string) : Promise<void> => {
        await api.delete(`/accounts/${id}`);
    }
}

export default AccountService;
