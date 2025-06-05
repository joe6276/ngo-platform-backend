import { Router } from "express";
import { createEvent, deleteEvent, deleteEventUser, deleteMedia, getEventById, getEvents, getMediaByEvent, getParticipantsByEvent, getVolunteersByEvent, updateEvent, uploadHandler, uploadMedia } from "../controllers/event.controllers";
import { requirePermission } from "../middlewares/auth.middleware";
import { Permission } from "../types/rbac.types";
import { upload } from "../middlewares/upload";

const eventsRouter = Router();

eventsRouter.get("/",
    requirePermission(Permission.READ_EVENT),
    getEvents)

eventsRouter.get("/:id",
    requirePermission(Permission.READ_EVENT),
    getEventById)

eventsRouter.post("/upload/:eventId/:type",
    requirePermission(Permission.CREATE_EVENT),
    upload.single('file'),
    uploadHandler)

eventsRouter.put("/:id",
    requirePermission(Permission.UPDATE_EVENT),
    updateEvent)

eventsRouter.put("/:id",
    requirePermission(Permission.UPDATE_EVENT),
    updateEvent)

eventsRouter.delete("/:id",
    requirePermission(Permission.DELETE_EVENT),
    deleteEvent)

eventsRouter.get('/:eventId/volunteers',
     getVolunteersByEvent);

eventsRouter.get('/:eventId/participants', 
    getParticipantsByEvent);

eventsRouter.delete('/event-users/:type/:id',
     deleteEventUser);

// Media
eventsRouter.get("/:id/media",
    requirePermission(Permission.READ_EVENT),
    getMediaByEvent)

eventsRouter.post("/:id/media",
    requirePermission(Permission.CREATE_EVENT),
    upload.array('files[]'),
    uploadMedia)

eventsRouter.delete("/media/:id",
    requirePermission(Permission.DELETE_EVENT),
    deleteMedia)


export default eventsRouter