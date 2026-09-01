import express from "express";
import CategoryController from "../controllers/category.controller.js"
import CategoryService from "../services/category.service.js"

const categoryRouter = express.Router();
const categoryService = new CategoryService();
const categoryController = new CategoryController(categoryService)
/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Gerenciamento de categorias de receitas e despesas
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lista todas as categorias
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtra por INCOME ou EXPENSE
 *     responses:
 *       200:
 *         description: Lista de categorias
 */
categoryRouter.get('/', (req, res)=> categoryController.getAllCategories(req, res));

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Busca uma categoria por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da categoria que será buscada
 *     responses:
 *       200:
 *         description: Categoria retornada com sucesso
 *       404:
 *         description: Categoria não encontrada
 */
categoryRouter.get('/:id', (req, res)=> categoryController.getCategoryById(req,res));
/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Cria uma nova categoria
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoria criada
 */
categoryRouter.post('/', (req, res)=> categoryController.createCategory(req,res));

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Atualiza uma categoria
 *     tags: [Categories]
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
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoria atualizada
 */
categoryRouter.put('/:id', (req, res)=> categoryController.updateCategory(req,res));

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Deleta uma categoria
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Categoria deletada
 */
categoryRouter.delete('/:id', (req,res)=> categoryController.deleteCategory(req,res));

export default categoryRouter;