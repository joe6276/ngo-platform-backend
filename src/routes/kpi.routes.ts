import { Router } from "express";
import { createKPI, deleteKPI, getAllKPIs, getKPIById, getKPIsByGoal, updateKPI, updateKPIProgress } from "../controllers/kpi.controller";
import { requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/rbac.types";

const kpisRouter = Router();

kpisRouter.get('/',
    requirePermission(Permission.READ_KPI),
    getAllKPIs);

kpisRouter.post('/:goalId',
    requirePermission(Permission.CREATE_KPI),
    createKPI
);

// kpisRouter.get('/:goalId', getKPIsByGoal);

kpisRouter.get('/:id',
    requirePermission(Permission.READ_KPI),
    getKPIById
);

kpisRouter.put('/:id',
    requirePermission(Permission.UPDATE_KPI),
    updateKPI
);

kpisRouter.patch('/:id/progress',
    requirePermission(Permission.UPDATE_KPI),
    updateKPIProgress
);

kpisRouter.delete('/:id',
    requirePermission(Permission.DELETE_KPI),
    deleteKPI
);

export default kpisRouter