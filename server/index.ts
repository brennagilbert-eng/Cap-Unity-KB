import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { askRouter } from './routes/ask.js';
import { ingestRouter } from './routes/ingest.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/ask', askRouter);
app.use('/api/ingest', ingestRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Unity server running on http://localhost:${PORT}`);
});
