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

const PS_PLAYBOOK = `Capacity Professional Services – PS Implementation Playbook
Internal playbook for every member of the PS Team. Defines core responsibilities for the PS Implementation Team across the project lifecycle.

## Phase 1: Project Kickoff
Trigger: Sales completion. Yoni informs PS Team in #ps-leadership of new project. Resources assigned within 2 business days.

Assignments:
- PM resource assignment: Tonya Birch
- SC/CSE resource assignment: Dan Dyer
- TAM assigned at QA phase: Yoni Oettinger
- Platform assignment: Yoni Oettinger
- Account Management assignment: Dana Ivancic

PM Kickoff Activities (within 5 business days of sales notification):
1. Internal Kickoff Meeting (30 min): Review SO/Solutions Summary, understand dev expectations. Attendees: PS resources, Sales Rep, SE, Platform Team lead if needed.
2. Client Kickoff Call (60 min): Introduce implementation team, confirm project goals, establish communication cadence. Include client stakeholders.
3. Launch New Client Workflow: Visit https://aisoftware.portal.capacity.com/ and ask the bot 'Onboard a professional services client'. Creates: PM ticket for org setup, IT tickets for analytics and LastPass, populates Epic shell. Additional steps: Epic Creation Process, SMS Development Epic Process, create Google Drive folder in PS Team Client Documentation Folder.
4. Set Up Client Slack Channel: Create #client-name, invite Solution Consultant, Yoni, Dana, Account Manager, Sales Engineer, AE. Request Solution Summary and SOW from AE in the channel.
NOTE: When creating new Capacity orgs, ensure ML Docs (doc mining feature) is set to OFF by default.

## Phase 2: Requirements Gathering and Validation

### Solution Architecture Decision Framework
Before scoping an epic, SC determines technical approach.

Voice Agent Decisions:
- Type of Agent: Single Prompt, Multi-Prompt, or Conversational (SC decides, informed by SE)
- Channel: Voice, SMS, Chat, etc. (per SO from Sales)
- Platform: Retell, Capacity, NOVA, Linc, Creovai, Lumenvox/Verbio (SC decides with Yoni)
- Platform selection factors: Security/compliance, functional readiness, contractual obligations.

Agent Type Selection Criteria:
- Single Prompt: Low complexity, 0-1 integrations
- Multi-Prompt: Medium complexity, 2-3 integrations, some channel shifting
- Conversational: High complexity, 4+ integrations, complex channel shifting

Chat Bot Decision Framework: FAQ-only, Guided Conversation, or Hybrid architecture; handoff model (no handoff, live agent, scheduled callback); channel (web widget, SMS, Teams, Slack).

SMS Decision Framework: Transactional, Conversational, or Campaign. Trigger types: Inbound, API-triggered, Workflow-triggered (/startbotflow /send or other).

Workflow Decision Framework: Simple (linear), Branching, or Multi-system complexity. Trigger types: Scheduled, Event-driven, Manual.

Integration Decision Framework: Real-time API, Batch sync, or Webhook pattern. Authentication: API Key, OAuth, SAML. Data Direction: Read-only, Write, Bidirectional.

### Discovery Meetings (Week 1-3)
- Conversational Design Presentation (Week 2, 60 min): Present user journeys, persona, dialogue flows for client alignment.
- Technical Requirements Session (Week 2, 90 min per integration): Document send/receive data elements, format, API endpoints, sandbox credentials, dispositions.
- Internal Technical Review/Whiteboard (Week 3, 60-90 min): SC presents architecture to Engineering Manager, QA rep. Validate scalability and risks.
- Telephony Requirements (Week 3, 30-60 min): PM defines voice/SMS telephony needs with client. Provision numbers via CS Portal bot ("I need a number").
- Contingency (Week 4, 60 min): Follow-up on integration, technical, or design items.

For outbound voice/dialer clients: reference Outbound Voice Dialing Best Practices guide (equity.atlassian.net/wiki/spaces/CSE/pages/3145596933).

### Epic Development (Week 1-3)
- Define business problems and outcomes.
- Document technical considerations.
- Create DoR/DoD checklists.
- Break down user stories with acceptance criteria. Include discovery/spike tickets for unknowns, testing/validation stories, deployment/training stories.
- Collaborate with team on story point estimation.
- Sequence stories for optimal sprint flow.
- Document all credentials/test accounts/logins.

Epic Development Deliverables:
- Complete epic with full user story breakdown (SC + POD)
- Story point estimates for all implementation work (SC + CSE Team)
- Sprint sequence recommendation (SC + POD Lead)
- Deliverables agreed upon with client (PM + SC)
- API spec defined, whitelisting complete (SC)
- MVP scope agreed before change requests accepted (PM)

## Phase 3: Development
Client sign-off on design and APIs required before development begins.

Sprint Ready Validation (Week 3-4):
- SC validates Definition of Ready: All technical unknowns resolved, client access and credentials available, acceptance criteria complete, dependencies ready.
- Each ticket must have a due date.

Voice Pre-UAT/Go-Live Notes: Review transfers (numbers set properly), review phone config (inbound/outbound), create new application version, configure Post-Call Analysis.

## Phase 4: QA and UAT Testing

### Internal QA Testing
QA Handoff Meeting (1 hour, scheduled 1 week before build completion): PM hosts. Provides testing team overview of application design, platform, functionality, peculiarities, and testing instructions.
Required attendees: PM (host), Builder, Conversational Designer (UX validation), TAM (reporting needs), QA Team.

JAM Session (1 hour, after dev complete): Collaborative testing by internal resources unfamiliar with the application.
Required attendees: PM (host), TAM. Optional: QA member, any available internal resource.
PM requests test accounts from client before session. PM creates internal testing sheet. PM creates defect tickets from QA findings.

Testing Responsibilities:
- QA Resource: Make test calls, report missing functionality and incorrect intent handling as Jira defects, verify portal/dashboard population.
- Conversational Designer: Make test calls with different caller personas, recommend changes to speed/tone/persona/responsiveness.

### Defect Severity Levels
- P1 (Critical): Production down or unusable, no workaround → Same business day response
- P2 (High): Major feature broken, workaround exists → Next business day
- P3 (Medium): Minor feature issue, low user impact → Within current sprint
- P4 (Low): Cosmetic or enhancement → Backlog for future sprint

Defect Workflow: PM triages and sets severity. Scrum Master/POD Leader assigns to CSE builder. Builder fixes and moves to In Review. PM or QA validates and closes.

### UAT Testing
PM Pre-UAT Activities: Coordinate receipt of UAT endpoints, credentials, and environment setup. Set up/customize UAT Issue Tracker.

UAT Handoff Meeting (1 hour): PM schedules with client project team, testing resources, and stakeholders. Prepare presentation covering: call-in number, conversational design flow, testing best practices, known issues, portal navigation, feedback logging process.

### UAT Sign-Off Gate (Hard Gate Between Phase 4 and Phase 5)
Nothing in Phase 4.5 or Phase 5 begins until ALL of these are confirmed:
1. Client has provided written acknowledgement of testing approval.
2. Functionality requests for Hypercare are documented with expected resolution timelines.
3. All P1/P2 UAT defects are resolved.
4. Client has provided production test data, prod API endpoints, and prod credentials.
Escalation: If no sign-off response within 5 business days, PM escalates to Account Manager.

### Application Alerts/Monitoring
During UAT, TAM begins setting up alerts:
- Aigo/NOVA alerts: Utilize Splunk alerts, come through via email and to phone for support team.
- Retell alerts: Set up per application with naming convention "Application Name + Type of Alert". Notify via #voice-error-alert Slack channel.

## Phase 4.5: Post-UAT Documentation and Go-Live Prep
Only begins after UAT Sign-Off Gate is cleared.

Documentation Gate Checklist (required before Transition to Support meeting can be scheduled):
- Confluence page updated with all technical details (integrations, platform, APIs, contacts, Lucid Chart link)
- Client contact info and support protocols documented
- Lucid Chart / architecture diagram current
- Platform configuration notes on Global Confluence page
- Client training materials finalized
- LastPass credentials organized and documented

Go-Live Prep: PM creates Go-Live Prep ticket for CSE Team containing PROD transfer numbers, go-live date, PROD test data, PROD endpoints. CSE Team copies databases, GC flows, configures production environment, reviews transfers and phone config.

## Phase 5: Go-Live

Client Go/No-Go Meeting (1 hour):
Agenda:
1. Production Smoke Testing: end-to-end with production test data. Document production defects, prioritize go-live blockers vs hypercare items.
2. Schedule Go-Live date and time (consider peak business hours).
3. Discuss rollback plan: who to contact, how to minimize customer impact.

Transition to Support Meeting (1 hour):
Preferred Tue-Thurs after 2pm CST to accommodate offshore support team. Only schedule after Documentation Gate Checklist complete.
Attendees: PM, PS Support Team, TAM, CSE POD, Yoni.
Agenda: Application type (Voice/Chat/SMS), Lucid Chart overview, application overview and peculiarities, platform(s), hours of operation, error handling, API call details, client contact details and production support protocols.
Meeting is recorded. Recording, presentation, and notes go to: Client Documentation Folder, Capacity knowledge base, and client Confluence page.

Go-Live Day: CSE completes Go-Live checklist. PM sends Go-Live notification. Recipients: Capacity Billing, Yoni, Sammie Stephens, TAM, Marilyn Cassady, Dana Ivanic, Account Manager, Client PM, Client Chief Stakeholder.
PM sends CSAT Survey link to client PM and Chief Stakeholder.

## Phase 6: Hypercare
Led by TAM with PM as overseer. Focused on expedited remediation of production defects and tuning post go-live.

Duration:
- Enterprise: 60 business days
- Core/Pro: 45 business days

TAM Weekly Activities: Confirm recurring meeting, review Jira boards, provide updates on open items, collect additional info needed from client, review metrics/KPIs.

TAM Reporting: Provide clients access to Call Analytics Dashboard (va.capacity.com/admin). Pull detailed metrics: call volumes by hour/day/week, intents, KPI breakout, breadcrumbs.

### Scope Creep Handling
1. Educate client where request is out of scope.
2. Gather requirements for the request.
3. Notify Account Manager of scope change request.
4. Account Manager evaluates and consults with client on fee revisions and timing delays.
5. If approved, PM creates tickets for added functionality and revises timeline.

## Client Communication Templates

Delay Communication:
Subject: [Project Name] Timeline Update
Body: Hi [Client Contact], I wanted to provide an update on our timeline for [deliverable/milestone]. Due to [brief reason: dependency, technical complexity, resource constraint], we are adjusting the target date from [original date] to [new date]. [One sentence on what is being done to get back on track.] Please let me know if you have questions or would like to discuss.

Hypercare Exit Communication:
Subject: [Project Name] Hypercare Completion
Body: Hi [Client Contact], As of [date], we have completed the [duration] hypercare period for [project name]. [One sentence summary of key outcomes/metrics.] Going forward, please direct any support requests to the Capacity Support Team at [support contact info]. Your TAM [name] will continue to be available for strategic guidance. Thank you for a successful launch.

## Example Epics by Work Type
- Inbound Voice: Most common work type
- Outbound Voice: CSE-3435 (83Bar) — Dialer integration, campaign logic, compliance
- SMS: CSE-3429 (Mulholland) — Opt-in/out, message templates, API triggers
- Chat Bot: CSE-3428 (Bristol) — Web widget, guided conversations, handoff logic`;

const CI_AG_DOC = `Integrating Conversations Intelligence (CI) into Agent Guidance (AG) – Technical Integration Guide

This guide shows how to create the connection between Agent Guidance (Awaken) and Conversations Intelligence (Creovai/Tethr) to allow full utilization of Agent Assist.

## Step 1: Access Creovai Hub
- UK URL: https://creovaiaihubuk.tethr.com/
- US URL: https://creovaiaihubus.tethr.com/
Login to your account. User MUST have Super Admin permissions to perform the next steps.

## Step 2: Go to Super Admin Panel
From the first screen, click the down arrow next to your initials at the top right, then click Super admin.

## Step 3: Add New Allowed Origin
Scroll down to the "Other allowed origins" section. In the Add new allowed origin text box, type the Agent Guidance URL (e.g., https://copilot_trial_7_us_prod.awaken.io), then click the blue Add new allowed origin button.
IMPORTANT: Do NOT add a trailing slash "/" at the end of the URL — it will NOT work. Look at existing examples above the text box for reference.

## Step 4: Create API User

### Get to API Users Screen
Still within the Super Admin screen, on the left dark panel, scroll down to the Ingest category and click Api users.

### Create the API User
Click Add api user button.
Fill out the details:
- Username: Take the URL → remove https:// prefix and everything after .awaken.io → replace all underscores with hyphens.
  Example: https://copilot_trial_7_us_prod.awaken.io → copilot-trial-7-us-prod
- Tenant: Use the Agent Guidance System ID
- Description: Leave blank
Click Add to create the user.

### Remove Default User Roles
Click on the new username. Scroll to User roles section. Click X on all default roles to remove them one by one.

### Add Correct User Roles
Still under User roles, click Add and add the LiveCall and Processing roles to the user.

### Create Password
Scroll down to Passwords section. Click Add password.
- Note: Leave blank
- Time to expiration: 2 years
Click Add. You will be presented with the generated password.
CRITICAL: Keep this in a safe place — you CANNOT view it again. Immediately save to RDM with entry name "Conversations Intelligence".

## Step 5: Adding the User to Agent Guidance
Login to the Agent Guidance application. Ensure you have the System Manager license assigned to your user.
Navigate to System > Settings > Agent Assist.
Toggle on Conversation Intelligence Enabled.

Fill out the fields:
- Conversation Intelligence Endpoint:
  - If UK: creovaiaihubuk.audio.tethr.com
  - If US: creovaiaihubus.audio.tethr.com
- Conversation Intelligence Client ID: The API Username you just created
- Conversation Intelligence Client Secret: The API Password you just created

Scroll down and click Save.
Integration is now complete — Agent Guidance is now connected to Conversation Intelligence.`;

const DOCS = [
  {
    source_id: 'confluence:ps-implementation-playbook:3009806393',
    title: 'PS Implementation Playbook',
    content: PS_PLAYBOOK,
    url: 'https://equity.atlassian.net/wiki/spaces/CSE/pages/3009806393/PS+Implementation+Playbook',
  },
  {
    source_id: 'confluence:ci-ag-integration:2987786260',
    title: 'Integrating Conversations Intelligence (CI) into Agent Guidance (AG)',
    content: CI_AG_DOC,
    url: 'https://equity.atlassian.net/wiki/spaces/CSE/pages/2987786260/Integrating+Conversations+Intelligence+CI+into+Agent+Guidance+AG',
  },
];

async function main() {
  let total = 0;
  for (const doc of DOCS) {
    const chunks = chunkText(doc.content);
    console.log(`\nIndexing "${doc.title}": ${chunks.length} chunks`);
    for (let i = 0; i < chunks.length; i++) {
      await upsertDocument({
        source: 'confluence',
        source_id: `${doc.source_id}:${i}`,
        title: doc.title,
        content: chunks[i],
        url: doc.url,
        author: 'capacity-ps',
      });
      process.stdout.write('.');
    }
    total += chunks.length;
  }
  console.log(`\n\nDone! Indexed ${DOCS.length} docs, ${total} total chunks.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
