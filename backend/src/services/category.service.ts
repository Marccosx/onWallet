import type { Category } from "@prisma/client";
import type { ICategoryService } from "../interfaces/ICategoryService.js";
import prisma from "../lib/prisma.js";
import { currentUserId } from "../lib/auth.js";

export class CategoryService implements ICategoryService{

    async getAllCategories(data: unknown | null): Promise<Category[]> {
        if(data){
            try{
                const cateogries = await prisma.category.findMany({where: {type: data as any, userId: currentUserId()}});
                return cateogries
            }catch (error){
                throw new Error("Categories not founds")
            }
        }else{
            try{
                const categories = await prisma.category.findMany({ where: { userId: currentUserId() } });
                return categories
            }catch (error){
                throw new Error("Categories not founds")
            }
        }
    }

    async getCategoryById(id: string): Promise<Category> {
        try{
            const category = await prisma.category.findFirst({where: {id: id, userId: currentUserId()}})
            if(!category){
                throw new Error("Category not found")
            }
            return category;
        }catch(error){
            throw new Error("Category not found")
        }
    }

    async createCategory(data: any): Promise<Category> {
        try{
            const { name, type, color, icon, budgetLimit } = data;
            const category = await prisma.category.create({data: {name, type, color, icon, budgetLimit, userId: currentUserId()}})
            return category;
        }catch(error){
            throw new Error("Error create category")
        }
    }

    async updateCategory(id: string, data: any): Promise<Category | null> {
        
        let category = await this.getCategoryById(id)
        if(!category){
            throw new Error("Category not found")
        }
        try{
            const { name, type, color, icon, budgetLimit } = data;
            category = await prisma.category.update({where: {id: id, userId: currentUserId()}, data: {name, type, color, icon, budgetLimit}})
            return category;
        }catch(error){
            throw new Error("Error updating category")
        }
        
    }

    async deleteCategory(Id: string): Promise<void> {
        let category= await this.getCategoryById(Id)
        let TransactionCount = await prisma.transaction.count({where: {categoryId: Id}})
        if(!category){
            throw new Error("Category not found")
        }
        if(TransactionCount > 0){
            throw new Error("Cannot delete category with existing transactions")
        }
        try{
            category = await prisma.category.delete({where: {id: Id, userId: currentUserId()}})
        }catch(error){
            throw new Error("Erro updating category")
        }
    }
}
export default CategoryService
