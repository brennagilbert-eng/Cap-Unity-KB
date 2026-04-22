/**
 * One-time script to index selected Google Drive documents into Supabase.
 * Run with: npx tsx scripts/index-drive-docs.ts
 */
import 'dotenv/config';
import fs from 'node:fs';
import { upsertDocument } from '../server/lib/embeddings.js';

const CHUNK_SIZE = 1500;
const OVERLAP = 225; // ~15%

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += CHUNK_SIZE - OVERLAP;
  }
  return chunks.filter((c) => c.length > 50);
}

async function indexDoc(doc: {
  title: string;
  source: string;
  url: string;
  author?: string;
  content: string;
}) {
  const chunks = chunkText(doc.content);
  console.log(`\n📄 "${doc.title}" → ${chunks.length} chunks`);
  for (let i = 0; i < chunks.length; i++) {
    const source_id = `drive:${doc.title.toLowerCase().replace(/\s+/g, '-')}:${i}`;
    await upsertDocument({
      source: doc.source,
      source_id,
      title: doc.title,
      content: chunks[i],
      url: doc.url,
      author: doc.author,
    });
    if ((i + 1) % 10 === 0) console.log(`  ✓ ${i + 1}/${chunks.length}`);
  }
  console.log(`  ✅ Done (${chunks.length} chunks)`);
}

// ─── Document content ───────────────────────────────────────────────────────

const CONVERSATION_DESIGN_PLAYBOOK = `# Conversational Design Playbook
Transitioning from Traditional Call Flow Design to Modern Conversational AI

## Introduction
This guide documents our methodology for designing LLM-based conversational agents across voice and digital channels. It replaces the traditional prescriptive call flow approach (Visio-style branching diagrams) with a leaner, intent-driven design process that accounts for the flexibility and nuance of large language model behavior.

This guide is intended for Conversational Designers, Solution Architects, and Implementation Engineers.

Core Principle: We are no longer designing every utterance and branch. We are designing inputs, outputs, guardrails, and outcomes — and trusting the LLM to handle the conversation within those boundaries.

## Part 1: Pre-Design Requirements
Before any design session begins, the following must be collected or confirmed. Incomplete pre-design inputs are the leading cause of rework.

### 1.1 Existing Assets
- Previous call flows and/or agent scripts — even outdated ones reveal business logic and edge cases
- Conversation examples — recordings and/or transcripts (minimum 20-30 representative samples recommended)
- Integration documentation — API specs, authentication methods, request/response schemas, SLAs, and known failure modes, websites

### 1.2 Project Scoping
- Persona selection — name, personality traits, tone, and brand voice guidelines
- Deployment channel(s) — voice (telephony/SIP), API/messaging, web chat, SMS, etc.
- Identification of the build environment — which platform, tenant, and region
- Phasing agreement — what is in scope for Phase 1, and what is explicitly deferred
- Knowledge transfer from Sales: Review the SOW carefully, watch demo recordings, review any demo agents built during the sales cycle

### 1.3 Compliance & Constraints
- Regulatory requirements — identify PCI, HIPAA, TCPA, or other compliance flags early
- Authentication and verification requirements — ANI/DNIS matching, knowledge-based authentication (KBA), one-time passcodes, biometrics
- Fallback and error handling philosophy — align on whether the agent should retry aggressively, degrade gracefully, or transfer immediately upon API failure
- Business Rules & Logic

### 1.4 Escalation & Containment
- Target containment rate — directly influences how conservatively or aggressively the agent is designed to self-serve
- Escalation triggers — what always results in a human transfer (e.g., high-emotion signals, explicit request, specific intents, repeated failure)

## Part 2: Architecture Selection

### 2.1 Fully Agentic
The LLM drives the entire conversation with minimal hard-coded pathing.
Best for: FAQ and knowledge base lookups, intent routing / triage, open-ended discovery conversations, use cases where no two conversations need to follow the same path.
Strengths: Most natural conversational experience, handles unexpected user inputs gracefully, minimal maintenance as intents evolve.
Limitations: Not well-suited for complex or rigid business logic, smaller effective context window, harder to guarantee a specific sequence of events.

### 2.2 Hybrid
A combination of LLM-driven conversation with defined structural guardrails or sequenced logic blocks.
Best for: Multi-step transactional flows (payments, scheduling, account changes), most enterprise deployments.
Strengths: Follows complex logic while remaining conversational, unique conversations within guided paths, balances control and flexibility.
Limitations: Context switching between intents requires careful disambiguation design, requires more thoughtful prompt architecture.

### 2.3 Prescriptive Flow
Traditional branching logic with LLM used selectively (e.g., for NLU/intent classification only).
Best for: Highly regulated or compliance-sensitive flows, clients who require full auditability of conversation paths.
Strengths: Highly controllable — minimal variance between conversations, well-defined intent paths.
Limitations: Less conversational, typically results in longer average handle time, requires full call flow documentation.

## Part 3: Design Session Framework

### 3.1 Intent Design Fields
For each intent: Intent Name, Trigger Phrases/Conditions, Data to Capture, Validation APIs, Data Received from API, Data Sent to API, Business Rules, Desired Outcomes, Metadata Labels, Disambiguation Strategy.

### 3.2 Guardrails & Conversation Health
- Max turn limits — how many times can the agent retry a clarification before escalating
- Infinite loop guards — especially for Hybrid flows with conditional branching
- Barge-in and interruption handling — voice-specific
- Profanity / sensitive topic handling — escalate, deflect, or log
- Low-confidence intent fallback — what happens when the agent cannot determine intent after N attempts

## Part 4: Multi-Channel Considerations
Voice: Speech / DTMF input, no rich media, call duration session, ANI / KBA authentication, barge-in supported.
Chat/Messaging: Text input, cards/buttons possible, variable session persistence, token / login authentication.
SMS: Text input, no rich media, thread-based session, phone verification, 160 chars/segment limit.

## Part 5: Governance & Handoff
- Prompt versioning & change management — establish who owns prompt changes post-launch
- Testing & evaluation criteria — define pass/fail conditions per intent during design, not after build
- Knowledge transfer to build team — required design walkthrough session before development begins

## Part 6: Evaluation (Conversational UX Audit)
Evaluation occurs during QA and UAT after the agent has been built.

### 6.1 Voice & Tone Quality
Evaluate: Cadence, Speed, Volume, Emphasis, Tone, Interruptability.

### 6.2 Persona Consistency
Audit for: Greeting through closing consistency, edge cases and errors maintaining persona, prohibited language violations, consistency across multiple sessions.

### 6.3 Hallucination Testing
Test for: Factual accuracy (no invented policies/numbers), out-of-scope responses, API data fidelity, repeated testing variance, edge case prompting.
All Critical and High hallucination findings must be resolved before UAT sign-off.`;

const IRALOGIX_CASE_STUDY = `# Capacity Solution Summary: IRALOGIX Phase 1

## Business Context
IRALOGIX manages auto-rollover IRA accounts. A significant volume of inbound contacts stems from account holders who have questions about their account, want to activate their IRA, or need to request a liquidation — interactions that currently require live agent involvement even for routine inquiries.

Challenges:
- Account holders receiving auto-rollover IRA welcome letters have no self-service channel to verify account status, check balance, or understand options
- Activation and liquidation requests require live agent involvement for tasks that could be partially or fully automated
- Inbound volume spans Voice, Chat, Email, and SMS — without a unified virtual agent layer, each channel requires separate staffing
- FAQ inquiries consume agent capacity that could be deflected through AI-powered knowledge

Phase 1 Outcome: IRALOGIX account holders will be able to authenticate, access account information, receive activation or liquidation guidance, and get answers to FAQ inquiries via Voice, Chat, SMS, and Email — with seamless escalation to live agents.

## Products in Scope
Core Platform: Knowledgebase (AI agent FAQ deflection across all channels), Helpdesk, Automations, Conversation Builder (Guided Conversation engine), Analytics, Cloud Drive.
Platform Add-Ons: Developer Platform / Capacity DB (for IRALOGIX API integration and Salesforce Contact & Case creation), Live Chat.

## Channels
- Voice – Inbound → escalation to AWS Connect Live Agent CCP
- Chat / Web → escalation to Salesforce Live Agent Queue
- SMS → escalation to Salesforce Live Agent Queue
- Email → escalation to Salesforce Live Agent Queue

## Voice Agent Details
Use Cases: Account status inquiries, enrollment status, balance lookup, activation guidance (outbound SMS with secure portal link), liquidation inquiries, FAQ deflection.
Authentication: DOB + Last 4 SSN collected conversationally (IRALOGIX API does not support lookup by phone number or email).
Phase 1 Voice Note: Multi-step activation is not completed over voice in Phase 1. Voice agent sends outbound SMS with secure activation link. Full in-call activation is a Phase 2 candidate.

## Integrations
1. IRALOGIX API (partner.iralogix.com): Account holder identity verification, account data lookup. Key endpoints: GET /accounts (lookup by DOB + last 4 SSN), GET /accountholder/{id}, GET /account/{id}. Technical note: 3-call chained lookup sequence required.
2. Salesforce: Contact deduplication, Contact creation, Case creation on escalation. OAuth 2.0. On escalation: check for existing Contact → create if needed → POST Case with transcript → route to Live Agent Queue.
3. AWS Connect: Live agent escalation for voice. SIP transfer + AWS Lambda API call. Context (name, accountId, balance, enrollmentStatus, escalation reason) pushed via Lambda + UpdateContact API.

## Architecture Options (Voice)
Option A: Retain numbers on AWS Connect; SIP transfer to Capacity DID. Both AWS and Capacity bill on every inbound call.
Option B: Port numbers to Capacity; AWS enters only on escalation. AWS billing tied to escalation volume only.

## Future Phases
Phase 2: Full in-call IRA activation over voice.
Phase 3: Proactive outbound SMS/voice campaigns targeting non-activated account holders.
Phase 4: Real-Time Agent Assist for live agents during escalated calls.
Phase 5: Automated QA scoring of 100% of interactions, trend analysis, sentiment tracking, CSAT measurement.

## Key Assumptions
- IRALOGIX API sandbox credentials required before integration build
- Salesforce Connected App (client_id + client_secret) required before Salesforce config
- Voice architecture decision (Option A vs Option B) must be finalized before voice implementation
- High-balance threshold for automatic escalation to be defined during discovery
- All messaging compliance (SMS opt-in/opt-out, TCPA) is IRALOGIX's responsibility`;

const AI_AGENT_PROMPT_MARKETING = `# Jane — Capacity Website AI Agent Prompt (CAP MARKETING)

## Identity
You are Jane, Capacity's virtual assistant. You are a friendly, knowledgeable support assistant for Capacity. You help prospective and current customers understand our products, pricing, features, and services.

## Knowledge Sources
Use: https://capacity.com/ and the documentation in the Knowledge Base (Capacity Messaging Alignment Document - Contact Center).

## Intent Classification
Classify each customer message into one of:
- GENERAL — specific factual question about Capacity (pricing, integrations, features, support)
- PRICING — asking about cost, pricing, price per license, what a plan includes
- PRODUCT DISCOVERY — vague about needs, asking what Capacity does, expressing a pain point without naming a specific product
- DEMO / SALES — asking to speak to someone, buy, or see a demo (warm or neutral tone)
- URGENT ESCALATION — frustrated, angry, or urgently requesting a human; repeated demands, all-caps, hostility
- SMS EXPERIENCE — wants to try the SMS virtual agent or see another channel
- PRIVACY REQUEST — asking to delete, clear, or remove conversation or data

## Intent Priority (higher overrides lower)
1. URGENT ESCALATION — overrides all others
2. PRIVACY REQUEST
3. SMS EXPERIENCE
4. DEMO / SALES
5. PRICING
6. PRODUCT DISCOVERY
7. GENERAL

## Response Rules
PRICING: Custom quote only — direct to capacity@capacity-website.com. Never give specific prices.
GENERAL: Search knowledge source first. Keep under 100 words. Always end with at least one verified source link in HTML format.
PRODUCT DISCOVERY: Trigger Product Recommendation Engine.
DEMO / SALES: Warm response + Book Meeting Flow (collect full name, company, phone number one at a time; create ticket).
URGENT ESCALATION: No enthusiastic language, no demo flow. Direct to email and contact page only.
PRIVACY REQUEST: Direct to contact page; cannot delete conversation history from interface.

## Book Meeting Flow
Collect sequentially: full name → company → phone number.
Use "Create Ticket (Chat)" tool once with title "New Prospect Engagement" and conversation summary.
After submitting, offer SMS virtual agent experience.

## General Rules
- Never answer questions outside scope of Capacity's products, services, or support topics
- Never fabricate product names, features, or URLs
- Warm, professional, concise tone
- Match tone to user's emotional state — no celebratory language with frustrated users
- Every GENERAL response must end with at least one verified HTML source link`;

// ─── Load large docs from persisted files ───────────────────────────────────

function loadFileContent(filePath: string): string {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.fileContent ?? parsed.content ?? raw;
  } catch {
    return fs.readFileSync(filePath, 'utf8');
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting Drive docs indexing...\n');

  const GTM_BRIEF_FILE =
    '/Users/brennagilbert/.claude/projects/-Users-brennagilbert-Purchasing-Power-DB/4c90174d-7f5e-4fbe-9356-e26c1313a92c/tool-results/mcp-e31bf396-a615-46da-a3ec-978f336aaec7-read_file_content-1776875407705.txt';

  const CAPVOICE_FILE =
    '/Users/brennagilbert/.claude/projects/-Users-brennagilbert-Purchasing-Power-DB/4c90174d-7f5e-4fbe-9356-e26c1313a92c/tool-results/toolu_01DYtG3a3ham4CcF82PKMzoB.txt';

  const docs = [
    {
      title: 'Conversation Design Playbook',
      source: 'drive',
      url: 'https://docs.google.com/document/d/1jeMqhpUkuqs-9OjWnyEEny6qAsmzNisqjvQk2erLrAI/edit',
      author: 'yoni.oettinger@capacity.com',
      content: CONVERSATION_DESIGN_PLAYBOOK,
    },
    {
      title: 'IRALOGIX Solution Summary – Phase 1',
      source: 'drive',
      url: 'https://drive.google.com/file/d/12-V1xbSn64OgUAEvSptf6FqLuDw8DeNf/view',
      author: 'tristyn.olmo@capacity.com',
      content: IRALOGIX_CASE_STUDY,
    },
    {
      title: 'AI Agent Prompt – CAP MARKETING (Jane)',
      source: 'drive',
      url: 'https://docs.google.com/document/d/1qoDP0GARCLnr-0He5XGaWlXhN8PUPutmZD9CKMUfKmY/edit',
      author: 'brenna.gilbert@capacity.com',
      content: AI_AGENT_PROMPT_MARKETING,
    },
    {
      title: 'CapVoice – Testing, Gap Analysis & Weekly Updates',
      source: 'drive',
      url: 'https://docs.google.com/document/d/1G7dBixZ4aJAJ7iJuPu5GSUj9mNec7oTxFKrOIs6BANE/edit',
      author: 'brenna.gilbert@capacity.com',
      content: loadFileContent(CAPVOICE_FILE),
    },
    {
      title: 'Master GTM Brief',
      source: 'drive',
      url: 'https://docs.google.com/document/d/1dAV1o9IoUWaAnfD7bEENlU8pJ71eOWVubDfldJ9pGnI/edit',
      author: 'zannie.calkin@capacity.com',
      content: loadFileContent(GTM_BRIEF_FILE),
    },
  ];

  for (const doc of docs) {
    await indexDoc(doc);
  }

  console.log('\n🎉 All Drive docs indexed successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
