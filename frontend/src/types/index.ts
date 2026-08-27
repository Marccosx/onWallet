interface IAccount {
    name: string;
    type: string;
    balance: number;
    color: string;
}

interface ICategory {
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
    category: ICategory;
    month: Date;
    limit: number;

} 