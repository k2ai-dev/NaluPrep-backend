import { Router } from 'express';
import { getTestQuestions } from '../controllers/testController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/:id/questions', asyncHandler(getTestQuestions));

export default router;
