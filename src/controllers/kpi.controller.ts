import { Request, Response } from 'express';
import Goal from '../database/models/Goal';
import KPI from '../database/models/KPI';
import { AuthenticatedRequest } from '../types/auth';

// Utility function to trigger goal progress recalculation
async function triggerGoalProgress(goal: Goal): Promise<void> {
  await goal.save();
}

// CREATE - Add new KPI to a goal
export async function createKPI(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const goal = await Goal.findByPk(req.params.goalId);
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const kpi = await KPI.create({
      ...req.body,
      goalId: goal.id,
      organizationId: req.user!.organizationId
    });

    await triggerGoalProgress(goal);
    res.status(201).json(kpi);
  } catch (error: any) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors?.map((e: any) => e.message) || error.message,
    });
  }
}

// READ - Get all KPIs for a goal
export async function getKPIsByGoal(req: Request, res: Response): Promise<void> {
  try {
    const goal = await Goal.findByPk(req.params.goalId);
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const kpis = await KPI.findAll({
      where: { goalId: goal.id },
      order: [['created_at', 'DESC']],
    });

    res.json(kpis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
}

// READ - Get all KPIs 
export async function getAllKPIs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const kpis = await KPI.findAll({
      where: {
        organizationId: req.user!.organizationId
      },
      order: [['created_at', 'DESC']],
    });
    res.json(kpis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
}

// READ - Get single KPI
export async function getKPIById(req: Request, res: Response): Promise<void> {
  try {
    const kpi = await KPI.findByPk(req.params.id, {
      include: [Goal],
    });

    if (!kpi) {
      res.status(404).json({ error: 'KPI not found' });
      return;
    }
    const goal = await Goal.findByPk(kpi.goal.id)

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }
    const json = kpi.toJSON();
    res.json({ ...json, timeProgress: goal!.timeProgress, });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch KPI', err: error });
  }
}

// UPDATE - Modify KPI
export async function updateKPI(req: Request, res: Response): Promise<void> {
  try {
    const kpi = await KPI.findByPk(req.params.id, {
      include: [Goal],
    });

    if (!kpi) {
      res.status(404).json({ error: 'KPI not found' });
      return;
    }

    await kpi.update(req.body);

    if (kpi.goal) {
      await triggerGoalProgress(kpi.goal);
    }

    res.json(kpi);
  } catch (error: any) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors?.map((e: any) => e.message) || error.message,
    });
  }
}

// UPDATE - Just progress field
export async function updateKPIProgress(req: Request, res: Response): Promise<void> {
  try {
    const kpi = await KPI.findByPk(req.params.id, {
      include: [Goal],
    });

    if (!kpi) {
      res.status(404).json({ error: 'KPI not found' });
      return;
    }

    await kpi.update({ progress: req.body.progress }); // Triggers beforeSave hook

    if (kpi.goal) {
      await triggerGoalProgress(kpi.goal);
    }

    res.json(kpi);
  } catch (error: any) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.errors?.map((e: any) => e.message) || error.message,
    });
  }
}

// DELETE - Remove KPI
export async function deleteKPI(req: Request, res: Response): Promise<void> {
  try {
    const kpi = await KPI.findByPk(req.params.id, {
      include: [Goal],
    });

    if (!kpi) {
      res.status(404).json({ error: 'KPI not found' });
      return;
    }

    const goal = kpi.goal;
    await kpi.destroy();

    if (goal) {
      await triggerGoalProgress(goal);
    }

    res.json({ message: 'KPI deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete KPI' });
  }
}