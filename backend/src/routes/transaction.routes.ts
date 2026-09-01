import express from "express";
import TransactionController from "../controllers/transactions.controller.js";
import TransactionService from "../services/transactions.service.js";

const transactionRouter = express.Router();
const transactionService = new TransactionService();
const transactionController = new TransactionController(transactionService);
/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Gerenciamento de receitas e despesas
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Lista transações de um mês
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: create_at
 *         schema:
 *           type: string
 *           example: "2026-08"
 *         description: Mês da busca no formato YYYY-MM
 *     responses:
 *       200:
 *         description: Lista de transações
 */
transactionRouter.get("/", (req,res) => transactionController.getTransactions(req, res));

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Cria uma nova transação
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 example: "EXPENSE"
 *               accountId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transação criada
 */
transactionRouter.post("/", (req, res) => transactionController.createTransaction(req, res));

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Atualiza uma transação
 *     tags: [Transactions]
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
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *               accountId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transação atualizada
 */
transactionRouter.put("/:id",(req, res) => transactionController.updateTransaction(req, res));

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Deleta uma transação
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Transação deletada
 */
transactionRouter.delete("/:id",(req, res) => transactionController.deleteTransaction(req, res));

export default transactionRouter;