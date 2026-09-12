import prisma from "../lib/prisma.js";
export class BudgetService {
    async getBudgets(data) {
        try {
            const [year, month] = data.split("-");
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 1);
            const budgets = await prisma.budget.findMany({
                where: {
                    month: { gte: startDate,
                        lt: endDate
                    }
                }
            });
            const categoriesWithBudget = await prisma.category.findMany({ where: { budgetLimit: { gt: 0 } } });
            const allBudgets = [...budgets];
            for (const cat of categoriesWithBudget) {
                const alreadyHasBudget = budgets.find(b => b.categoryId === cat.id);
                if (!alreadyHasBudget) {
                    allBudgets.push({ id: `virtual-${cat.id}`, categoryId: cat.id, month: startDate, limit: cat.budgetLimit });
                }
            }
            const BudgetWithSpent = await Promise.all(allBudgets.map(async (budget) => {
                const result = await prisma.transaction.aggregate({
                    _sum: { amount: true },
                    where: {
                        categoryId: budget.categoryId,
                        type: "EXPENSE",
                        create_at: {
                            gte: startDate,
                            lt: endDate
                        },
                    },
                });
                const spent = result._sum.amount || 0;
                return { ...budget, spent };
            }));
            return BudgetWithSpent;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    async getBudgetById(id) {
        try {
            const budget = await prisma.budget.findUnique({ where: { id } });
            return budget;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    async createBudget(data) {
        const requiredFields = ['categoryId', 'limit', 'month'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing ${field} required budget fields`);
            }
        }
        if (data.limit <= 0) {
            throw new Error("Budget limit cannot be zero or negative");
        }
        const existingBudget = await prisma.budget.findFirst({
            where: {
                categoryId: data.categoryId,
                month: new Date(data.month)
            }
        });
        if (existingBudget) {
            throw new Error("Budget for this category and month already exists");
        }
        try {
            const budget = await prisma.budget.create({ data });
            return budget;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    async updateBudget(id, data) {
        const budget = await this.getBudgetById(id);
        if (!budget) {
            throw new Error("Budget not found");
        }
        if (data.limit <= 0) {
            throw new Error("Budget limit cannot be zero or negative");
        }
        try {
            const budget = await prisma.budget.update({ where: { id: id }, data });
            return budget;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    async deleteBudget(id) {
        const budget = await this.getBudgetById(id);
        if (!budget) {
            throw new Error("Budget not found");
        }
        try {
            await prisma.budget.delete({ where: { id } });
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
}
export default BudgetService;
//# sourceMappingURL=budget.service.js.map