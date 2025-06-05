import { Router } from 'express';
import { createDonationIn, deleteDonationIn, getAllDonationsIn, getDonationInById, updateDonationIn } from '../controllers/donations/donationIn.controller';
import { createDonationOut, deleteDonationOut, getAllDonationsOut, getDonationOutById, updateDonationOut } from '../controllers/donations/donationOut.controller';
import { Permission } from '../types/rbac.types';
import { requirePermission } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload';

const donationsRouter = Router();;

// Donation Inflow Routes
donationsRouter.post('/in',
    upload.single('file'),
    requirePermission(Permission.CREATE_DONATION),
    createDonationIn);

donationsRouter.get('/in',
    requirePermission(Permission.READ_DONATION),
    getAllDonationsIn);

// donationsRouter.get('/in/statistics',  DonationInController.getStatistics);
donationsRouter.get('/in/:id',
    requirePermission(Permission.READ_DONATION),
    getDonationInById);

donationsRouter.put('/in/:id',
    requirePermission(Permission.UPDATE_DONATION),
    upload.single('file'),
    updateDonationIn);

donationsRouter.delete('/in/:id',
    requirePermission(Permission.DELETE_DONATION),
    deleteDonationIn);

// donationsRouter.patch('/in/:id/status',  DonationInController.updateStatus);

// // Donation Outflow Routes
donationsRouter.post('/out',
    upload.single('file'),
    requirePermission(Permission.CREATE_DONATION),
    createDonationOut);

donationsRouter.get('/out',
    requirePermission(Permission.READ_DONATION),
    getAllDonationsOut);

// donationsRouter.get('/out/statistics',  DonationOutController.getStatistics);

donationsRouter.get('/out/:id',
    requirePermission(Permission.READ_DONATION),
    getDonationOutById);

donationsRouter.put('/out/:id',
    requirePermission(Permission.UPDATE_DONATION),
    upload.single('file'),
    updateDonationOut);

donationsRouter.delete('/out/:id',
    requirePermission(Permission.DELETE_DONATION),
    deleteDonationOut);

// donationsRouter.patch('/out/:id/status',  DonationOutController.updateStatus);

export default donationsRouter;