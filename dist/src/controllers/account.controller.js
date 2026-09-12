export class AccountController {
    accountService;
    constructor(accountService) {
        this.accountService = accountService;
    }
    async getAccounts(req, res) {
        try {
            const accounts = await this.accountService.getAccounts();
            res.json(accounts);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on list account" });
            }
        }
    }
    async getAccountById(req, res) {
        const id = req.params["id"];
        if (!id) {
            return res.status(400).json({ error: "Account ID is missing" });
        }
        try {
            const account = await this.accountService.getAccountById(id);
            if (!account) {
                return res.status(404).json({ error: "Account not found" });
            }
            res.status(200).json(account);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res
                    .status(500)
                    .json({ error: "Unexpected error on get account by id" });
            }
        }
    }
    async createAccount(req, res) {
        if (!req.body) {
            return res.status(400).json({ error: "Request body is missing" });
        }
        try {
            const account = await this.accountService.createAccount(req.body);
            res.status(201).json(account);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on create account" });
            }
        }
    }
    async updateAccount(req, res) {
        const id = req.params["id"];
        if (!id) {
            return res.status(400).json({ error: "Account ID is missing" });
        }
        try {
            const account = await this.accountService.updateAccount(id, req.body);
            res.status(200).json(account);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on update account" });
            }
        }
    }
    async deleteAccount(req, res) {
        const id = req.params["id"];
        if (!id) {
            return res.status(400).json({ error: "Account ID is missing" });
        }
        try {
            await this.accountService.deleteAccount(id);
            res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on delete account" });
            }
        }
    }
}
export default AccountController;
//# sourceMappingURL=account.controller.js.map