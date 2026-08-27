import type { Response, Request } from "express";
import type {ICategoryService} from "../interfaces/ICategoryService.js";

export class CategoryController{

    constructor (private categoryService : ICategoryService){}

    async getAllCategories(req: Request, res: Response): Promise<void>{
        const params = req.query['type'] as string | undefined
        try{
            const categories = await this.categoryService.getAllCategories(params);
            res.status(200).json(categories) 
        }catch(error){
            if(error instanceof Error){
                res.status(400).json({error: error.message})
            }else{
                res.status(500).json({error:"Unexpected error on list categories"})
            }
        }
    }

    async createCategory(req: Request, res: Response): Promise<void>{
        if(!req.body){
            res.status(400).json({error:"Respose body is missing"})
        }
        try{
            const category = await this.categoryService.createCategory(req.body);
            res.status(201).json(category)
        }catch(error){
            if(error instanceof Error){
                res.status(400).json({error: error.message})
            }else{
                res.status(500).json({error:"Unexpected error on create an category"})
            }
        }
    }

    async updateCategory(req: Request, res: Response): Promise<void> {
        const id = req.params["id"] as string;
        if(!id){
            res.status(400).json({error:"Response params id is missing"})
        }
        try{
            const category = await this.categoryService.updateCategory(id, req.body)
            res.status(200).json(category)
        }catch(error){
            if(error instanceof Error){
                res.status(400).json({error: error.message})
            }else{
                res.status(500).json({error: "Unexpected error on update an category"})
            }
        }
    }

    async deleteCategory(req: Request, res: Response ){
        const id = req.params["id"] as string;
        if(!id){
            res.status(400).json({error: "Response params id is missing"})
        }
        try{
            const category = await this.categoryService.deleteCategory(id)
            res.status(204).send()
        }catch(error){
            if(error instanceof Error){
                res.status(400).json({error: error.message})
            }else{
                res.status(500).json({error: "Unexpected error on delete an category"})
            }
        }
    }
}
export default CategoryController