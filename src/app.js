import express from 'express';
import cors from 'cors';
import testRoutes from './routes/tests.js';
import attemptRoutes from './routes/attempts.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
