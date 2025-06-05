import { Request, Response } from 'express';
import DonationIn, { DonationStatus } from '../../database/models/DonationIn';
import Goal from '../../database/models/Goal';
import Event from '../../database/models/Event';
import { AuthenticatedRequest } from '../../types/auth';
import { uploadBufferToAzure } from '../../utils/uploadToAzure';

export const createDonationIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      amount,
      type,
      source,
      purpose,
      donorName,
      donorEmail,
      donorPhone,
      receiptUrl,
      status = DonationStatus.PENDING,
      receivedDate,
      goalIds = [],
      eventId,
      isRecurring = false,
      recurringFrequency,
      notes,
      currency = 'USD',
      isAnonymous = false,
      donorAddress,
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
    // Create the donation
    const donation = await DonationIn.create({
      amount,
      type,
      source,
      purpose,
      donorName,
      donorEmail,
      donorPhone,
      receiptUrl: url,
      status,
      receivedDate,
      eventId,
      isRecurring,
      recurringFrequency,
      notes,
      currency,
      isAnonymous,
      donorAddress,
      createdById: req.user!.id,
      organizationId: req.user!.organizationId
    });

    if (goalIds.length > 0) {
      await donation.$set('goals', goalIds);
    }

    for (const goal of existingGoals!) {
      await goal.save();
    }
    const donationWithRelations = await DonationIn.findByPk(donation.id, {
      include: [{ model: Goal, as: 'goals' }]
    });

    res.status(201).json({
      success: true,
      data: donationWithRelations
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create donation',
      error: err.message
    });
  }
};

export const getAllDonationsIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, eventId, goalId, type } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (goalId) where.goalId = goalId;
    if (type) where.type = type;
    if (eventId) where.eventId = eventId;
    where.organizationId = req.user!.organizationId

    const donations = await DonationIn.findAll({ where, include: [{ model: Goal, as: 'goals' }, Event] });

    res.status(200).json({
      success: true,
      data: donations
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donations',
      error: err.message
    });
  }
};

export const getDonationInById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const donation = await DonationIn.findByPk(id, { include: [{ model: Goal, as: 'goals' }, Event] });
    if (!donation) {
      res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
      return
    }
    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donation',
      error: err.message
    });
  }
};

export const updateDonationIn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const donation = await DonationIn.findByPk(id);
    if (!donation) {
      res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
      return
    }

    if (req.body.status === DonationStatus.RECEIVED && !donation.receivedDate) {
      req.body.receivedDate = new Date();
    }

    await donation.update(req.body);
    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update donation',
      error: err.message
    });
  }
};

export const deleteDonationIn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const count = await DonationIn.destroy({ where: { id } });
    if (!count) {
      res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete donation',
      error: err.message
    });
  }
};

export const getRecurringDonationsIn = async (_: Request, res: Response) => {
  try {
    const donations = await DonationIn.findAll({ where: { isRecurring: true } });
    res.json(donations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDonationsInByGoal = async (req: Request, res: Response) => {
  try {
    const donations = await DonationIn.findAll({ where: { goalId: req.params.goalId } });
    res.json(donations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
