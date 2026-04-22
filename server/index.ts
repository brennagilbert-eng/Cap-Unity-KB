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

// Web-specific ingest endpoint used by the sidebar UI
import { runWeb } from './connectors/web.js';
app.post('/api/ingest/web', async (req, res) => {
  const { urls, crawl } = req.body as { urls?: string[]; crawl?: boolean };
  if (!Array.isArray(urls) || !urls.length) {
    return res.status(400).json({ error: 'urls array is required' });
  }
  try {
    const count = await runWeb({ urls, crawl: crawl ?? false });
    return res.json({ message: `Indexed ${count} chunks from ${urls.length} URL(s).` });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Unity server running on http://localhost:${PORT}`);
});
