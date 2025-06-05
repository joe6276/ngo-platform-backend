import { Router } from "express";
import goalRouter from "./goal.routes";
import kpisRouter from "./kpi.routes";
import donationsRouter from "./donation.routes";
import eventsRouter from "./events.routes";
import feedbackRouter from "./feedback.routes";
import authRouter from "./auth.routes";
import isAuthenticated from "../middlewares/auth.middleware";
import userRouter from "./users.routes";
import reportsRouter from "./report.routes";

const apiRouter = Router();

apiRouter.use('/auth', authRouter)
apiRouter.use('/reports', isAuthenticated, reportsRouter)
apiRouter.use('/users', isAuthenticated, userRouter)
apiRouter.use('/goals', isAuthenticated, goalRouter)
apiRouter.use('/kpis', isAuthenticated, kpisRouter)
apiRouter.use('/events', isAuthenticated, eventsRouter)
apiRouter.use('/donations', isAuthenticated, donationsRouter)
apiRouter.use('/feedback', isAuthenticated, feedbackRouter)

export default apiRouter;