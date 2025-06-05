import { Request, Response } from "express";
import { Feedback, FeedbackStatus } from "../database/models/Feedback";
import Event from "../database/models/Event";
import { AuthenticatedRequest } from "../types/auth";

// 1. PRIVATE
// export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const userId = req.user?.id;
//         const {
//             eventId,
//             submittedByName,
//             submittedByEmail,
//             feedbackType,
//             content,
//             rating,
//         } = req.body;

//         const event = await Event.findByPk(eventId);
//         if (!event) {
//             res.status(404).json({ message: 'Event not found' });
//             return
//         }

//         const participation = await EventVolunteer.findOne({
//             where: {
//                 userId,
//                 eventId,
//                 status: [VolunteerStatus.ATTENDED, VolunteerStatus.COMPLETED],
//             },
//         });

//         if (!participation) {
//             res.status(403).json({
//                 message: 'You can only submit feedback for events you participated in.',
//             });
//             return
//         }

//         const feedback = await Feedback.create({
//             userId,
//             eventId,
//             submittedByName,
//             submittedByEmail,
//             feedbackType,
//             content,
//             rating,
//             isPublic: false,
//         });

//         res.status(201).json({ message: 'Feedback submitted', feedback });
//     } catch (error: any) {
//         console.error('Error submitting feedback:', error);
//         res.status(400).json({
//             error: 'Request failed',
//             details: error.errors?.map((e: any) => e.message) || error.message,
//         });;
//     }
// };


export const getMyFeedback = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const feedbacks = await Feedback.findAll({
            where: { userId },
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(feedbacks);
    } catch (error: any) {
        console.error('Error fetching feedback:', error);
        res.status(400).json({
            error: 'Request failed',
            details: error.errors?.map((e: any) => e.message) || error.message,
        });;
    }
};

export const updateFeedbackContent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { feedbackId } = req.params;
        const userId = req.user?.id;
        const {
            content,
            rating,
            feedbackType,
            submittedByName,
            submittedByEmail,
        } = req.body;

        const feedback = await Feedback.findByPk(feedbackId);
        if (!feedback) {
            res.status(404).json({ message: 'Feedback not found' });
            return
        }
        if (feedback.userId !== userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return
        }
        await feedback.update({
            content,
            rating,
            feedbackType,
            submittedByName,
            submittedByEmail,
        });

        res.status(200).json({ message: 'Feedback updated', feedback });
    } catch (error: any) {
        console.error('Error updating feedback:', error);
        res.status(400).json({
            error: 'Request failed',
            details: error.errors?.map((e: any) => e.message) || error.message,
        });
    }
};
export const deleteFeedback = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { feedbackId } = req.params;
        const userId = req.user?.id;

        const feedback = await Feedback.findByPk(feedbackId);
        if (!feedback) {
            res.status(404).json({ message: 'Feedback not found' });
            return
        }
        if (feedback.userId !== userId) {
            res.status(403).json({ message: 'Unauthorized' });
            return
        }
        await feedback.destroy();
        res.status(200).json({ message: 'Feedback deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting feedback:', error);
        res.status(400).json({
            error: 'Request failed',
            details: error.errors?.map((e: any) => e.message) || error.message,
        });
    }
};
// 2. ADMIN
export const getAllFeedbacks = async (_req: Request, res: Response) => {
    try {
        const feedbacks = await Feedback.findAll({
            order: [['created_at', 'DESC']],
            // include: ['user', 'event'],
        });
        res.status(200).json(feedbacks);
    } catch (error: any) {
        res.status(400).json({
            error: 'Request failed',
            details: error.errors?.map((e: any) => e.message) || error.message,
        });;
    }
};
export const updateFeedbackStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const reviewerId = req.user?.id;
        const { feedbackId } = req.params;
        const { status, isPublic, notes } = req.body;

        const feedback = await Feedback.findByPk(feedbackId);
        if (!feedback) {
            res.status(404).json({ message: 'Feedback not found' });
            return
        }

        await feedback.update({
            status,
            isPublic,
            notes,
            reviewedByUserId: reviewerId,
            reviewedAt: new Date(),
        });

        res.status(200).json({ message: 'Feedback status updated', feedback });
    } catch (error: any) {
        console.error('Error updating feedback status:', error);
        res.status(400).json({
            error: 'Request failed',
            details: error.errors?.map((e: any) => e.message) || error.message,
        });;
    }
};

// 3. PUBLIC
export const getPublicFeedbacks = async (_req: Request, res: Response) => {
    try {
        const feedbacks = await Feedback.findAll({
            where: {
                status: FeedbackStatus.APPROVED_FOR_PUBLIC,
            },
            order: [['created_at', 'DESC']],
        });

        res.status(200).json(feedbacks);
    } catch (error: any) {
        console.error('Error fetching public feedbacks:', error);
        res.status(400).json({
            error: 'Request failed',
            details: error.errors?.map((e: any) => e.message) || error.message,
        });;
    }
};

export const getFeedbacksByStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status } = req.params;
        const userId = req.user?.id;

        const isValidStatus = Object.values(FeedbackStatus).includes(status as FeedbackStatus);
        if (!isValidStatus) {
            res.status(400).json({ message: 'Invalid feedback status' });
            return
        }

        let whereClause: any = { status };

        // if (isAdmin) {
        //     // No filtering
        // } else {
        //     // Authenticated user, show their own feedbacks only
        //     whereClause.userId = userId;
        // }

        const feedbacks = await Feedback.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: ['user', 'event'],
        });

        res.status(200).json(feedbacks);
    } catch (error: any) {
        res.status(400).json({
            error: 'Request failed',
            details: error.errors?.map((e: any) => e.message) || error.message,
        });
    }
};

