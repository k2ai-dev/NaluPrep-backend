import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

async function getAttemptOrThrow(attemptId) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          questions: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  return attempt;
}

function assertAttemptInProgress(attempt) {
  if (attempt.status !== 'IN_PROGRESS') {
    throw new AppError('Attempt is already completed', 400);
  }
}

export async function startAttempt(req, res) {
  const { user_id: userId, test_id: testId } = req.body;

  if (!userId || !testId) {
    throw new AppError('user_id and test_id are required', 400);
  }

  const [user, test] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.test.findUnique({ where: { id: testId } }),
  ]);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!test) {
    throw new AppError('Test not found', 404);
  }

  const attempt = await prisma.testAttempt.create({
    data: {
      userId,
      testId,
    },
    select: {
      id: true,
      userId: true,
      testId: true,
      status: true,
      score: true,
      startedAt: true,
      completedAt: true,
    },
  });

  res.status(201).json(attempt);
}

export async function saveAnswer(req, res) {
  const { id: attemptId } = req.params;
  const { question_id: questionId, selected_option_id: selectedOptionId } = req.body;

  if (!questionId || !selectedOptionId) {
    throw new AppError('question_id and selected_option_id are required', 400);
  }

  const attempt = await getAttemptOrThrow(attemptId);
  assertAttemptInProgress(attempt);

  const questionBelongsToTest = attempt.test.questions.some(
    (question) => question.id === questionId,
  );

  if (!questionBelongsToTest) {
    throw new AppError('Question does not belong to this test', 400);
  }

  const option = await prisma.option.findFirst({
    where: {
      id: selectedOptionId,
      questionId,
    },
  });

  if (!option) {
    throw new AppError('Selected option is invalid for this question', 400);
  }

  const answer = await prisma.answer.upsert({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
    create: {
      attemptId,
      questionId,
      selectedOptionId,
    },
    update: {
      selectedOptionId,
    },
    select: {
      id: true,
      attemptId: true,
      questionId: true,
      selectedOptionId: true,
    },
  });

  res.status(200).json(answer);
}

export async function submitAttempt(req, res) {
  const { id: attemptId } = req.params;

  const attempt = await getAttemptOrThrow(attemptId);
  assertAttemptInProgress(attempt);

  const totalQuestions = attempt.test.questions.length;

  const answers = await prisma.answer.findMany({
    where: { attemptId },
    include: {
      selectedOption: {
        select: { isCorrect: true },
      },
      question: {
        select: { id: true },
      },
    },
  });

  const correctCount = answers.filter(
    (answer) => answer.selectedOption.isCorrect,
  ).length;

  const score = totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;

  const completedAt = new Date();

  const updatedAttempt = await prisma.testAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'COMPLETED',
      score,
      completedAt,
    },
    select: {
      id: true,
      userId: true,
      testId: true,
      status: true,
      score: true,
      startedAt: true,
      completedAt: true,
    },
  });

  res.json({
    attempt: updatedAttempt,
    result: {
      totalQuestions,
      answeredQuestions: answers.length,
      correctCount,
      score,
    },
  });
}
