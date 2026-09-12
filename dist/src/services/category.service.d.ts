import type { Category } from "@prisma/client";
import type { ICategoryService } from "../interfaces/ICategoryService.js";
export declare class CategoryService implements ICategoryService {
    getAllCategories(data: unknown | null): Promise<Category[]>;
    getCategoryById(id: string): Promise<Category>;
    createCategory(data: any): Promise<Category>;
    updateCategory(id: string, data: any): Promise<Category | null>;
    deleteCategory(Id: string): Promise<void>;
}
export default CategoryService;
//# sourceMappingURL=category.service.d.ts.map