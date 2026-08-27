
import express from "express";
import AccountController from "../controllers/account.controller.js";
import AccountService from "../services/account.service.js";

const accountRouter = express.Router();
const accountService = new AccountService();
const accountController = new AccountController(accountService);

accountRouter.get("/", (req,res) => accountController.getAccounts(req, res));
accountRouter.post("/", (req, res) => accountController.createAccount(req, res));
accountRouter.put("/:id",(req, res) => accountController.updateAccount(req, res));
accountRouter.delete("/:id",(req, res) => accountController.deleteAccount(req, res));

export default accountRouter;