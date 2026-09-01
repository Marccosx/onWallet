import {api} from "./api";
import type { ICategory } from "../types/index";

export const CategoryService = {
    getAll: async (type?: 'INCOME' | 'EXPENSE') : Promise<ICategory[]> => {
        const url = type ? `/categories?type=${type}` : '/categories';
        const response = await api.get(url);
        return response.data;
    },
    getById: async (id: string) : Promise<ICategory> => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },
    create: async (data: Omit<ICategory, 'id'>) : Promise<ICategory> => {
    const response = await api.post("/categories", data);
    return response.data;
    },
    update: async (id: string, data: Partial<ICategory>) : Promise<ICategory> => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },
    delete: async (id: string) : Promise<void> => {
        await api.delete(`/categories/${id}`);
    }
}
export default CategoryService;