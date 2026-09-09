import express from "express";
import DashboardController from "../controllers/dashboard.controller.js"
import dashBoardService from "../services/dashboard.service.js"

const dashboardRouter = express.Router();
const dashboardService = new dashBoardService();
const dashboardController = new DashboardController(dashboardService)

/**
 * @swagger
 * tags:
 *   name: Dashboards
 *   description: Gerenciamento de relatórios do sistema
 */

/**
 * @swagger
 * /dashboards:
 *    get:
 *     summary: Lista orçamentos de um mês
 *     tags: [Dashboards]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           example: "2026-08"
 *     responses:
 *       200:
 *         description: Lista todas as informações mensal
 */
dashboardRouter.get('/', (req, res)=> dashboardController.getSummary(req, res));

export default dashboardRouter;