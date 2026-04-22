import 'dotenv/config';
import { upsertDocument } from '../server/lib/embeddings.js';

const CHUNK_SIZE = 1500;
const OVERLAP = 225;

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

interface DocEntry {
  source_id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
}

const DOCS: DocEntry[] = [
  {
    source_id: 'drive:sms-compliance-training:1Cfat_WW9',
    title: 'Training Module: SMS, MMS, RCS Compliance',
    url: 'https://docs.google.com/document/d/1Cfat_WW9iGGv0yxJmiu3QnfElwTyH30DX-uNRSMzjNI/edit',
    author: 'capacity-internal',
    content: `Training Module: SMS, MMS, RCS Compliance

## 1. Understanding Opt-In and Opt-Out Messages

### Opt-In Text Messages
- An opt-in SMS is a text message where a customer gives explicit consent to receive marketing messages from a business.
- In many countries, including the U.S., obtaining written consent is a legal requirement before sending promotional text messages.
- Best practice: implement a double opt-in method to confirm the recipient's consent (customer provides phone number, then confirms consent by replying with a specific keyword).

### Opt-Out Text Messages
- An opt-out SMS is a message a customer sends to inform a business that they no longer wish to receive promotional messages.
- Businesses have a legal obligation to provide clear instructions on how customers can opt out. This includes including the opt-out keyword in welcome messages and providing clear unsubscribe instructions.

## 2. SMS Regulations and Compliance

### Transactional vs. Promotional Messages
- Transactional messages: contain information the customer needs (order confirmations, password resets). Typically do not require explicit consent.
- Promotional messages: require express written consent from the recipient before they can be sent.

### Key U.S. Regulations
- Consent Collection: Businesses must obtain express consent before sending SMS messages. Written consent required for promotional messages.
- Opt-Out Mechanism: Recipients must be given clear instructions on how to opt out, and their requests must be honored promptly.
- TCPA Compliance (Telephone Consumer Protection Act): Required disclosure of messaging purpose, frequency, data rates, and instructions for help.
- A2P 10DLC, TFN, SC Registration: Senders using 10-digit local phone numbers must register under A2P (Application-to-Person).

### Country-Specific Requirements
- Businesses must comply with country-specific regulations when messaging customers in different countries.
- France and India have restrictions on the timing of promotional messages.

## 3. How Textel Helps with SMS Compliance

Textel (Capacity's SMS platform) features:
- Automated Opt-In and Opt-Out Management: Automated tools for managing opt-in and opt-out requests, ensuring compliance with regulatory requirements.
- Keyword-Based Opt-In: Businesses can set up keyword-based opt-in campaigns, allowing customers to join SMS lists by texting a specific keyword to a designated number.
- Opt-Out Keyword Recognition: Textel's platform automatically recognizes opt-out keywords ("STOP", "UNSUBSCRIBE"), allowing customers to easily opt out. Automated responses confirm opt-out requests and provide instructions for re-subscribing.
- Compliance Reporting: Comprehensive reporting to track opt-in and opt-out activities, monitor compliance metrics, and maintain detailed records for auditing.
- Integration with Compliance Best Practices: Aligns with TCPA compliance and A2P 10DLC registration.

## 4. Short Code Porting to Textel/Capacity

Q: Can a client port over their short code SMS to Capacity/Textel to bot-enable it?

A: Yes, we can migrate a short code from one vendor to another. The process is different from the usual 10DLC/TFN porting. It needs to go through the compliance process again, so the same timeline as a new short code: 8 to 12 weeks depending on how fast customers can implement required changes.

## Key SMS Number Types
- 10DLC (10-Digit Long Code): Local phone numbers registered for A2P messaging. Must register with carriers.
- TFN (Toll-Free Number): Toll-free numbers used for SMS campaigns.
- Short Code: 5-6 digit numbers for high-volume SMS. Shared or dedicated. Takes 8-12 weeks to register or port.`,
  },

  {
    source_id: 'drive:capvoice-retell-gap-analysis:1G7dBixZ4',
    title: 'CapVoice vs. Retell – Gap Analysis, Weekly Updates & Active Client Projects',
    url: 'https://docs.google.com/document/d/1G7dBixZ4aJAJ7iJuPu5GSUj9mNec7oTxFKrOIs6BANE/edit',
    author: 'capacity-se',
    content: `CapVoice vs. Retell – Testing, Debugging & Gap Analysis
Prepared by: Brenna Gilbert | Last Updated: April 2026

## Project Goal
- Test and debug CapVoice relative to Retell's capabilities
- Identify gaps, critical issues, and roadmap items
- Create tickets for all discovered issues
- Determine which clients are impacted by missing features

## Bug & Issue Ticketing Rules
- Bug: Quality = Empty but post appears in agentic voice channel → create ticket
- Retell has / CapVoice does not → create PRP Ticket
- On roadmap but needed now → identify impacted clients, leave comment in ticket
- Prompt/Agent Template Library blocked or not implementable → comment on ticket

## Phase 1: Build on CapVoice (Culligan Example)
- Replicate Culligan use case on CapVoice
- Critical Issues: document and ticket all blockers
- API Connectivity: test and connect required APIs
- UX Comparison: CapVoice vs. Retell side-by-side notes
- Variable & Context Passing: Test passing variables from AI Agent Card to GC and back

## Phase 2: Gap Analysis – Retell vs. CapVoice
- Categorize gaps: Critical / Nice-to-Have / Roadmap

## Phase 3: Roadmap Review
- Review EPIC tickets at: https://roadmap.capacity.com/roadmap
- Cross-reference gap analysis with existing EPICs
- Prioritize roadmap items by client impact

---

## Quick-Glance: CapVoice vs. Retell Feature Comparison

| Capability | CapVoice | Retell | Gap? |
|---|---|---|---|
| Prompt compatibility | ✅ Supported | ✅ Supported | None |
| Model flexibility | ✅ GPT 4.1, 5.1, Cap AI (future) | ✅ Retell models | Minor – different ecosystems |
| Pronunciation control | ⚠️ Prompting only | ✅ Built-in dictionary | Yes – Retell advantage |
| Barge-in handling | ⚠️ May restart intro | ✅ Generally smoother | Yes – reliability gap |
| Currency / number reading | ⚠️ Known challenge | ✅ Via pronunciation | Yes – Retell advantage |
| Outbound call API | ❌ Not yet available | ✅ Available | Yes – critical gap |
| KB search latency | ⚠️ >2 sec typical | ✅ Sub-2 sec | Yes – performance gap |

---

## Gap Analysis by Category

### 2A. Performance & Latency
- PROJ-2797: Reduce KB Search Response Times Below 2 Seconds (🟡 Ready for Ticketing) — Benchmarked against Retell. Goal: <2s user-perceived latency for KB calls.
- PROJ-2454: Dev Platform Voice Latency Optimization (🟡 Ready for Ticketing) — Broader platform latency reduction.
- PROJ-2862: Post-Processing – Replace SLM (Project Alchemist) (🟡 Ready for Dev) — Target WER < 7%, beating Deepgram.
- PROJ-2872: ASR GPU-Enable Transcript Engines (Project Mercury) (🟡 Ready for Ticketing) — GPU-enabling Triton server for massive scalability improvements.

### 2B. Data Retrieval & Session Handling
- PRP-843 / HEX-224: Voice-Only Flow Fails to Retrieve Records; May Hallucinate (🔴 Scheduled) — Chat-first interaction works; pure voice does not reliably pull records. HIGH DEMO RISK.
  - Workaround: Use a Retell convo flow agent to pre-fetch via endpoints before transferring to main agent. OR use App Action card to pre-fetch via caller ID before AI Agent card activates, injecting result as a variable.
- PRP-847: Voice/Chat Returns Hallucinated Data Not Present in API Response (🔴 Scheduled) — Seen in multiple deployments including Alfa Policy.

### 2C. Input Capture (DTMF / Voice-to-Variable)
- PRP-846: Cannot Consistently Capture Policy Numbers via Voice (🔴 Scheduled) — Voice misinterprets policy numbers as phone numbers. DTMF (keypad) is the only reliable workaround. Retell handles via pronunciation section.
- PROJ-2516: GC Variable Assignment – Voice Transcript Extraction (🟡 Building Requirements) — No easy way to extract multiple variables from a transcript.
- PRP-732: Dialpad Stops Working After Call is Routed to Another GC (🟢 Completed)
- PRP-673: Cannot Store Attributes/Capture Variables via Voice vs. Chat (🟢 Completed)

### 2D. Call Transfer & Routing
- PRP-704: Transfer Card Not Working for Voice GCs (🟡 In Development) — No working example found of a transfer card in a voice GC. Note: Retell requires SIP INVITE (not SIP REFER) for transfers.
- PROJ-2191: GC: DTMF Barge-ins (🟢 Closed) — Resolved.

### 2E. Pronunciation & Voice Quality
- No Built-In Pronunciation Dictionary (🔴 Not Prioritized) — Retell has built-in pronunciation section; CapVoice uses prompting only. Currency reading and brand names are known challenges.
- Barge-In Handling – Agent May Restart Introduction (🔴 Open) — Observed during Altitude Trampoline Parks demo 2026-03-10.
- Introduction Inconsistency (~50% Failure Rate) (🔴 Open) — Approximately 1 in 2 calls failed to complete intro for Embrace Home Loans deployment. Team fell back to Retell for the demo.

### 2F. Outbound Calling
CapVoice has NO client-facing API to trigger outbound calls — a meaningful gap vs. Retell.
- PRP-756 / CORE-3088: Single Outbound Call Trigger API (🔴 Scheduled) — No API to programmatically trigger a single outbound call (equivalent to SMS StartBotFlow). Design completed; endpoint not yet built.
- PRP-757 / CORE-3088: Batch/Campaign Outbound Call Trigger API (🔴 Scheduled) — No API for outbound batch dialing campaigns.

### 2G. Telephony & Infrastructure
- PRP-609: Cannot Specify Twilio Termination URIs per Customer (🔴 Scheduled) — Only Bandwidth supported for compliance-sensitive clients. Twilio needed for high-volume outbound.
- PROJ-2714: Update Telephony Config for Mass Org Roll Out (🟡 In Development) — Asterisk dynamic Twilio sub-account support.
- ASR Outage Causes Dead Air + Missing Call Logs (🔴 Open) — When Verbio (Speech Center) goes down, voice-proxy crashes with dead air.
- LLM Provider Outage (GPT 5.1) – No Fallback (🔴 Open) — GPT 5.1 outage on 2026-03-19 caused dead air 10:30–12:00 CT. No automatic fallback to GPT 4.

### 2H. Timeout Handling During API Waits
- System Timeout Fires While Agent Awaits API Response (🔴 Open) — System-level voice timeout treats an active API wait as silence and terminates the call. Workaround: set timeout high for affected deployments. Retell does not have this issue.

### 2I. Analytics & Compliance
- PROJ-2177: PCI Compliance Redaction for Voice (🟡 In Development) — Automatic sensitive data redaction for PCI certification. Voice-specific scope for 2026 certification.
- PROJ-2342: Add Call Logs to Omnichannel Elastic Search (🟡 In Development) — Voice call history not yet globally searchable.
- PROJ-2734: Lang.ai Data Access for Analytics (🟡 In Development) — Topic analysis, performance analytics across voice transcripts.

### 2J. Developer & Builder Experience
- PROJ-2382: AI Agent Debugger (🟡 In Development) — Currently impossible to debug AI Agent behavior in GCs. Will add debug mode showing tool requests/responses.
- PROJ-2782: Test GCs Inline from Editor (🟡 Product Planning) — No ability to test GCs from the builder. Needed for faster voice agent iteration.
- PRP-820: GCs JSON Import/Export (🔴 Scheduled) — Need to build agents via JSON. Would accelerate CapVoice deployments on shortened timelines.
- Cap Voice Agent Title Character Limit Error (🔴 Open / Workaround Exists) — Save fails when agent title is too long. Workaround: shorten title temporarily.

---

## Hard Limitations (Already Confirmed)
- Capacity AI + AI Agent Card Incompatibility: Cannot be combined in the same build.
- PCI Compliance: Not yet certified — bridge letter available. Not blocking for Culligan scope (no raw payment data captured), but monitor if billing flows expand.

---

## Current Workarounds & Best Practices

### Record Retrieval in Voice-Only Flows
Use a Retell convo flow agent that always hits required endpoints (auth token fetch, record lookup) before transferring to the main agent. Alternatively, use the App Action card to pre-fetch via caller ID before the AI Agent card activates, injecting the result as a variable.

### Post-Call Data Updates
Trigger a webhook after the agent concludes; use Capacity Workflows + CapDB to handle system-of-record updates. Reduces agent complexity and latency.

### Policy Number / Numeric Capture
Use DTMF (keypad) input as the primary capture method for policy numbers, zip codes, and other numeric strings. Prompt engineering alone is unreliable.

### Pronunciation Issues
Pre-test number and brand name pronunciation before demos. Use phonetic spelling in prompts as a partial workaround. No built-in dictionary.

### API Wait Timeouts
Set voice timeout to a high value for deployments with long API response windows.

### LLM Model Selection
- GPT 4 outperforms GPT 5.1 on some deployments (e.g., Choice Hotels) for hallucination reduction.
- Use GPT 5.1 with fillers=off + Azure voice for best quality when 5.1 is stable.
- Best settings: Speechcenter V1 (Deepgram) + any 11 Labs voice. All other voice settings have no effect.
- Critical: AI Agent cards do NOT hang up on callers — every flow must end with a terminal node (hangup or transfer card).

### CapVoice Agent Configuration
Use fillers=off and Azure voice with GPT 5.1 for performance comparable to Retell.

### Retell SIP Transfers
Retell call transfers must use SIP INVITE (not SIP REFER). Confirm per-deployment.

### CapVoice Knowledge Tool Variable Names
- vector_search = KB & Sites
- answer_engine_search = Answer Engine
- tavily_web_search = Website Search

---

## Active Client Migrations: Retell → CapVoice

| Client | Jira | Status | Notes |
|---|---|---|---|
| AdvantageReserve (NOVA→Retell→CapVoice) | CSE-3241 | 🟡 UAT | Multi-hotel; transfer issues in UAT |
| Purity – Agentic Voice | CSE-3296 | 🟡 In Progress | Agentic migration underway; Spanish language continuity fix in QA |
| Culligan – RCS Branding Update | CSE-3788 | 🟢 Deployed | Complete |
| Advanced Wound Therapy (AWT) – Inbound + Outbound | CSE-3463/3464 | 🔴 Backlog | Prod Retell builds in backlog |
| 83bar – Outbound Voice Agent | CSE-3435 | 🔴 To Do | Outbound voice on Retell; target April 2026 |

---

## Voice Solutions Infrastructure Roadmap

| Epic | Jira | Status |
|---|---|---|
| Post-Processing – Replace SLM (Project Alchemist) – WER <7% | PROJ-2862 | 🟡 Ready for Dev |
| ASR GPU-Enable Transcript Engines (Project Mercury) | PROJ-2872 | 🟡 Ready for Ticketing |
| LumenVox/Verbio On-Premise Merger Q2 2026 | PROJ-2919 | 🟡 Building Requirements |
| Improve / Optimize Diarization | PROJ-2920 | 🟡 In Development |
| Audio Normalization | PROJ-2916 | 🟡 In Development |
| Music on Hold | PROJ-2917 | 🟡 Ready for Dev |

---

## Weekly Updates

### April 1, 2026 Highlights
- Best Cap Voice settings confirmed: Speechcenter V1 (Deepgram) + any 11 Labs voice.
- Critical: AI Agent cards do NOT hang up on callers — every flow must end with a terminal node.
- SIP SKU ($5k) remains in Cap Voice pricing; Awaken integration will not be charged separately.
- Jira: PRP-908 (knowledge tools as variables), PRP-909 (AE irrelevant content resolved), PRP-910 (Voice Logs "just now" bug), PRP-911 (hide helpdesk icon feature flag)
- Active voice projects: CSE-3498 Eustis Mortgage (Design), CSE-3435 83Bar Outbound (To Do)

### April 6, 2026 Highlights
- Zannie confirmed CapVoice vs. Retell comparison doc is maintained and updated automatically on Tuesdays via Claude.
- PSTN transfer dead air (~15 sec) still unresolved (no ticket filed).
- RingCX transfer failure — CapVoice hanging up instead of transferring on 2 of 4 demo lines (no ticket filed).
- PRP-876 confirmed for 83bar S3 call recording push/pull API.

### April 10, 2026 Highlights
- New "Cap Voice vs. Retell" live resource added to the Cap Voice GTM Brief.
- Unresolved PRP-candidates flagged: (1) Knowledge tool naming inconsistency (SEs hardcoding tool names that may change), (2) Voice agent Gold Standard template (best ASR/TTS/LLM/prompt structure), (3) LLM/model selection documentation.
- PRP-911, CTX-447 completed (hide helpdesk icon in left rail).

### April 16, 2026 Highlights
- Choice Hotels: May start date confirmed for Cap Voice migration (1,000+ calls per LOB); CSATai of significant interest. Franchisee Care: Cap Voice migration not yet presented; Spanish + other languages next step.
- Eustis Mortgage Voice Agent (CSE-3498) in Design phase.
- 83Bar Outbound Voice Agent (CSE-3435) still in To Do.

### April 20, 2026 Highlights
- SEs struggling to build Cap Voice agents; Capacity noted as "more difficult but doable" vs. Retell. JSON export for functions still on roadmap.
- GPT 5.1 returning HTTP 503 stream errors causing dead air mid-demo; temp fix via model swap (PRP-864 completed).
- Voice Analytics feature broken (Sammie Stephens, Apr 15) — being replaced by Post Interaction Intents & Outcomes epic; not ready yet (PROJ-2679).
- RingCX Transfer Failure resolved: root cause was JSON.stringify(sessionData) line commented out, breaking intent passing.
- PRP-994: Outbound voice campaigns routing through Welcome Message GC instead of campaign-mapped GC.

---

## Recommended Next Steps

Immediate (This Sprint):
- File or escalate PRP-843 (voice-only record retrieval) — most common demo-blocker.
- Confirm engineering timeline for PROJ-2797 (KB latency) — close the 2-second gap vs. Retell.
- Prioritize pronunciation roadmap item for line settings page.
- Document the App Action pre-fetch pattern as a formal CapVoice deployment standard.

Near-Term (Next 2 Sprints):
- Drive PRP-704 (transfer card) to resolution — blocking multiple client flows.
- Get PRP-756 + PRP-757 (outbound call APIs) into active development.
- Create CapVoice equivalent of the Retell best practices doc (CSE-3517 analog).

Strategic:
- Evaluate building a native pronunciation dictionary for CapVoice (parity with Retell).
- Design LLM fallback (GPT 5.1 → GPT 4) for outage resilience.
- Plan Verbio/ASR outage handling so dead air calls are always logged.`,
  },
];

async function main() {
  let total = 0;
  for (const doc of DOCS) {
    const chunks = chunkText(doc.content);
    console.log(`\nIndexing "${doc.title}": ${chunks.length} chunks`);
    for (let i = 0; i < chunks.length; i++) {
      await upsertDocument({
        source: 'drive',
        source_id: `${doc.source_id}:${i}`,
        title: doc.title,
        content: chunks[i],
        url: doc.url,
        author: doc.author,
      });
      process.stdout.write('.');
    }
    total += chunks.length;
  }
  console.log(`\n\nDone! Indexed ${DOCS.length} docs, ${total} total chunks.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
