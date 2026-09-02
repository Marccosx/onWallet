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
    description: string;
    amount: number;
    date: string;
    accountId: string;
    categoryId: string;
    type: string;
}

interface IBudget{
    id: string;
    category: string;
    month: string;
    limit: number;

} 

export type { IAccount, ICategory, ITransaction, IBudget };