import type { Request, Response } from "express";
import type {IBudgetService} from "../interfaces/IBudgetService.js";

export class BudgetController {
    constructor(private budgetService: IBudgetService) {}

    async getBudgets(req: Request, res: Response) {
        const data = req.query.month as string;
        if(!data){
            res.status(400).json({error: "Request query month is missing"});
            return;
        }
        try{
            const budgets = await this.budgetService.getBudgets(data);
            res.status(200).json(budgets)
        }catch(error){
            res.status(500).json({error: (error as Error).message});
        }
    }

    async getBudgetById(req: Request, res: Response) {
        const id = req.params.id as string;
        if(!id){
            res.status(400).json({error: "Request params id is missing"});
            return;
        }
        try {
            const budget = await this.budgetService.getBudgetById(id);
            if (!budget) {
                res.status(404).json({ error: "Budget not found" });
                return;
            }
            res.status(200).json(budget);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async createBudget(req: Request, res: Response) {
        const data = req.body;
        try {
            const budget = await this.budgetService.createBudget(data);
            res.status(201).json(budget);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async updateBudget(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = req.body;
        if(!id){
            res.status(400).json({error: "Request params id is missing"});
            return;
        }
        try {
            const budget = await this.budgetService.updateBudget(id, data);
            res.status(200).json(budget);
        }
        catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

    async deleteBudget(req: Request, res: Response) {
        const id = req.params.id as string;
        if(!id){
            res.status(400).json({error: "Request params id is missing"});
            return;
        }
        try {
            await this.budgetService.deleteBudget(id);  
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }

}

export default BudgetController;
