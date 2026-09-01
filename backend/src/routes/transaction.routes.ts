import express from "express";
import TransactionController from "../controllers/transactions.controller.js";
import TransactionService from "../services/transactions.service.js";

const transactionRouter = express.Router();
const transactionService = new TransactionService();
const transactionController = new TransactionController(transactionService);

transactionRouter.get("/", (req,res) => transactionController.getTransactions(req, res));
transactionRouter.post("/", (req, res) => transactionController.createTransaction(req, res));
transactionRouter.put("/:id",(req, res) => transactionController.updateTransaction(req, res));
transactionRouter.delete("/:id",(req, res) => transactionController.deleteTransaction(req, res));

export default transactionRouter;