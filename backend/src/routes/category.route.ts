import express from "express";
import CategoryController from "../controllers/category.controller.js"
import CategoryService from "../services/category.service.js"

const categoryRouter = express.Router();
const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService)

categoryRouter.get('/', (req, res)=> categoryController.getAllCategories(req, res));
categoryRouter.post('/', (req, res)=> categoryController.createCategory(req,res));
categoryRouter.put('/:id', (req, res)=> categoryController.updateCategory(req,res));
categoryRouter.delete('/:id', (req,res)=> categoryController.deleteCategory(req,res));

export default categoryRouter;