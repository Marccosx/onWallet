import type { Category } from "@prisma/client";

export interface ICategoryService{
    getAllCategories(data: unknown | null): Promise<Category[]>
    getCategoryById(id: string): Promise<Category>
    createCategory(data:unknown): Promise<Category>
    updateCategory(id:string, data: unknown): Promise<Category | null>
    deleteCategory(id:string): Promise<void>
}