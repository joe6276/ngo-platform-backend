import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Goal from '../database/models/Goal';
import Event, { EventStatus } from '../database/models/Event';
import { AuthenticatedRequest } from '../types/auth';
import { Media } from '../database/models/Media';
import { uploadBufferToAzure } from '../utils/uploadToAzure';
import { containerClient } from '../lib/azureBlob';
import XLSX from 'xlsx';
import { Volunteer } from '../database/models/Volunteer';
import { Participant } from '../database/models/Participant';

export const getEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            status,
            category,
            region,
            goalId,
            startDate,
            endDate,
            search
        } = req.query;

        // Build where clause based on filters
        const whereClause: any = {};
        whereClause.organizationId = req.user!.organizationId
        if (status) whereClause.status = status;
        if (category) whereClause.category = category;
        if (region) whereClause.region = region;
        if (goalId) whereClause.strategicGoalId = goalId;

        // Date range filtering
        if (startDate && endDate) {
            whereClause.eventDate = {
                [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
            };
        } else if (startDate) {
            whereClause.eventDate = {
                [Op.gte]: new Date(startDate as string)
            };
        } else if (endDate) {
            whereClause.eventDate = {
                [Op.lte]: new Date(endDate as string)
            };
        }

        // Search functionality
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const events = await Event.findAll({
            where: whereClause,
            include: [
                { model: Goal, as: 'goal' },
                // { model: User, as: 'creator' },
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: events
        });
    } catch (error: any) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message
        });
    }
};

/**
 * Get a single event by ID
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const event = await Event.findByPk(id, {
            include: [
                { model: Goal, as: 'goal' },
                // { model: User, as: 'creator' },
                // { model: Media, as: 'media' },
                // { model: Feedback, as: 'feedback' }
            ]
        });

        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error: any) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: error.message
        });
    }
};

/**
 * Create a new event
 */
export const createEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            title,
            description,
            category,
            location,
            startDate,
            endDate,
            status = EventStatus.DRAFT,
            goalId,
            expectedParticipants,
            budget,
            outcomes
        } = req.body;

        // Validate required fields
        if (!title || !description || !category || !location || !startDate || !endDate || !goalId) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
            return;
        }

        // Check if related goal exists
        const goal = await Goal.findByPk(goalId);
        if (!goal) {
            res.status(400).json({
                success: false,
                message: 'Goal not found'
            });
            return;
        }
        if (new Date(endDate) <= new Date(startDate)) {
            res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
            return;
        }
        // Create event
        const event = await Event.create({
            title,
            description,
            category,
            location,
            startDate,
            endDate,
            status,
            goalId,
            createdById: req.user?.id,
            expectedParticipants,
            budget,
            outcomes,
            organizationId: req.user!.organizationId
        });
        goal.save()
        res.status(201).json({
            success: true,
            data: event,
            message: 'Event created successfully'
        });
    } catch (error: any) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: error.message
        });
    }
};

/**
 * Update an existing event
 */
export const updateEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // Find event
        const event = await Event.findByPk(id);

        const {
            title,
            description,
            category,
            location,
            startDate,
            endDate,
            status,
            goalId,
            expectedParticipants,
            actualParticipants,
            budget,
            outcomes,
            mediaUrls
        } = req.body || {};

        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }

        // Check status transition
        if (status && status !== event.status) {
            // Implement status workflow validation
            const validTransitions: Record<string, EventStatus[]> = {
                [EventStatus.DRAFT]: [EventStatus.SUBMITTED],
                [EventStatus.SUBMITTED]: [EventStatus.APPROVED, EventStatus.CANCELLED],
                [EventStatus.APPROVED]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
                [EventStatus.COMPLETED]: [],
                [EventStatus.CANCELLED]: []
            };

            if (!validTransitions[event.status].includes(status)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid status transition from ${event.status} to ${status}`
                });
                return;
            }
        }

        // If changing to completed status, ensure post-event data is provided
        if (status === EventStatus.COMPLETED && (!actualParticipants || !outcomes)) {
            res.status(400).json({
                success: false,
                message: 'Post-event data required to mark event as completed'
            });
            return;
        }

        // If strategic goal is being changed, check if the new one exists
        if (goalId && goalId !== event.goalId) {
            const goal = await Goal.findByPk(goalId);
            if (!goal) {
                res.status(400).json({
                    success: false,
                    message: 'Goal not found'
                });
                return;
            }
        }

        // Update event
        await event.update({
            title: title || event.title,
            description: description || event.description,
            category: category || event.category,
            location: location || event.location,
            startDate: startDate || event.startDate,
            endDate: endDate || event.endDate,
            status: status || event.status,
            goalId: goalId || event.goalId,
            expectedParticipants: expectedParticipants !== undefined ? expectedParticipants : event.expectedParticipants,
            actualParticipants: actualParticipants !== undefined ? actualParticipants : event.actualParticipants,
            budget: budget !== undefined ? budget : event.budget,
            outcomes: outcomes || event.outcomes,
            mediaUrls: mediaUrls || event.mediaUrls,
            lastUpdatedBy: req.user?.id
        });

        res.status(200).json({
            success: true,
            data: event,
            message: 'Event updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: error.message
        });
    }
};

/**
 * Delete an event
 */
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const event = await Event.findByPk(id);
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }

        // Prevent deletion of events that are not in draft or rejected status
        if (![EventStatus.DRAFT, EventStatus.SUBMITTED, EventStatus.CANCELLED].includes(event.status)) {
            res.status(400).json({
                success: false,
                message: `Cannot delete events with ${event.status} status`
            });
            return;
        }

        // Delete the event
        await event.destroy();

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error.message
        });
    }
};


export const completeEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            actualParticipants,
            outcomes
        } = req.body;

        if (!actualParticipants || !outcomes) {
            res.status(400).json({
                success: false,
                message: 'Actual participants count and outcomes are required'
            });
            return;
        }

        const event = await Event.findByPk(id);
        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Event not found'
            });
            return;
        }

        // Verify event is in appropriate status
        if (event.status !== 'Approved') {
            res.status(400).json({
                success: false,
                message: 'Only approved events can be completed'
            });
            return;
        }

        // Update event with completion data
        await event.update({
            status: EventStatus.COMPLETED,
            actualParticipants,
            outcomes,
            completedById: req.user?.id
        });


        res.status(200).json({
            success: true,
            message: 'Event marked as completed successfully',
            data: event
        });
    } catch (error: any) {
        console.error('Error completing event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete event',
            error: error.message
        });
    }
};

 export const getMediaByEvent = async (req: Request, res: Response) => {
    const { id: eventId } = req.params;

    try {
        const media = await Media.findAll({ where: { eventId } });
        res.json({ data: media });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
};

export const uploadMedia = async (req: Request, res: Response) => {
    const { id: eventId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || !files.length) {
        res.status(400).json({ error: 'No files uploaded' });
        return
    }

    try {
        const uploaded = await Promise.all(files.map(async (file) => {
            const url = await uploadBufferToAzure(file);
            return Media.create({
                url,
                type: file.mimetype,
                size: file.size,
                name: file.originalname,
                eventId: eventId,
            });
        }));

        res.status(201).json({ data: uploaded });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
};

export const deleteMedia = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const media = await Media.findByPk(id);
        if (!media) {
            res.status(404).json({ error: 'Media not found' });
            return
        }

        const blobUrl = new URL(media.url);
        const blobPath = decodeURIComponent(blobUrl.pathname.split('/').pop() || '');

        const blobClient = containerClient.getBlockBlobClient(blobPath);
        await blobClient.deleteIfExists();

        await media.destroy();

        res.json({ message: 'Media deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete media' });
    }
};

const requiredColumnsMap: Record<string, string[]> = {
    volunteers: ['name', 'task'],
    participants: ['name', 'role', 'age', 'contact', 'address'],
};

export const uploadHandler = async (req: Request, res: Response) => {
    try {
        const { type, eventId } = req.params;
        const buffer = req.file?.buffer;

        if (!buffer) {
            res.status(400).send('No file uploaded');
            return
        }

        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (!['volunteers', 'participants'].includes(type)) {
            res.status(400).send('Invalid type');
            return
        }

        const requiredColumns = requiredColumnsMap[type];
        const firstRow = data[0] as Record<string, any>;

        if (!firstRow) {
            res.status(400).send('Sheet is empty');
            return
        }

        const fileColumns = Object.keys(firstRow).map(col => col.toLowerCase());
        const missing = requiredColumns.filter(
            col => !fileColumns.includes(col.toLowerCase())
        );

        if (missing.length > 0) {
            res
                .status(400)
                .json({ error: `Missing required columns: ${missing.join(', ')}` });
            return
        }

        if (type === 'volunteers') {
            const formatted = (data as any[]).map(row => ({
                name: row['name'],
                task: row['task'],
                eventId,
            }));
            await Volunteer.bulkCreate(formatted);
        } else if (type === 'participants') {
            const formatted = (data as any[]).map(row => ({
                name: row['name'],
                role: row['role'],
                age: Number(row['age']),
                contact: row['contact'],
                address: row['address'],
                eventId,
            }));
            await Participant.bulkCreate(formatted);
        }

        res.status(200).send('Data imported successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export const getVolunteersByEvent = async (req: Request, res: Response) => {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== 'string') {
        res.status(400).json({ error: 'Invalid or missing eventId' });
        return
    }

    try {
        const event = await Event.findByPk(eventId);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return
        }

        const volunteers = await Volunteer.findAll({ where: { eventId } });
        res.status(200).json({ data: volunteers });
    } catch (err) {
        console.error('Error fetching volunteers:', err);
        res.status(500).json({ error: 'Failed to fetch volunteers' });
    }
};

export const getParticipantsByEvent = async (req: Request, res: Response) => {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== 'string') {
        res.status(400).json({ error: 'Invalid or missing eventId' });
        return
    }

    try {
        const event = await Event.findByPk(eventId);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return
        }

        const participants = await Participant.findAll({ where: { eventId } });
        res.status(200).json({ data: participants });
    } catch (err) {
        console.error('Error fetching participants:', err);
        res.status(500).json({ error: 'Failed to fetch participants' });
    }
};

export const deleteEventUser = async (req: Request, res: Response) => {
    const { type, id } = req.params;
    try {
        if (type === 'volunteer') {
            const deleted = await Volunteer.destroy({ where: { id } });
            if (!deleted) {
                res.status(404).json({ error: 'Volunteer not found' })
                return
            };
        } else if (type === 'participant') {
            const deleted = await Participant.destroy({ where: { id } });
            if (!deleted) {
                res.status(404).json({ error: 'Participant not found' })
                return
            };
        } else {
            res.status(400).json({ error: 'Invalid type' });
        }

        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};