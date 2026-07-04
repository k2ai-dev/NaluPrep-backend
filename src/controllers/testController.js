import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getTestQuestions(req, res) {
  const { id } = req.params;

  const test = await prisma.test.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      targetDurationMinutes: true,
      questions: {
        orderBy: { orderNum: 'asc' },
        select: {
          id: true,
          passageText: true,
          promptText: true,
          orderNum: true,
          options: {
            select: {
              id: true,
              text: true,
            },
          },
        },
      },
    },
  });

  if (!test) {
    throw new AppError('Test not found', 404);
  }

  res.json(test);
}
