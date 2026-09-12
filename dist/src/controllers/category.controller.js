export class CategoryController {
    categoryService;
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async getAllCategories(req, res) {
        const params = req.query['type'];
        try {
            const categories = await this.categoryService.getAllCategories(params);
            res.status(200).json(categories);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on list categories" });
            }
        }
    }
    async getCategoryById(req, res) {
        const id = req.params["id"];
        if (!id) {
            res.status(400).json({ error: "Response params id is missing" });
        }
        try {
            const category = await this.categoryService.getCategoryById(id);
            res.status(200).json(category);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on get category by id" });
            }
        }
    }
    async createCategory(req, res) {
        if (!req.body) {
            res.status(400).json({ error: "Respose body is missing" });
        }
        try {
            const category = await this.categoryService.createCategory(req.body);
            res.status(201).json(category);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on create an category" });
            }
        }
    }
    async updateCategory(req, res) {
        const id = req.params["id"];
        if (!id) {
            res.status(400).json({ error: "Response params id is missing" });
        }
        try {
            const category = await this.categoryService.updateCategory(id, req.body);
            res.status(200).json(category);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on update an category" });
            }
        }
    }
    async deleteCategory(req, res) {
        const id = req.params["id"];
        if (!id) {
            res.status(400).json({ error: "Response params id is missing" });
        }
        try {
            const category = await this.categoryService.deleteCategory(id);
            res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Unexpected error on delete an category" });
            }
        }
    }
}
export default CategoryController;
//# sourceMappingURL=category.controller.js.map