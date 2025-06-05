import { Router } from "express"
import { getGoalReport } from "../controllers/report.controller"

const reportsRouter = Router()

reportsRouter.get('/goals',
    getGoalReport)

export default reportsRouter