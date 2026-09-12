import type { Request, Response } from "express";
import type { IBudgetService } from "../interfaces/IBudgetService.js";
export declare class BudgetController {
    private budgetService;
    constructor(budgetService: IBudgetService);
    getBudgets(req: Request, res: Response): Promise<void>;
    getBudgetById(req: Request, res: Response): Promise<void>;
    createBudget(req: Request, res: Response): Promise<void>;
    updateBudget(req: Request, res: Response): Promise<void>;
    deleteBudget(req: Request, res: Response): Promise<void>;
}
export default BudgetController;
//# sourceMappingURL=budget.controller.d.ts.map