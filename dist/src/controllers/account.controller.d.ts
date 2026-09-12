import type { Request, Response } from "express";
import type { IAccountService } from "../interfaces/IAccountService.js";
export declare class AccountController {
    private accountService;
    constructor(accountService: IAccountService);
    getAccounts(req: Request, res: Response): Promise<void>;
    getAccountById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    createAccount(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateAccount(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteAccount(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default AccountController;
//# sourceMappingURL=account.controller.d.ts.map