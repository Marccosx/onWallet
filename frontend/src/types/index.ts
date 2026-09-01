interface IAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
}

interface ICategory {
    id: string;
    name: string;
    color: string;
    icon: string;
    type: string;
}

interface ITransaction {
    id: string;
    name: string;
    amount: number;
    date: Date;
    account: IAccount;
    category: ICategory;
    type: string;
}

interface IBudget{
    id: string;
    category: ICategory;
    month: Date;
    limit: number;

} 

export type { IAccount, ICategory, ITransaction, IBudget };