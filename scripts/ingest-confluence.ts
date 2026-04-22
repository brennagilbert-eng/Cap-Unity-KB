import 'dotenv/config';
import { runConfluence } from '../server/connectors/confluence.js';

console.log('Starting Confluence ingest across all spaces…\n');
runConfluence()
  .then((n) => console.log(`\nDone! Indexed ${n} documents.`))
  .catch((err) => { console.error(err); process.exit(1); });
