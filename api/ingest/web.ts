import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runWeb } from '../../server/connectors/web.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
