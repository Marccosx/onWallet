export class TransactionController {
    transactionService;
    constructor(transactionService) {
        this.transactionService = transactionService;
    }
    async getTransactions(req, res) {
        const data = req.query.create_at;
        try {
            const transactions = await this.transactionService.getAllTransactions(data);
            res.json(transactions);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    async getTransactionById(req, res) {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ error: "Request params id is missing" });
            return;
        }
        try {
            const transaction = await this.transactionService.getTransactionById(id);
            res.json(transaction);
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
    async createTransaction(req, res) {
        const data = req.body;
        if (!data) {
            res.status(400).json({ error: "Request body is missing" });
            return;
        }
        try {
            const transaction = await this.transactionService.createTransaction(data);
            res.status(201).json(transaction);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async updateTransaction(req, res) {
        const id = req.params.id;
        const data = req.body;
        if (!data) {
            res.status(400).json({ error: "Request body is missing" });
            return;
        }
        else if (!id) {
            res.status(400).json({ error: "Request params id is missing" });
            return;
        }
        try {
            const transaction = await this.transactionService.updateTransaction(id, data);
            res.json(transaction);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async deleteTransaction(req, res) {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ error: "Request params id is missing" });
            return;
        }
        try {
            await this.transactionService.deleteTransaction(id);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
export default TransactionController;
//# sourceMappingURL=transactions.controller.js.map