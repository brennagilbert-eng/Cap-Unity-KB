import 'dotenv/config';
import { runConfluence } from '../server/connectors/confluence.js';
import { runJira } from '../server/connectors/jira.js';
import { runSlack } from '../server/connectors/slack.js';
import { runDrive } from '../server/connectors/drive.js';
import { runWeb } from '../server/connectors/web.js';

const CONNECTORS: Record<string, () => Promise<number>> = {
  confluence: runConfluence,
  jira: runJira,
  slack: runSlack,
  drive: runDrive,
  web: runWeb,
};

const target = process.argv[2]; // e.g. "npm run ingest confluence"
const targets = target ? [target] : Object.keys(CONNECTORS);

if (target && !CONNECTORS[target]) {
  console.error(`Unknown source: "${target}". Available: ${Object.keys(CONNECTORS).join(', ')}`);
  process.exit(1);
}

console.log(`\n🚀 Starting Unity ingestion for: ${targets.join(', ')}\n`);

let total = 0;
for (const name of targets) {
  process.stdout.write(`  ⏳ ${name}… `);
  try {
    const count = await CONNECTORS[name]();
    console.log(`✅ ${count} documents`);
    total += count;
  } catch (err) {
    console.log(`❌ ${(err as Error).message}`);
  }
}

console.log(`\n✨ Done. ${total} total documents indexed.\n`);
