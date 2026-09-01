import express from "express";
import BudgetController from "../controllers/budget.controller.js";
import BudgetService from "../services/budget.service.js";

const budgetRouter = express.Router();
const budgetService = new BudgetService();
const budgetController = new BudgetController(budgetService);
/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Metas mensais de gastos por categoria
 */

/**
 * @swagger
 * /budgets:
 *   get:
 *     summary: Lista orçamentos de um mês
 *     tags: [Budgets]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           example: "2026-08"
 *     responses:
 *       200:
 *         description: Lista de orçamentos com valor gasto calculado
 */
budgetRouter.get("/", (req,res) => budgetController.getBudgets(req, res));

/**
 * @swagger
 * /budgets/{id}:
 *   get:
 *     summary: Busca orçamento por ID
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do orçamento
 */
budgetRouter.get("/:id",(req, res) => budgetController.getBudgetById(req, res));

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Define um novo orçamento
 *     tags: [Budgets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               month:
 *                 type: string
 *                 format: date-time
 *               limit:
 *                 type: number
 *     responses:
 *       201:
 *         description: Orçamento criado
 */
budgetRouter.post("/", (req, res) => budgetController.createBudget(req, res));

/**
 * @swagger
 * /budgets/{id}:
 *   put:
 *     summary: Atualiza limite do orçamento
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Limite atualizado
 */
budgetRouter.put("/:id",(req, res) => budgetController.updateBudget(req, res));

/**
 * @swagger
 * /budgets/{id}:
 *   delete:
 *     summary: Remove um orçamento
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Orçamento removido
 */
budgetRouter.delete("/:id",(req, res) => budgetController.deleteBudget(req, res));

export default budgetRouter;