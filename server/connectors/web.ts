import axios from 'axios';
import * as cheerio from 'cheerio';
import { upsertDocument } from '../lib/embeddings.js';

const CHUNK_SIZE = 1500;  // characters per chunk
const CRAWL_DELAY_MS = 400; // be polite to servers

/** Extract clean readable text from an HTML page */
function extractText($: cheerio.CheerioAPI): string {
  // Remove noise elements
  $('script, style, nav, footer, header, iframe, noscript, [role="navigation"], .sidebar, .toc, .breadcrumb').remove();

  // Prefer main content areas
  const main =
    $('main, article, [role="main"], .content, #content, .docs-content, .markdown-body, .article-body, .post-body')
      .first()
      .text() || $('body').text();

  return main.replace(/\s+/g, ' ').trim();
}

/** Extract page title */
function extractTitle($: cheerio.CheerioAPI, url: string): string {
  return (
    $('h1').first().text().trim() ||
    $('title').text().replace(/\s*[|\-–]\s*.+$/, '').trim() || // strip site name suffix
    new URL(url).pathname
  );
}

/** Extract all same-domain links from a page */
function extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const { origin, hostname } = new URL(baseUrl);
  const links: string[] = [];

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === hostname && resolved.origin === origin) {
        // Normalise — strip hash, query params that are just anchors, and trailing slash
        resolved.hash = '';
        const clean = resolved.toString().replace(/\/$/, '');
        // Skip binary/media file extensions
        if (/\.(pdf|png|jpg|jpeg|gif|svg|ico|zip|mp4|mp3|woff|woff2|ttf|css|js)(\?|$)/i.test(clean)) return;
        links.push(clean);
      }
    } catch {
      // invalid URL — skip
    }
  });

  return [...new Set(links)];
}

/** Split a long text into overlapping chunks */
function chunkText(text: string, size = CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += Math.floor(size * 0.85); // 15% overlap between chunks
  }
  return chunks;
}

interface FetchResult {
  text: string;
  title: string;
  links: string[];
}

/** Fetch a URL once, return text + links together (avoids double-fetch) */
async function fetchPage(url: string, extractLinksFlag: boolean): Promise<FetchResult | null> {
  let html: string;
  try {
    const res = await axios.get<string>(url, {
      timeout: 15_000,
      headers: {
        'User-Agent': 'Unity-KnowledgeBot/1.0 (internal indexer; contact brenna.gilbert@capacity.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      responseType: 'text',
    });
    html = res.data;
  } catch (err) {
    console.warn(`  [web] Could not fetch ${url}: ${(err as Error).message}`);
    return null;
  }

  const $ = cheerio.load(html);
  const text = extractText($);
  const title = extractTitle($, url);
  const links = extractLinksFlag ? extractLinks($, url) : [];

  return { text, title, links };
}

/** Fetch and index a single URL, return chunks written + links found */
async function indexPage(url: string, crawl: boolean): Promise<{ chunks: number; links: string[] }> {
  const result = await fetchPage(url, crawl);
  if (!result) return { chunks: 0, links: [] };

  const { text, title, links } = result;
  if (text.length < 80) return { chunks: 0, links }; // skip near-empty pages

  const chunks = chunkText(text);
  for (let i = 0; i < chunks.length; i++) {
    await upsertDocument({
      source: 'web',
      source_id: `web_${Buffer.from(`${url}__${i}`).toString('base64').slice(0, 60)}`,
      title: chunks.length > 1 ? `${title} (${i + 1}/${chunks.length})` : title,
      content: chunks[i],
      url,
    });
  }

  return { chunks: chunks.length, links };
}

export interface WebCrawlOptions {
  /** Seed URLs to crawl */
  urls: string[];
  /** Follow links within the same domain? Default: false */
  crawl?: boolean;
  /** Max pages to index per seed domain. Default: 50 */
  maxPages?: number;
}

/**
 * Web connector — index a list of URLs (and optionally crawl their domains).
 * Reads KNOWLEDGE_URLS from env as a fallback if no urls provided.
 */
export async function runWeb(opts?: WebCrawlOptions): Promise<number> {
  const envUrls = (process.env.KNOWLEDGE_URLS ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  const seeds = opts?.urls?.length ? opts.urls : envUrls;

  if (!seeds.length) {
    console.warn('[web] No URLs provided. Set KNOWLEDGE_URLS in .env or pass urls to runWeb().');
    return 0;
  }

  const crawl = opts?.crawl ?? false;
  const maxPages = opts?.maxPages ?? 50;
  let totalChunks = 0;

  for (const seed of seeds) {
    console.log(`\n[web] Starting: ${seed}${crawl ? ` (full crawl, max ${maxPages} pages)` : ''}`);
    const visited = new Set<string>();
    const queue: string[] = [seed];
    let pageCount = 0;
    let chunkCount = 0;

    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);
      pageCount++;

      const { chunks, links } = await indexPage(url, crawl);
      chunkCount += chunks;
      totalChunks += chunks;

      if (chunks > 0) {
        process.stdout.write(`  [${pageCount}/${maxPages}] ✓ ${url} (${chunks} chunks)\n`);
      } else {
        process.stdout.write(`  [${pageCount}/${maxPages}] – ${url} (skipped)\n`);
      }

      if (crawl) {
        for (const link of links) {
          if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        }
      }

      if (queue.length > 0) await new Promise((r) => setTimeout(r, CRAWL_DELAY_MS));
    }

    console.log(`\n[web] Done: ${seed}`);
    console.log(`  Pages visited: ${visited.size} | Chunks indexed: ${chunkCount}`);
    if (queue.length > 0) console.log(`  ${queue.length} pages remaining in queue (hit maxPages limit)`);
  }

  return totalChunks;
}
