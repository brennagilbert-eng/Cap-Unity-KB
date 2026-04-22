import axios from 'axios';
import { upsertDocument } from '../lib/embeddings.js';

interface ConfluencePage {
  id: string;
  title: string;
  _links: { webui: string };
  body: { storage: { value: string } };
  version: { by: { displayName: string } };
  space: { key: string };
}

/** Strip HTML tags from Confluence storage-format content */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000); // keep chunks manageable
}

export async function runConfluence(): Promise<number> {
  const base = process.env.CONFLUENCE_BASE_URL;
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;
  const spaceKeys = (process.env.CONFLUENCE_SPACE_KEY ?? '').split(',').filter(Boolean);

  if (!base || !email || !token) {
    console.warn('[confluence] Missing env vars — skipping.');
    return 0;
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}`, Accept: 'application/json' };

  let indexed = 0;

  for (const spaceKey of spaceKeys.length ? spaceKeys : ['~']) {
    let start = 0;
    const limit = 50;

    while (true) {
      const url = `${base}/wiki/rest/api/content?spaceKey=${spaceKey}&type=page&expand=body.storage,version.by,space&limit=${limit}&start=${start}`;
      const { data } = await axios.get<{ results: ConfluencePage[]; size: number }>(url, {
        headers,
      });

      for (const page of data.results) {
        const content = stripHtml(page.body?.storage?.value ?? '');
        if (!content) continue;

        await upsertDocument({
          source: 'confluence',
          source_id: `confluence_${page.id}`,
          title: page.title,
          content,
          url: `${base}/wiki${page._links.webui}`,
          author: page.version?.by?.displayName,
        });
        indexed++;
      }

      if (data.results.length < limit) break;
      start += limit;
    }
  }

  return indexed;
}
