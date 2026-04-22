/**
 * Full deep crawl of support.capacity.com and docs.awaken.io.
 * Run with: npx tsx scripts/crawl-sites.ts
 *
 * Both sites will be crawled exhaustively (up to maxPages per domain).
 * Existing chunks are upserted (idempotent — safe to re-run).
 */
import 'dotenv/config';
import { runWeb } from '../server/connectors/web.js';

async function main() {
  const start = Date.now();
  console.log('🕷️  Starting full site crawl...\n');

  const total = await runWeb({
    urls: [
      'https://support.capacity.com/',
      'https://docs.awaken.io/ag/core/',
    ],
    crawl: true,
    maxPages: 2000, // high enough to cover both sites fully
  });

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n✅ Crawl complete — ${total} total chunks indexed in ${elapsed} min`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
