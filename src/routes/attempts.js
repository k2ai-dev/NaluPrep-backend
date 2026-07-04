import { Router } from 'express';
import {
  startAttempt,
  saveAnswer,
  submitAttempt,
} from '../controllers/attemptController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', asyncHandler(startAttempt));
router.post('/:id/answers', asyncHandler(saveAnswer));
router.post('/:id/submit', asyncHandler(submitAttempt));

export default router;
