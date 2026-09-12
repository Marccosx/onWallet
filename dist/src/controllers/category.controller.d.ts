import type { Response, Request } from "express";
import type { ICategoryService } from "../interfaces/ICategoryService.js";
export declare class CategoryController {
    private categoryService;
    constructor(categoryService: ICategoryService);
    getAllCategories(req: Request, res: Response): Promise<void>;
    getCategoryById(req: Request, res: Response): Promise<void>;
    createCategory(req: Request, res: Response): Promise<void>;
    updateCategory(req: Request, res: Response): Promise<void>;
    deleteCategory(req: Request, res: Response): Promise<void>;
}
export default CategoryController;
//# sourceMappingURL=category.controller.d.ts.map