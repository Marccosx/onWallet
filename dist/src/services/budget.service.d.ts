import type { Budget } from "@prisma/client";
import type { IBudgetService } from "../interfaces/IBudgetService.js";
export declare class BudgetService implements IBudgetService {
    getBudgets(data: string): Promise<(Budget & {
        spent: number;
    })[]>;
    getBudgetById(id: string): Promise<Budget | null>;
    createBudget(data: any): Promise<Budget>;
    updateBudget(id: string, data: any): Promise<Budget>;
    deleteBudget(id: string): Promise<void>;
}
export default BudgetService;
//# sourceMappingURL=budget.service.d.ts.map