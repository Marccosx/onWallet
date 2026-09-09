import type {dashBoardDTO} from "../Dtos/dashboardDTO.js"

export interface IDashboardService{

    getSumary(data: any): Promise<dashBoardDTO>
}