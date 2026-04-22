import { Router } from 'express';
import { runConfluence } from '../connectors/confluence.js';
import { runJira } from '../connectors/jira.js';
import { runSlack } from '../connectors/slack.js';
import { runDrive } from '../connectors/drive.js';

export const ingestRouter = Router();

const CONNECTORS: Record<string, () => Promise<number>> = {
  confluence: runConfluence,
  jira: runJira,
  slack: runSlack,
  drive: runDrive,
};

ingestRouter.post('/', async (req, res) => {
  const { source } = req.body as { source?: string };

  const targets = source ? [source] : Object.keys(CONNECTORS);
  const unknown = targets.filter((t) => !CONNECTORS[t]);
  if (unknown.length) {
    return res.status(400).json({ error: `Unknown source(s): ${unknown.join(', ')}` });
  }

  try {
    const results: Record<string, number> = {};
    for (const t of targets) {
      console.log(`[ingest] Starting ${t}…`);
      results[t] = await CONNECTORS[t]();
      console.log(`[ingest] ${t}: ${results[t]} documents indexed`);
    }
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    return res.json({
      message: `Ingestion complete. ${total} documents indexed.`,
      results,
    });
  } catch (err) {
    console.error('[ingest]', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});
