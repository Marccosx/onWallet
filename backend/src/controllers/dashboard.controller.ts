import type { Request, Response } from "express";
import type { IDashboardService } from "../interfaces/IDashboardService.js";

export class DashboardController{
    constructor (private DashBoardService: IDashboardService){}

    async getSummary(req: Request, res: Response){
        const data = req.query.month;
        if(!data){
            res.status(400).json("Request params month is missing")
        }
        try{
            const dashboard = await this.DashBoardService.getSumary(data);
            res.json(dashboard)
            return
        }catch(error){
            res.status(404).json({ error: (error as Error).message });
        }
    }
}
export default DashboardController;