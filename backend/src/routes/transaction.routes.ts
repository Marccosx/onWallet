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
 * /transactions/{id}:
 *   get:
 *     summary: Busca uma transação por ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da transação que será buscada
 *     responses:
 *       200:
 *         description: Transação retornada com sucesso
 *       404:
 *         description: Transação não encontrada
 */
transactionRouter.get("/:id",(req, res) => transactionController.getTransactionById(req, res));
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
 *     summary: Exclui uma transação ou seu parcelamento e reverte os saldos aplicados
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: scope
 *         description: single exclui apenas a transação; group exclui todas as parcelas do mesmo grupo do usuário.
 *         schema:
 *           type: string
 *           enum: [single, group]
 *           default: single
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Transação ou parcelamento excluído
 *       400:
 *         description: Escopo inválido, transação não encontrada ou sem parcelamento
 */
transactionRouter.delete("/:id",(req, res) => transactionController.deleteTransaction(req, res));

/**
 * @swagger
 * /transactions/{id}/pay:
 *   post:
 *     summary: Confirma o pagamento de uma parcela pendente
 *     description: Desconta o valor de uma única parcela da caixinha e registra a data do pagamento. Exige saldo suficiente. Uma parcela já paga não é descontada novamente.
 *     tags: [Transactions]
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da transação que representa a parcela pendente
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Parcela paga; retorna a transação atualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 installmentGroupId:
 *                   type: string
 *                   format: uuid
 *                 amount:
 *                   type: number
 *                   example: 400
 *                 balanceApplied:
 *                   type: boolean
 *                   example: true
 *                 paidAt:
 *                   type: string
 *                   format: date-time
 *                 warning:
 *                   type: string
 *                   description: Aviso opcional quando o pagamento ultrapassa o orçamento do mês
 *       400:
 *         description: Parcela inexistente, já paga ou saldo insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Sessão ausente ou inválida
 */
transactionRouter.post("/:id/pay", (req, res) =>
  transactionController.payInstallment(req, res)
);
export default transactionRouter;
