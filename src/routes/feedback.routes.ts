import { Router } from "express";
import { deleteFeedback, getAllFeedbacks, getFeedbacksByStatus, getMyFeedback, getPublicFeedbacks, updateFeedbackContent, updateFeedbackStatus } from "../controllers/feedback.controllers";

const feedbackRouter = Router()

// 1. Private
// feedbackRouter.post('/', submitFeedback);
feedbackRouter.get('/my', getMyFeedback);
feedbackRouter.get('/public', getPublicFeedbacks);
feedbackRouter.get('/all', getAllFeedbacks);
feedbackRouter.put('/:feedbackId', updateFeedbackContent); 
feedbackRouter.delete('/:feedbackId', deleteFeedback);
feedbackRouter.get('/:status', getFeedbacksByStatus);

feedbackRouter.patch('/:feedbackId', updateFeedbackStatus);


export default feedbackRouter