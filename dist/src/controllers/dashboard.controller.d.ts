import type { Request, Response } from "express";
import type { IDashboardService } from "../interfaces/IDashboardService.js";
export declare class DashboardController {
    private DashBoardService;
    constructor(DashBoardService: IDashboardService);
    getSummary(req: Request, res: Response): Promise<void>;
}
export default DashboardController;
//# sourceMappingURL=dashboard.controller.d.ts.map