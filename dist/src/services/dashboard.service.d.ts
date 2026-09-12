import type { dashBoardDTO } from "../Dtos/dashboardDTO.js";
import type { IDashboardService } from "../interfaces/IDashboardService.js";
export declare class DashboardService implements IDashboardService {
    getSumary(data: string): Promise<dashBoardDTO>;
    private getAmountAccountsByMonth;
    private getIncomesTransactions;
    private getExpenseTransactions;
    private getExpenseTransactionsPerCategory;
    private getDate;
}
export default DashboardService;
//# sourceMappingURL=dashboard.service.d.ts.map