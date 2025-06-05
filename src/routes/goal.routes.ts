import { Router } from 'express';
import { create, deleteGoal, getAll, getById, restore, update } from '../controllers/goal.controller';

const goalRouter = Router();

goalRouter.post('/', create);
goalRouter.get('/', getAll);
goalRouter.get('/:id', getById)
goalRouter.put('/:id', update);
goalRouter.delete('/:id', deleteGoal);
goalRouter.post('/:id/restore', restore);

export default goalRouter;