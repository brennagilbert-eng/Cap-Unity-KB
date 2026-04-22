import 'dotenv/config';
import { readFileSync } from 'fs';
import { upsertDocument } from '../server/lib/embeddings.js';

const CHUNK_SIZE = 1500;
const OVERLAP = 225;

function chunkText(text: string): string[] {
  // Clean up PDF extraction artifacts
  const cleaned = text
    .replace(/\f/g, '\n')           // form feeds → newlines
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')     // collapse excess blank lines
    .replace(/[ \t]{3,}/g, ' ')     // collapse excess spaces
    .trim();

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 80) chunks.push(chunk);
    if (end === cleaned.length) break;
    start += CHUNK_SIZE - OVERLAP;
  }
  return chunks;
}

const DOCS = [
  {
    source_id: 'drive:amazon-connect-api-reference',
    title: 'Amazon Connect API Reference',
    textFile: '/tmp/connect-api.txt',
    url: 'https://docs.aws.amazon.com/connect/latest/APIReference/Welcome.html',
  },
  {
    source_id: 'drive:amazon-connect-agent-workspace-dev-guide',
    title: 'Amazon Connect Agent Workspace Developer Guide',
    textFile: '/tmp/developer-guide.txt',
    url: 'https://docs.aws.amazon.com/connect/latest/adminguide/agent-workspace.html',
  },
  {
    source_id: 'drive:oracle-crm-cti-developer-guide',
    title: 'Oracle CRM On Demand CTI Developer\'s Guide (Release 45)',
    textFile: '/tmp/oracle-cti.txt',
    url: 'https://docs.oracle.com/en/cloud/saas/sales/r45/cti/index.html',
  },
];

async function main() {
  let grandTotal = 0;

  for (const doc of DOCS) {
    const text = readFileSync(doc.textFile, 'utf8');
    const chunks = chunkText(text);
    console.log(`\nIndexing "${doc.title}": ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      await upsertDocument({
        source: 'drive',
        source_id: `${doc.source_id}:${i}`,
        title: doc.title,
        content: chunks[i],
        url: doc.url,
        author: 'pdf-import',
      });
      if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${chunks.length}\n`);
      else process.stdout.write('.');
    }

    grandTotal += chunks.length;
    console.log(`\n✓ Done — ${chunks.length} chunks`);
  }

  console.log(`\nAll done! ${grandTotal} total chunks indexed.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
