import 'dotenv/config';
import { runWeb } from '../server/connectors/web.js';

/**
 * Indexes external API/admin documentation for major telephony and CCaaS platforms.
 * Uses crawl=true with a per-domain page cap so we get meaningful coverage without
 * spidering entire mega-sites like docs.aws.amazon.com.
 */

const PLATFORMS = [
  {
    name: 'Amazon Connect',
    urls: [
      'https://docs.aws.amazon.com/connect/latest/adminguide/what-is-amazon-connect.html',
      'https://docs.aws.amazon.com/connect/latest/APIReference/Welcome.html',
    ],
    crawl: false, // AWS docs domain is enormous — seed specific pages only
  },
  {
    name: 'Five9',
    urls: [
      'https://webapps.five9.com/assets/files/for_customers/documentation/apis/vcc-web-services-api/',
      'https://dev.five9.com/',
    ],
    crawl: true,
    maxPages: 40,
  },
  {
    name: '8x8',
    urls: [
      'https://developer.8x8.com/',
    ],
    crawl: true,
    maxPages: 40,
  },
  {
    name: 'Genesys Cloud',
    urls: [
      'https://developer.genesys.cloud/api/rest/',
      'https://help.mypurecloud.com/articles/about-genesys-cloud/',
    ],
    crawl: true,
    maxPages: 50,
  },
  {
    name: 'NICE CXone',
    urls: [
      'https://developer.niceincontact.com/',
      'https://help.nice-incontact.com/content/acd/acd_platform/cxone-platform/cxone-overview.htm',
    ],
    crawl: true,
    maxPages: 40,
  },
];

async function main() {
  let grandTotal = 0;

  for (const platform of PLATFORMS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Platform: ${platform.name}`);
    console.log('='.repeat(60));

    try {
      const count = await runWeb({
        urls: platform.urls,
        crawl: platform.crawl,
        maxPages: platform.maxPages ?? 1,
      });
      console.log(`\n✓ ${platform.name}: ${count} chunks indexed`);
      grandTotal += count;
    } catch (err) {
      console.error(`✗ ${platform.name} failed:`, (err as Error).message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`All done! Grand total: ${grandTotal} chunks indexed.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
