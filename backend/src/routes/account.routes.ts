import express from "express";
import AccountController from "../controllers/account.controller.js";
import AccountService from "../services/account.service.js";

const accountRouter = express.Router();
const accountService = new AccountService();
const accountController = new AccountController(accountService);


/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Gerenciamento de contas bancárias
 */
/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Lista todas as contas
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Lista de contas retornada com sucesso
 */
accountRouter.get("/", (req,res) => accountController.getAccounts(req, res));


/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Busca uma conta por ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta que será buscada
 *     responses:
 *       200:
 *         description: Conta retornada com sucesso
 *       404:
 *         description: Conta não encontrada
 */
accountRouter.get("/:id",(req, res) => accountController.getAccountById(req, res));

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Cria uma nova conta
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nubank"
 *               type:
 *                 type: string
 *                 example: "CHECKING"
 *               balance:
 *                 type: number
 *                 example: 100.50
 *               color:
 *                 type: string
 *                 example: "#8A05BE"
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *       400:
 *         description: Erro de validação
 */
accountRouter.post("/", (req, res) => accountController.createAccount(req, res));
/**
 * @swagger
 * /accounts/{id}:
 *   put:
 *     summary: Atualiza os dados de uma conta
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta que será atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               balance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 */
accountRouter.put("/:id",(req, res) => accountController.updateAccount(req, res));
/**
 * @swagger
 * /accounts/{id}:
 *   delete:
 *     summary: Deleta uma conta
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta a ser deletada
 *     responses:
 *       204:
 *         description: Conta deletada com sucesso
 */
accountRouter.delete("/:id",(req, res) => accountController.deleteAccount(req, res));

export default accountRouter;