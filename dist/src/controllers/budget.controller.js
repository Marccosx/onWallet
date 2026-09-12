export class BudgetController {
    budgetService;
    constructor(budgetService) {
        this.budgetService = budgetService;
    }
    async getBudgets(req, res) {
        const data = req.query.month;
        if (!data) {
            res.status(400).json({ error: "Request query month is missing" });
            return;
        }
        try {
            const budgets = await this.budgetService.getBudgets(data);
            res.status(200).json(budgets);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async getBudgetById(req, res) {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ error: "Request params id is missing" });
            return;
        }
        try {
            const budget = await this.budgetService.getBudgetById(id);
            if (!budget) {
                res.status(404).json({ error: "Budget not found" });
                return;
            }
            res.status(200).json(budget);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async createBudget(req, res) {
        const data = req.body;
        try {
            const budget = await this.budgetService.createBudget(data);
            res.status(201).json(budget);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async updateBudget(req, res) {
        const id = req.params.id;
        const data = req.body;
        if (!id) {
            res.status(400).json({ error: "Request params id is missing" });
            return;
        }
        try {
            const budget = await this.budgetService.updateBudget(id, data);
            res.status(200).json(budget);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async deleteBudget(req, res) {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ error: "Request params id is missing" });
            return;
        }
        try {
            await this.budgetService.deleteBudget(id);
            res.status(204).send();
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
export default BudgetController;
//# sourceMappingURL=budget.controller.js.map