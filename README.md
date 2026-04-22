# Unity — Internal Knowledge Assistant

Ask questions about Capacity's product, roadmap, positioning, and past work. Unity searches across Confluence, Jira, Slack, and Google Drive and returns grounded answers with source citations.

---

## Setup (15 min)

### 1. Clone the repo

```bash
git clone https://github.com/brennagilbert-eng/Cap-Unity-KB.git
cd Cap-Unity-KB
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine)
2. Once created, go to **Settings → API** and copy:
   - **Project URL**
   - **anon** public key
   - **service_role** secret key
3. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql)

### 3. Get an OpenAI API key

Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys) and create a key.

### 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in **at minimum** these five values:

```env
OPENAI_API_KEY=sk-...

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

The connector credentials (Confluence, Jira, Slack, Drive) in `.env` are optional for local dev — ingestion can be run via the Cowork MCP connections instead.

### 5. Run the app

```bash
npm run dev
```

- Frontend → http://localhost:5173
- API server → http://localhost:3001

---

## Ingesting knowledge

Before answers work, you need to populate the knowledge base.

**Run all connectors at once:**
```bash
npm run ingest
```

**Or run a single source:**
```bash
npm run ingest:confluence
npm run ingest:jira
npm run ingest:slack
npm run ingest:drive
```

Ingestion is safe to re-run — it upserts, so existing documents are updated rather than duplicated.

---

## Project structure

```
├── src/                    React frontend
│   ├── components/
│   │   ├── ChatInterface   Q&A input + message thread
│   │   ├── MessageBubble   Answer card with citations
│   │   ├── Sidebar         Source filter toggles
│   │   └── SourceBadge     Confluence / Jira / Slack / Drive pills
│   └── lib/api.ts          Calls to backend
├── server/
│   ├── routes/ask.ts       RAG pipeline (embed → search → GPT-4o)
│   ├── routes/ingest.ts    POST /api/ingest trigger
│   ├── lib/
│   │   ├── embeddings.ts   OpenAI embed + Supabase vector search
│   │   ├── openai.ts       OpenAI client
│   │   └── supabase.ts     Supabase service-role client
│   └── connectors/         One file per data source
├── scripts/ingest.ts       CLI ingestion runner
└── supabase/schema.sql     Run once to set up the DB
```

---

## Environment variables reference

See [`.env.example`](./.env.example) for all variables. Required ones are marked above. Connector credentials are only needed if running ingestion locally without Cowork MCP connections.

---

## Tech stack

- **Frontend** — React 18, Vite, Tailwind CSS
- **Backend** — Node.js, Express, TypeScript
- **LLM** — OpenAI GPT-4o
- **Embeddings** — OpenAI text-embedding-3-small
- **Knowledge base** — Supabase (PostgreSQL + pgvector)
- **Connectors** — Confluence, Jira, Slack, Google Drive
