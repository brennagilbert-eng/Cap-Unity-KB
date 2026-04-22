import 'dotenv/config';
import { runWeb } from '../server/connectors/web.js';

/**
 * Indexes external API/developer documentation for common integration platforms.
 * Grouped by category: CRM, Support/Ticketing, Communication, Healthcare, Finance.
 * Each platform uses crawl=true with a page cap appropriate to the site structure.
 */

const PLATFORMS = [
  // ── CRM ──────────────────────────────────────────────────────────────────
  {
    name: 'Salesforce (Developer Docs)',
    urls: [
      'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm',
      'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_intro_what_is_apex.htm',
      'https://developer.salesforce.com/docs/atlas.en-us.integrate_rest_api.meta/integrate_rest_api/intro_what_is_rest_api.htm',
    ],
    crawl: false, // Salesforce docs domain is enormous — seed specific pages
  },
  {
    name: 'HubSpot (Developers)',
    urls: ['https://developers.hubspot.com/docs/api/overview'],
    crawl: true,
    maxPages: 40,
  },
  {
    name: 'Microsoft Dynamics 365',
    urls: [
      'https://learn.microsoft.com/en-us/dynamics365/customer-service/overview',
      'https://learn.microsoft.com/en-us/dynamics365/contact-center/overview',
    ],
    crawl: false,
  },

  // ── Support / Ticketing ───────────────────────────────────────────────────
  {
    name: 'Zendesk (Developers)',
    urls: ['https://developer.zendesk.com/api-reference/'],
    crawl: true,
    maxPages: 40,
  },
  {
    name: 'ServiceNow (Developers)',
    urls: ['https://developer.servicenow.com/dev.do#!/reference/api/latest/rest'],
    crawl: true,
    maxPages: 40,
  },
  {
    name: 'Freshdesk (Developers)',
    urls: ['https://developers.freshdesk.com/api/'],
    crawl: true,
    maxPages: 30,
  },

  // ── Communication / CPaaS ─────────────────────────────────────────────────
  {
    name: 'Twilio',
    urls: [
      'https://www.twilio.com/docs/voice',
      'https://www.twilio.com/docs/sms',
      'https://www.twilio.com/docs/flex',
    ],
    crawl: false,
  },
  {
    name: 'Vonage',
    urls: ['https://developer.vonage.com/en/documentation'],
    crawl: true,
    maxPages: 40,
  },
  {
    name: 'Bandwidth',
    urls: ['https://dev.bandwidth.com/'],
    crawl: true,
    maxPages: 40,
  },
  {
    name: 'Telnyx',
    urls: ['https://developers.telnyx.com/'],
    crawl: true,
    maxPages: 30,
  },

  // ── Healthcare ────────────────────────────────────────────────────────────
  {
    name: 'Epic FHIR',
    urls: ['https://fhir.epic.com/Documentation'],
    crawl: true,
    maxPages: 30,
  },
  {
    name: 'Athenahealth',
    urls: ['https://docs.athenahealth.com/api/'],
    crawl: true,
    maxPages: 30,
  },

  // ── EHR / Practice Management ─────────────────────────────────────────────
  {
    name: 'Salesforce Health Cloud',
    urls: ['https://developer.salesforce.com/docs/atlas.en-us.health_cloud.meta/health_cloud/health_cloud_intro.htm'],
    crawl: false,
  },

  // ── Finance / Mortgage ────────────────────────────────────────────────────
  {
    name: 'Encompass (ICE Mortgage)',
    urls: ['https://developer.iceservices.com/'],
    crawl: true,
    maxPages: 30,
  },

  // ── HR / Payroll ──────────────────────────────────────────────────────────
  {
    name: 'Workday (Developers)',
    urls: ['https://developer.workday.com/us/en/'],
    crawl: true,
    maxPages: 30,
  },
  {
    name: 'ADP (Developers)',
    urls: ['https://developers.adp.com/articles/api/all'],
    crawl: true,
    maxPages: 30,
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
