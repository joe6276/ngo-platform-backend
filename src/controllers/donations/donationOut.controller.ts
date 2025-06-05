import { Request, Response } from 'express';
import DonationOut, { DonationOutStatus } from '../../database/models/DonationOut';
import Goal from '../../database/models/Goal';
import Event from '../../database/models/Event';
import { AuthenticatedRequest } from '../../types/auth';
import { uploadBufferToAzure } from '../../utils/uploadToAzure';

export const createDonationOut = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            amount,
            type,
            purpose,
            beneficiaryName,
            beneficiaryEmail,
            beneficiaryPhone,
            beneficiaryAddress,
            beneficiaryType,
            region,
            status = DonationOutStatus.PENDING,
            disbursementDate,
            goalIds = [], // Array of goal IDs
            eventId,
            notes,
            impactMetrics,
            currency = 'USD',
            itemDetails,
            tags
        } = req.body;
        const file = req.file as Express.Multer.File
        if (!file) {
            res.status(400).json({ error: 'No file uploaded' });
            return
        }
        let existingGoals;
        if (goalIds.length > 0) {
            existingGoals = await Goal.findAll({ where: { id: goalIds } });
            if (existingGoals.length !== goalIds.length) {
                res.status(400).json({
                    success: false,
                    message: 'One or more provided goalIds do not exist.'
                });
                return
            }
        }
        const url = await uploadBufferToAzure(file);
        // Create the outgoing donation
        const donation = await DonationOut.create({
            amount,
            type,
            purpose,
            beneficiaryName,
            beneficiaryEmail,
            beneficiaryPhone,
            beneficiaryAddress,
            beneficiaryType,
            receiptUrl: url,
            region,
            status,
            disbursementDate,
            eventId,
            notes,
            impactMetrics,
            currency,
            itemDetails,
            createdById: req.user!.id,
            organizationId: req.user!.organizationId
        });
        if (goalIds.length > 0) {
            await donation.$set('goals', goalIds);
        }
        for (const goal of existingGoals!) {
            await goal.save();
        }
        const donationWithRelations = await DonationOut.findByPk(donation.id, {
            include: [{ model: Goal, as: 'goals' }]
        });

        res.status(201).json({
            success: true,
            data: donationWithRelations
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to create outgoing donation',
            error: err.message
        });
    }
};

export const getAllDonationsOut = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status, region, goalId, eventId } = req.query;
        const where: any = {};

        if (status) where.status = status;
        if (region) where.region = region;
        if (goalId) where.goalId = goalId;
        if (eventId) where.eventId = eventId;
        where.organizationId = req.user!.organizationId

        const donations = await DonationOut.findAll({ where, include: [{ model: Goal, as: 'goals' }, Event] });
        res.status(200).json({
            success: true,
            data: donations
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve outgoing donations',
            error: err.message
        });;
    }
};

export const getDonationOutById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const donation = await DonationOut.findByPk(id, { include: [{ model: Goal, as: 'goals' }, Event] });
        if (!donation) {
            res.status(404).json({
                success: false,
                message: 'Outgoing donation not found'
            });
            return
        }
        res.status(200).json({
            success: true,
            data: donation
        });
    } catch (err: any) {
        console.error('Error getting outgoing donation:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve outgoing donation',
            error: err.message
        });
    }
};

export const updateDonationOut = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const donation = await DonationOut.findByPk(id);
        const {
            amount,
            type,
            purpose,
            beneficiaryName,
            beneficiaryEmail,
            beneficiaryPhone,
            beneficiaryAddress,
            beneficiaryType,
            receiptUrl,
            region,
            status,
            disbursementDate,
            goalIds,
            eventId,
            notes,
            impactMetrics,
            currency,
            itemDetails,
        } = req.body;

        if (!donation) {
            res.status(404).json({
                success: false,
                message: 'Outgoing donation not found'
            });
            return
        }

        if (req.body.status === DonationOutStatus.DISBURSED && !donation.disbursementDate) {
            req.body.disbursementDate = new Date();
        }

        await donation.update({
            amount,
            type,
            purpose,
            beneficiaryName,
            beneficiaryEmail,
            beneficiaryPhone,
            beneficiaryAddress,
            beneficiaryType,
            receiptUrl,
            region,
            status,
            disbursementDate,
            eventId,
            notes,
            impactMetrics,
            currency,
            itemDetails,
            // updatedById: req.user.id
        });

        if (goalIds && Array.isArray(goalIds)) {
            await donation.$set('goals', goalIds);
        }

        // Get the updated donation with relationships
        const updatedDonation = await DonationOut.findByPk(id, {
            include: [{ model: Goal, as: 'goals' }]
        });
        res.status(200).json({
            success: true,
            data: updatedDonation
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to update outgoing donation',
            error: err.message
        });
    }
};

export const deleteDonationOut = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const count = await DonationOut.destroy({ where: { id } });
        if (!count) {
            res.status(404).json({
                success: false,
                message: 'Outgoing donation not found'
            });
            return
        }
        res.status(200).json({
            success: true,
            message: 'Outgoing donation deleted successfully'
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete outgoing donation',
            error: err.message
        });
    }
};

export const getDonationsOutByGoal = async (req: Request, res: Response) => {
    try {
        const donations = await DonationOut.findAll({ where: { goalId: req.params.goalId } });
        res.json(donations);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getDonationsOutByRegion = async (req: Request, res: Response) => {
    try {
        const donations = await DonationOut.findAll({ where: { region: req.params.region } });
        res.json(donations);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getImpactSummaryByGoal = async (req: Request, res: Response) => {
    try {
        const donations = await DonationOut.findAll({
            where: { goalId: req.params.goalId },
            attributes: ['impactMetrics'],
        });

        const summary = donations.reduce((acc, d) => {
            const metrics = d.impactMetrics || {};
            Object.entries(metrics).forEach(([key, value]) => {
                acc[key] = (acc[key] || 0) + (typeof value === 'number' ? value : 0);
            });
            return acc;
        }, {} as Record<string, number>);

        res.json(summary);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
