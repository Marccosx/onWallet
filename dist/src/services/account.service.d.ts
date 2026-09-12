import type { IAccountService } from "../interfaces/IAccountService.js";
export declare class AccountService implements IAccountService {
    getAccounts(): Promise<{
        id: string;
        name: string;
        tag: string | null;
        balance: number;
        color: string | null;
        created_at: Date;
    }[]>;
    createAccount(accountData: any): Promise<{
        id: string;
        name: string;
        tag: string | null;
        balance: number;
        color: string | null;
        created_at: Date;
    }>;
    getAccountById(accountId: string): Promise<{
        id: string;
        name: string;
        tag: string | null;
        balance: number;
        color: string | null;
        created_at: Date;
    }>;
    updateAccount(accountId: string, accountData: any): Promise<{
        id: string;
        name: string;
        tag: string | null;
        balance: number;
        color: string | null;
        created_at: Date;
    }>;
    deleteAccount(accountId: string): Promise<void>;
}
export default AccountService;
//# sourceMappingURL=account.service.d.ts.map