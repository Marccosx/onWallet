export class DashboardController {
    DashBoardService;
    constructor(DashBoardService) {
        this.DashBoardService = DashBoardService;
    }
    async getSummary(req, res) {
        const data = req.query.month;
        if (!data) {
            res.status(400).json("Request params month is missing");
        }
        try {
            const dashboard = await this.DashBoardService.getSumary(data);
            res.json(dashboard);
            return;
        }
        catch (error) {
            res.status(404).json({ error: error.message });
        }
    }
}
export default DashboardController;
//# sourceMappingURL=dashboard.controller.js.map