import { Request, Response } from 'express';
import Goal from '../database/models/Goal';
import KPI from '../database/models/KPI';
import Event from '../database/models/Event';
import DonationIn from '../database/models/DonationIn';
import DonationOut from '../database/models/DonationOut';
import { AuthenticatedRequest } from '../types/auth';

// CREATE - Add new goal
export const create = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const goal = await Goal.create({ ...req.body, organizationId: req.user!.organizationId });
        res.status(201).json(goal);
    } catch (error: any) {
        res.status(400).json({
            error: 'Validation failed',
            details: error.errors?.map((e: any) => e.message) || error.message
        });
    }
};

// READ - Get all goals
export const getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status, region } = req.query;
        const where: any = {};

        if (status) where.status = status;
        if (region) where.region = region;
        where.organizationId = req.user!.organizationId

        const goals = await Goal.findAll({
            where,
            order: [['created_at', 'DESC']]
        });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals' + error });
    }
};

// READ - Get single goal with KPIs
export const getById = async (req: Request, res: Response) => {
    try {
        const goalId = req.params.id;
        const goal = await Goal.findByPk(goalId, {
            include: [KPI, Event, {
                model: DonationIn,
                through: { attributes: [] },
            },
                {
                    model: DonationOut,
                    through: { attributes: [] },
                },],
            paranoid: false
        });

        if (!goal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        const goalJson = goal.toJSON() as any;

        const response = {
            ...goalJson,
            donations: {
                in: goalJson.donationsIn || [],
                out: goalJson.donationsOut || [],
            },
            timeProgress: goal.timeProgress
        };

        delete response.donationsIn;
        delete response.donationsOut;

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goal ' + error });
    }
};

// UPDATE - Modify goal
export const update = async (req: Request, res: Response) => {
    try {
        const goal = await Goal.findByPk(req.params.id);
        if (!goal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        await goal.update(req.body);
        res.json(goal);
    } catch (error: any) {
        res.status(400).json({
            error: 'Validation failed',
            details: error.errors?.map((e: any) => e.message) || error.message
        });
    }
};

// DELETE - Remove goal (soft delete)
export const deleteGoal = async (req: Request, res: Response) => {
    try {
        const goal = await Goal.findByPk(req.params.id);
        if (!goal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }

        await goal.destroy();
        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete goal' });
    }
};

// RESTORE - Undo soft delete
export const restore = async (req: Request, res: Response) => {
    try {
        const goal = await Goal.findByPk(req.params.id, { paranoid: false });
        if (!goal) {
            res.status(404).json({ error: 'Goal not found' });
            return;
        }
        if (!goal.deletedAt) {
            res.status(400).json({ error: 'Goal not deleted' });
            return
        }

        await goal.restore();
        res.json(goal);
    } catch (error) {
        res.status(500).json({ error: 'Failed to restore goal' });
    }
};