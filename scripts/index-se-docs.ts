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
}

const DOCS: DocEntry[] = [
  // ── SE PROCESS DOCUMENTS ──────────────────────────────────────────────────

  {
    source_id: 'drive:template-v2-solution-summary:1NmzRsQFS',
    title: 'Capacity Solution Summary Template V2',
    url: 'https://docs.google.com/document/d/1NmzRsQFS-P_oNFU_ZInoYcvMdXBkbEn6LSxGwej2orA/edit',
    content: `Capacity Solution Summary Template V2

This is the standard Capacity Solution Summary template used by Solution Engineers (SEs) and Sales Engineers for all customer engagements. Complete all sections before sending to PS/CS.

## 1. Overview

### Purpose of Document
This document defines the scope of work and technical design Capacity will undertake for this engagement. It represents our understanding of the customer's business challenges and the specific capabilities required to solve them.

Note on Scope: Should requirements evolve during the Post-Sales Discovery phase, Capacity reserves the right to provide an updated Professional Services estimate or Change Order to address additional complexity.

### Business Context & Current Challenges
Capture the customer's pain points in their own language. Aim for 2–4 specific, named pain points — not generic statements.

Phase 1 Outcome: By go-live, [audience] will be able to [complete requests / get answers / trigger automations] via [channels], with escalation to [destination / team / system], grounded in approved sources from [knowledge repositories].

## 2. Products in Scope

Core Platform components included in every package:
- Knowledgebase
- Helpdesk
- Automations
- Conversation Builder
- Analytics
- Cloud Drive

Platform Add-Ons (include only what is in the signed order):
- Live Chat
- Developer Platform / Capacity DB
- Inbox
- Articles
- Campaigns
- CRM
- Agent Voice & Screen Recording
- Click2Coach with QM (D5 Voice & Screen Recording, Evaluations, eLearning)
- Standard WFO Suite (D5 Recording, Click2Coach with QM, WFM)
- Advanced WFO Suite (D5 Recording, Click2Coach with QM, WFM, D5 Desktop Analytics, D5 Keyword/Phrase Spotting)

### Virtual Agent Channels & Escalation
- Voice – Inbound
- Voice – Outbound
- Chat / Web
- SMS
- Email

### Answer Engine
- Data Indexing – Existing sources
- Data Indexing – New sources

### Workflows
Only include workflows discussed and confirmed with the customer. Mark unconfirmed as "Pending Discovery."

### Conversation Intelligence (Creovai)
Integration Validation Required: Confirm source platform is supported before finalizing scope. Net-new integrations carry significant PS rate.
- Automated QA (AQA)
- Conversation Analytics: 1,200+ out-of-the-box insights plus custom categories
- AI Call Summary & Chapters
- AI Questions
- CSATai / Sentiment Analysis
- Premium Managed Service (CSAE)

### Agent Guidance – Real-Time Agent Assist
Integration Validation Required: Confirm CCaaS/desktop integration is supported.
- Real-Time Guidance Cards
- Compliance & Disclosure Prompts
- Knowledge Surfacing (Answer Engine)

## 3. Integrations
Complete one block per integration. Verify connectivity method with customer's technical contact before marking Verified.
- Integration types: REST API, SOAP API, Webhook, SFTP, TBD
- Connection types: 3rd Party App (Read/Write), Data Indexing, Contact Center

## 4. Implementation Flexibility
Capacity reserves the right to choose the most efficient platform tool to achieve the defined outcomes. A Post-Sales Design block is reserved for deep-dive discovery.

## 5. Assumptions & Dependencies
- Technical Access: Customer will provide required access to environments, APIs, and source systems.
- Stakeholder Approvals: Customer will provide timely approval of interaction flows, message templates, and QA rubrics.
- Data Accuracy: Customer responsible for ensuring data accuracy within source systems.
- Messaging Compliance: Customer responsible for SMS/Email policies including TCPA compliance.

## 6. Limitations (Out of Scope)
- No Data Cleaning: Capacity is not responsible for de-duplicating or correcting data in customer's source systems.
- Third-Party Configuration: Capacity will not configure customer's internal CRM/CCaaS layouts.
- Language: Phase 1 is restricted to English only unless noted.

## 7. Future Phases & Roadmap
Document everything discussed but deferred. Gives CS a clear expansion path from day one.

## 8. Professional Services
Fill in estimated hours from the Scoping Machine or Internal Bot pricing output. Always include post-sales discovery language.

## 9. Open Items & PS Handoff Notes
PS/CS: Review this section before kickoff. All open items should be resolved or assigned before go-live planning begins.`,
  },

  {
    source_id: 'drive:grants-rfp-process:1Tx70SOXv',
    title: "Grant's Recommended SE RFP Process",
    url: 'https://docs.google.com/document/d/1Tx70SOXvR7O42PtbvWnzt4DBMomE_ERkXGcFttuLEFs/edit',
    content: `Grant's Recommended SE RFP Process (Last updated: Aug 12, 2025)

1. Review past RFPs for answers here: Security / RFPs folder (drive.google.com/drive/u/0/folders/15MLplvCC-N1ZRaIPjBQ-RgwCXJCExF3M)
   - Most of the general "who is Capacity" stuff can be replicated from past examples.
   - Specific reps may have better example RFPs depending on industry vertical (e.g. Kyle for credit unions/mortgage shops)

2. Add your own input FIRST so you can identify gaps/questions
   - Take ownership — RFPs are an essential part of being an SE!

3. Determine any gaps early
   - Answer what you can as an SE given the information and past RFPs
   - Identify specific security and/or product knowledge gaps including roadmap-related questions

4. Move the Excel workbook or Google Sheet into the shared Google Drive Security / RFPs folder

5. Create a Slack channel for the prospect (if one does not already exist)
   - Add relevant heads of product (Julia D, Julia T, Steve F, Jason M), security or legal (BCT or Kathryn)
   - Ask Capacity for the org chart if unsure who to add
   - Can add PS leads (Yoni and/or Dan) if you expect managed services or a workflow build

6. Get the due date and make it known to all in the channel
   - This is hugely important in getting folks rounded up to help complete these

7. Follow up in channel periodically ahead of the deadline
   - Keep up with folks on a regular basis and make sure they are completing the questions you need`,
  },

  {
    source_id: 'drive:se-onboarding:1hSwVNeuU',
    title: 'Sales Engineer Onboarding Guide',
    url: 'https://docs.google.com/document/d/1hSwVNeuU9teX8-lR0nN65A2KdvLqx5oKrFeFDdOOc8Q/edit',
    content: `Sales Engineer Onboarding Guide

## Access Required
- Capacity SE Tickets/Board access
- Capacity org
- Personal Textel access (Textel account for capacity org, TFN)
- Create user in Capacity SMS Demo orgs
- Answer Engine access
- Textel CC/UC demo org access (NICE DFO/CXone Agent, Genesys, RCCX, RCEX)
- Add to se@capacity.com (Framer Demo Sites)
- Retail access (Retell.ai access)
- Call Criteria

## Tools
- Postman
- Add to SE LastPass group

## Training Modules
- SE Expectations, how we function and support Sales Reps
- Review Internal Team Processes/communication channels
- Review Demo Videos: Cintas, Republic Services, Turtle Beach, Gerber (External + Internal), The Mortgage Firm, Verifent (parts 1 & 2)
- CCaaS 101: Glossary, how Capacity fits, OEM/Reseller vs Direct
- Capacity 101: Help Desk, LiveChat, Knowledge Base, App Center, Dev Platform, Workflows, Automations, CapDB, Concierge, Articles, Demo Sites, Org Management, Analytics
- Review Capacity AI Info (Generative AI in Capacity, Setting Up GCs using GenAI)
- Textel CC/UC 101 (NICE/RC, RCCX, RCEX, Genesys)
- Textel Direct 101 (Conversations, Blast, Textbots, SMS Inbox)
- Answer Engine 101 (Standalone version)
- Speech 101 (ASR, Call Progress Analysis, TTS, Voice Biometrics)

## Demo Builds
- Capacity chatbot
- Web to Text / Textbot
- Retail build
- Retell.ai build

## Ingenuity Practice Exercise
- Build one new use case to share with the team
- Suggest one improvement to the SE team (new feature to Demo Apps, new reusable use case, addition to SE process/flow)

## Demo Skills
- Storytelling 101
- Pitch & Differentiation
- Customer Support Automation (IVA, SMS, Chatbot)
- Employee Support Automation and Helpdesk
- Textel dry run
- CAE dry run

## Scoping
- Process Documentation: docs.google.com/document/d/1rPH71-KPBv0dW4at4qQQafsQHASIBGVBIofJ9LP_Z9s
- Required Documentation: app.smartsheet.com/b/form/119c9c4a76664822a3f8d9a102172e7a
- Using Salesforce
- Scoping Tribal Knowledge

## Key Slack Channels
#ai-product-team, #answer-engine-issues, #capacity-issues, #competition, #product, #releasenotes, #rev_team, #sales, #sales-engineering-team (private), #sales-engineering (public), #se-demo-sites, #security, #workflows-product-team

## Key Resources
- Sales Engineering Folder: drive.google.com/drive/folders/0ACrCqyqn30amUk9PVA
- Useful tools: jsonlint.com, jsonpathfinder.com, regex101.com`,
  },

  // ── SOLUTION SUMMARIES ────────────────────────────────────────────────────

  {
    source_id: 'drive:purchasing-power-solution-summary:1cMDvjEt',
    title: 'Purchasing Power Solution Summary – Chat IVA Expansion',
    url: 'https://docs.google.com/document/d/1cMDvjEtALwWSKQe3I9ts-xdEuu0b18R992bxD0HTXtA/edit',
    content: `Purchasing Power Solution Summary – Chat IVA Expansion
Customer: Purchasing Power
Project Name: Capacity + Purchasing Power – Expansion
Prepared By: Kaitlynn Crossno, Sales Engineering Manager
Version: v1.0 – 02/19/2026

## Business Context & Current Challenges
- Fragmented Customer Experience: Purchasing Power needs a unified, channel-agnostic chat experience with seamless live agent escalation and consistent context continuity.
- Self-Service Gap: Customers rely on live agents for routine inquiries (order status, account management, returns) that could be resolved through automation.
- Security & Compliance: Sensitive customer and financial data requires robust PII redaction and authentication controls throughout all interactions.

## Phase Outcomes
- Phase 1: Fully operational Live Chat with a single preform for intake before transferring to a live Purchasing Power agent in the Capacity platform.
- Phase 2: Chat IVA capable of handling routine customer inquiries, self-service transactions, and seamless live agent escalation.
- Phase 3: Purchasing Power CX Leadership can automatically grade 100% of interactions and surface conversation insights (Chat), plus Manual QA review for edge cases.

## Products in Scope

### Conversation Intelligence (Creovai)
- Automated QA (AQA): AI-driven scoring of 100% of chat interactions using up to 1 custom QA scorecard.
- Conversation Intelligence: Deployment of 1,200+ out-of-the-box insights plus up to 10 custom categories.
- AI Summary & Chapters: Automated summarization and categorization.
- Premium Managed Service: Dedicated TAM and CSAE for platform optimization, ROI reporting, category development, and hypercare. Limited to 4 hours/month.

### Live Chat & Virtual Agent
- Live Chat: Real-time chat functionality for support agents, multiple concurrent customer sessions.
- Chat IVA: Intelligent virtual agent handling routine requests, information lookups, and transactions with automated escalation.
- Supported Use Cases: Live agent escalation, PII redaction, WISMO (Where Is My Order), Returns, Account Management (balance inquiries, spending limits, password reset, address/phone updates), FAQ.

## Integration Strategy
- Integration #1: SAP (Existing integration in Purchasing Power Voice): Push post-interaction summaries and case notes into customer's SAP account record. Key Data Objects: Customer Account Records, Post-Interaction Summaries, Case Notes.

## Assumptions & Dependencies
- Language: Initial deployment in English only.
- API Availability: Conversation Intelligence and Chat IVA functionality limited to Purchasing Power's current APIs.
- No Stripe integration in Phase 1.
- No Knowledge Base migration from Mindtouch in Phase 1.

## Future Phases
- Phase 3: Knowledge Base Migration from Mindtouch to Capacity.
- Phase 4: Stripe integration for secure payment processing.`,
  },

  {
    source_id: 'drive:acis-solution-summary:1NGVmU7x6',
    title: 'ACIS (American Council of International Studies) Solution Summary – SMS Expansion',
    url: 'https://docs.google.com/document/d/1NGVmU7x6CrjX_WSVfKBfP5Jjy6_2LE5nY7x4VjaSbM8/edit',
    content: `ACIS Solution Summary – SMS Expansion
Customer Name: American Council of International Studies (ACIS)
Prepared by: Brenna Gilbert
Project: Expansion
Last Modified: 01/12/2025

## Background
ACIS, a company offering travel services, wants to enhance customer communication by adding SMS messaging to their existing email notifications. Goals:
- Improve engagement by reaching passengers via their preferred channel (SMS or email).
- Ensure full compliance including managing SMS opt-in/opt-out and consent.
- Maintain detailed audit trails and reports on SMS deliveries for internal tracking and regulatory compliance.
- Streamline manual processes for initiating one-to-many SMS campaigns.

## Project Scope
Components:
- Virtual Agents: SMS Agent (one-to-many campaign outreach is the SMS Agent's core function)
- Integrations:
  - Oracle Database Integration: ACIS's Oracle database serves as the authoritative source for passenger and campaign data. Capacity will expose APIs to receive data pushes from ACIS on a scheduled or event-driven basis. Data pushed includes: recipient phone numbers with campaign/template IDs, PAX IDs, and other campaign details.
  - Bi-directional Status Updates & Callbacks: Capacity will provide mechanisms for sending back status updates to ACIS's Oracle environment including delivery confirmation, opt-in/opt-out updates, error/failure status, duplicate/skipped recipient reporting.

## Limitations (Out of Scope)
- Does not include international sites, international remote agents, or international routing.

## Go-Live Date
April 1, 2026

## Team
- Danny Gorodetsky, Account Manager`,
  },

  {
    source_id: 'drive:gerber-solution-summary:1CuLK6yqz',
    title: 'Gerber Life Insurance Solution Summary – SMS 2FA, SMS Address Update, Voice Agent',
    url: 'https://docs.google.com/document/d/1CuLK6yqzFuB25Lx5LCkk8M9NAVa0nwOW1ejZG8Dnbj8/edit',
    content: `Gerber Life Insurance Solution Summary – SMS 2FA + Voice Agent
Customer Name: Gerber Life Insurance
Prepared by: Brenna Gilbert
Project: New Implementation
Last Modified: 09-23-2025

## Background
Gerber Life Insurance is a respected provider of life insurance solutions specializing in affordable products designed to help families achieve financial security. Known for commitment to customer service and its legacy as part of the Gerber Products family.

## Solution Components

### 2.1 SMS 2FA Authentication
Capacity will provide Gerber Life Insurance with an SMS-based two-factor authentication solution designed to increase authentication rates and reduce caller drop-off within the IVR system. Callers will receive a unique numeric code via SMS and enter or speak the code into the IVR to securely validate their identity.

### 2.2 SMS Address Update
Customers can update their physical address or phone number via SMS. SMS address update captures and confirms all necessary address elements (zip, house/street, unit, city, state) before updating records through API. Triggered automatically when the voice agent determines telephone-based collection is suboptimal or extra verification is required.

### 2.3 Intelligent Voice Agent
The Voice Agent provides policyholders with a seamless, self-service phone experience to manage their accounts. Customers can make payments, update addresses or phone numbers, and confirm/update profile information through a secure, conversational interface.

Voice Agent Use Cases:
- Authentication & Call Routing: All callers routed to unique DID for authentication using existing IVR methods, with layered SMS 2FA available.
- Change of Contact Information: Address Update, Phone Number Update, Profile Confirmation/Correction via secure automated flow.
- Payments: PCI-compliant conversational payment flows (credit/debit card or ACH). Simple payment if authentication satisfied in first attempt.
- Live Agent Escalation: If caller cannot complete request through self-service, transferred to live agent with all collected information passed along.

## Business Objectives
- Improved Security: Enhanced authentication for all sensitive customer actions.
- Frictionless Customer Experience: Channel-agnostic support for address and payment updates.
- Operational Efficiency: Increased self-service/containment rates, cost savings.
- Seamless Escalation & Routing: Voice agent automatically initiates SMS workflow when needed.

## Limitations
- No international numbers or sites.

## Team
- Zannie Calkin, Senior Account Manager
- Micole Cobert, Technical Account Manager`,
  },

  {
    source_id: 'drive:cmg-solution-summary:19DPsCnjK',
    title: 'CMG Mortgage Solution Summary – Nine Integrations',
    url: 'https://docs.google.com/document/d/19DPsCnjKdPDKTWy3BEs8Ngf8xTLa7yrjwIR3hkJkcpU/edit',
    content: `CMG Mortgage Solution Summary – Nine Integrations
Customer Name: CMG Mortgage
Prepared by: Brenna Gilbert
Project: Existing Implementation
Last Modified: 09-29-2025

## Background
CMG Mortgage, Inc. is a leading national mortgage lender committed to making homeownership accessible. Offers conventional, government, and specialty mortgage options. Known for customer-centric approach and advanced technology.

## Solution Components – Nine Integrations

### 2.1 Aspen Groves Integration
Integrating Capacity with Aspen Groves to automate investor reporting workflow. When a ticket is created in Investor Reporting, an automation creates a corresponding task in Aspen via API. When an Aspen user updates the task, Aspen calls back to Capacity with updated details, triggering workflows to update ticket fields and notify the original reporter.

### 2.2 Thomson Reuters
Integrating with Thomson Reuters Developer Portal to streamline tracking of regulatory updates. When a ticket is created requesting regulatory information, an automation retrieves the latest relevant updates from Thomson Reuters via their API and enters only the specific, requested regulatory fields into the Capacity ticket. Replaces manual review of Thomson Reuters update emails.

### 2.3 Azure ADO
Integrating with Azure DevOps (ADO) to streamline cross-team ticket management. When a ticket is created for a team that uses ADO, an automation creates a corresponding work item in Azure DevOps. Updates made in ADO are automatically pushed back to Capacity. Enables bi-directional collaboration.

### 2.4 DOMO
Integrating with Domo (centralized employee data repository) to enable dynamic access to loan officer (LO) information. Automations pull real-time LO data from Domo. Also extracts list of terminated employees from Domo to automatically update Azure Active Directory.

### 2.5 ManageEngine
Integrating with ManageEngine to support IT help desk teams. Tickets created in Capacity for these teams are automatically pushed to ManageEngine with all relevant details. Future: two-way data sync.

### 2.6 Surefire CRM
Integrating with Surefire to streamline lead management and enhance borrower experience. Automatically looks up and updates contacts in Surefire, qualifies online borrowers, captures new leads, and delivers 24/7 chat-based support for loan status updates and FAQs.

### 2.7 Salesforce CRM
Integrating with Salesforce to streamline lead management for teams working across multiple CRMs. When a lead is collected in Capacity, it is automatically added to Salesforce. Future: live agent escalations sending chat requests from Capacity to a designated Salesforce queue.

### 2.8 SharePoint via Capacity Answer Engine
Connects to CMG's SharePoint for document access. Supports up to 10 volumes/folders and 1TB of data index. Information collected from guided conversations (intake forms) is automatically pushed to a designated SharePoint list.

### 2.9 GSE GPT
Capacity GSE beta product provides ability to create customized LLM agents with access to documents and Knowledge Base sources. Users can chat with the agent which can search sources and respond, maintaining previous conversation context.

## Business Objectives
- Operational Efficiency: Increased self-service/containment rates.
- Frictionless Customer Experience: Channel-agnostic support.
- Seamless Escalation & Routing.

## Team
- Zannie Calkin, Senior Account Manager
- Andy Moffat, Senior Customer Success Manager`,
  },

  {
    source_id: 'drive:techstl-solution-summary:1yZsDqPmN',
    title: 'TechSTL Solution Summary – AI-Powered Workforce Hub',
    url: 'https://docs.google.com/document/d/1yZsDqPmNw7J9PYgjEPb37JVKqBOIxM7mRCj5zwq5VEg/edit',
    content: `TechSTL Solution Summary – AI-Powered Workforce Hub
Customer Name: TechSTL
Prepared by: Brenna Gilbert
Project: New Implementation
Last Modified: 01/21/2026

## Background
TechSTL is working to consolidate multiple workforce and innovation-focused projects, including a startup resource directory and an industry workforce/career pathway portal. Goal: build a single hub leveraging AI to unify access to job boards, resource directories, event calendars, and various databases.

TechSTL has extensive workforce and education data (career pathways, training programs, job opportunities, certifications, events) scattered across disparate platforms: Google Sheets, Airtable, and BuddyPress Member Portal. This fragmentation makes it difficult for stakeholders and job seekers to access a unified, comprehensive workforce experience.

## Project Scope

### Core Platform
- Knowledgebase: Aggregates and organizes all workforce, education, and partner resource data from multiple sources to power instant, accurate answers.
- Conversation Builder: Allows TechSTL to design and manage chat flows, FAQs, and guided interactions.

### Integrations
- Data Indexing (Google Drive, Airtable, BuddyPress): Indexes and searches directory data ensuring all partner resources are accessible.
- 3rd Party Integrations: Integration with external education databases and partner management platforms via API (pending confirmation of access permissions from system owners).

### Virtual Agents
- Chat Agent deployed on TechSTL and Partner Websites with consistent TechSTL branding.
- Conversational Guidance: Users type natural-language questions (e.g., "How do I start a career in cybersecurity?") and receive personalized, step-by-step answers.
- Aggregate & Search Data: Accesses information from Google Drive, spreadsheets, PDFs, Airtable, directories and surfaces relevant job postings, training programs, credential details, and partner resources.
- Curated Pathways: Guides users through options by asking follow-up questions (e.g., location, education level) to narrow down pathways.
- Custom Branding & Integration: Chat Agent styled to match TechSTL's branding, embeddable on multiple sites.

## Limitations
- Does not include international sites, remote agents, or international routing.

## Go-Live Date: Fall 2026

## Team
- Danny Gorodetsky, Senior Account Manager`,
  },

  {
    source_id: 'drive:seco-solution-summary:1LUbT_xzZ',
    title: 'SECO Energy Solution Summary – Set Up Service IVA Expansion',
    url: 'https://docs.google.com/document/d/1LUbT_xzZai8XrsIE7AD2Gyx-LFVGfQ_B2llGYCcMSRM/edit',
    content: `SECO Energy Solution Summary – Set Up Service IVA Expansion
Customer Name: SECO Energy
Prepared by: Brenna Gilbert
Project: Expansion
Last Modified: 12/8/2025

## Background
SECO Energy is one of the largest electric cooperatives in the United States, serving over 220,000 homes and businesses across Central Florida. SECO is a long-time Capacity customer with proven results: 4.5/5 CSAT score on par with live agents, 66% reduction in cost per call, 32% call volume deflection.

## Business Challenge
When a customer calls to set up new electric service, a live agent must be engaged early to collect all required information — sometimes engaging in repetitive questioning or duplicating data already shared. This results in:
- Increased average handle time per call
- Redundant data entry for both callers and agents
- Suboptimal caller experience (repeating information, longer hold times)
- Inefficient use of call center resources

## Solution: Set Up Service Intent Module Expansion (SECO_FD application)
- Pre-qualify and Collect Customer Data: Gather all essential information (address, contact details, service start, billing, and identification) via automated flow before engaging an agent.
- Automate Eligibility Checks: Verify address eligibility and direct out-of-territory callers to appropriate support via SMS.
- Streamline Agent Handoffs: Seamlessly pass all collected data to the agent's Five9 interface at the moment of transfer, eliminating duplicative questioning.
- Support Special Scenarios: Handle multiple meters, new versus returning customers, and alternate billing addresses.
- Reduce Operational Burden: Shorten call times, minimize redundant data entry.

## Products in Scope
- Core Platform: Knowledgebase, Helpdesk, Automations, Conversation Builder, Cloud Drive
- Platform Add-ons: Live Chat, Developer Platform/Capacity DB, Inbox, Articles, Campaigns, CRM
- Workforce Optimization: Agent Voice & Screen Recording, Click2Coach with QM, Standard WFO Suite, Advanced WFO Suite
- Agent Answer Engine (Web App)
- Process Automation: Workflow Builder, Custom Workflow Builds
- Integrations: SharePoint, Box, OneDrive data indexing; 3rd Party API integrations; CCaaS escalation
- Virtual Agents: Chat Agent, SMS Agent, Voice Agent (Inbound/Outbound), Email Agent

## Limitations
- Does not include international sites or international routing.`,
  },

  {
    source_id: 'drive:pronexis-solution-summary:11BAbwS1j',
    title: 'ProNexis Solution Summary – Conversation Intelligence / AQA',
    url: 'https://docs.google.com/document/d/11BAbwS1jBD30-AVcADejBebyLB3xFbxuBj7ikFqQF9A/edit',
    content: `ProNexis Capacity Solution Summary – Conversation Intelligence
Customer: ProNexis
Project Name: Capacity + ProNexis – Phase 1
Prepared By: Jack Murray, Solutions Engineer
Version: v1.0 – 25/03/2026

## Business Context & Current Challenges
- Industry: BPO (Business Process Outsourcing), Line of Business: Sales
- Manual QA Bottlenecks: ProNexis currently samples interactions manually. They need an automated QA solution that can replicate their current manual scorecards for accuracy and scale.
- Improve Agent Coaching: Evaluators need better insight into areas of agent performance that can be coached.
- Drive Increased Lead Conversion: Drive better agent performance for increased conversion from outbound sales leads. Target clients: Bath Solutions and Mosquito Shield (BPO clients).

## Phase 1 Outcome
By go-live, ProNexis will be able to automatically grade 100% of interactions and surface conversation insights (Voice channel only), in addition to manual QA review for edge cases and subjective evaluations, grounded in ProNexis QA rubrics and Twilio interaction data. Dashboards to support QA automation and lead conversion will be built. A manual evaluator form will be available for all interactions.

## Products in Scope

### Conversation Intelligence (Creovai)
- Automated QA (AQA): 1 scorecard
- Conversation Analytics & Custom Categories: 10 custom categories
- AI Call Summary & Chapters: Yes
- AI Questions: Yes
- CSATai / Sentiment Analysis: Yes
- Premium Managed Service (CSAE): Yes

### Professional Services
- Express Delivery: Yes

## Solution Detail
Capacity's Conversation Intelligence platform will automatically analyze 100% of ProNexis' voice interactions, replacing manual QA sampling and surfacing actionable insights for sales, leadership, and feedback to ProNexis' clients.

### Integration: Twilio
- Purpose: Ingest interaction metadata, transcripts, and audio for QA scoring and trend analysis.

### System Configuration
- Custom QA Scorecards: 1 scorecard focused on Sales / Bath Solutions / Mosquito Shield
- Custom Categories: Up to 10 (sales behaviors)
- Dashboards: Sales dashboards showing conversions, outcomes, QA behaviors
- Retention: Standard (30-day audio / 1-year transcripts)
- Language: English only

## Assumptions & Dependencies
- Technical Access: ProNexis will provide required access within 30 days of kickoff.
- Phase 1 restricted to Voice channel only; English only.

## Limitations (Out of Scope)
- No data cleaning.
- Phase 1: Voice channel only.
- English only.`,
  },

  {
    source_id: 'drive:wittel-solution-summary:1SVxoERV6',
    title: 'Wittel Solution Summary – Capacity Platform Implementation',
    url: 'https://docs.google.com/document/d/1SVxoERV6YSUJIViYrpqT2o5JYJX3v0-dVg15Jp-GnCU/edit',
    content: `Wittel Solution Summary – Capacity Platform Implementation
Customer Name: Wittel
Prepared by: Bárbara Monteiro
Project: Renew + New Services

## Background
Wittel is a Brazilian technology company implementing Capacity. This engagement involves renewal and new services.

## Project Scope
Core Platform: Knowledgebase, Helpdesk, Automations, Conversation Builder, Cloud Drive.

Platform Add-ons: Live Chat, Developer Platform/Capacity DB, Inbox, Articles, Campaigns, CRM, Agent Voice & Screen Recording, Click2Coach with QM, Standard WFO Suite, Advanced WFO Suite.

Process Automation: Workflow Builder, Custom Workflow Builds.

Integrations: SharePoint/Box/OneDrive data indexing, 3rd Party API integrations, CCaaS integrations (NICE, RING, AWS, Genesys), external ticketing systems.

Virtual Agents: Chat Agent, SMS Agent, Voice Agent (Inbound/Outbound), Email Agent.

## Future Requirements
- Add error messages for TTS encoding issues
- Resolve encoding issues with the ASR
- Fix issues in the open question dashboard
- Automate PPU report generation
- Create a script to copy data from the dashboard database to an external database

## Team
- Alex Brasil, Project Manager (Wittel)
- Lukas Santos, Product Owner (Wittel)
- Tassio Duarte, Technical Delivery (Wittel)
- Denis Mairena, Head CX (Wittel)
- Ananda Fonseca, Project Manager and Linguist (Capacity)
- Joaquin Giaccio, Technical Delivery (Capacity)
- Alessandro Chelini, Country Manager Brasil (Capacity)`,
  },

  {
    source_id: 'drive:eye-health-america-solution-summary:1Z08ggIk',
    title: 'Eye Health America (EHA) Solution Summary – IVA for Appointment Management',
    url: 'https://docs.google.com/document/d/1Z08ggIkerLVy-zM0Julbfsfk_1FuSJ-MNHYS03JrXcI/edit',
    content: `Eye Health America (EHA) Solution Summary – IVA for Appointment Management
Customer: Eye Health America
Project Name: Capacity + Eye Health America – Phase 1
Prepared By: Jack Murray, Solution Engineer
Version: v1.0 – 25/03/2026

## Business Context & Current Challenges
- EHA wants to replace its underperforming inbound AI agent with Capacity's platform.
- This is contingent on a successful NextGen EHR integration.
- NextGen's API stack is restrictive, and EHA has not seen any vendor succeed with it.

## Phase 1 Outcome
By go-live, EHA will be able to deploy a functional IVA to automate and deflect incoming calls from their call center. Phase 1 will automate Appointment Confirmation, Rescheduling, and Cancellations. Patients will be able to perform these appointment actions via IVA with escalation to 8x8.

## Products in Scope
- Core Platform: Knowledgebase, Helpdesk, Automations, Conversation Builder, Analytics, Cloud Drive
- Developer Platform / Capacity DB
- Virtual Agent: Voice – Inbound, escalation to 8x8 CCaaS

## Virtual Agent – Voice Use Cases
- New Patient Scheduling
- Existing Patient Scheduling
- Appointment Rescheduling / Cancellation
- Appointment Confirmation
- Authentication Required: Yes — For "Existing Patient Scheduling," IVA must securely verify the patient (DOB, Phone, or Zip) before accessing their record to comply with HIPAA and NextGen's security protocols.
- Escalation Destination: Live agent via 8x8
- Escalation Triggers: Any call reason not in scope, failed authentication for existing patients, any failure state from API

## Integration: NextGen EHR
- Purpose: Patient record lookup and appointment management.
- Type: 3rd Party App (Read/Write)
- Connectivity: REST API
- Status: Pending
- API Documentation: nextgen.com/api

## Implementation Flexibility
A Post-Sales Design Block is reserved for deep-dive discovery to finalize configuration, field mapping, and logic design.

## Assumptions & Dependencies
- Technical Access: EHA will provide required access to environments, APIs, and source systems.
- Stakeholder Approvals: EHA will provide timely approval of interaction flows.
- Data Accuracy: EHA responsible for data accuracy within source systems.

## Limitations (Out of Scope)
- Phase 1: Voice channel only (Appointment Confirmation, Rescheduling, Cancellation)
- No Data Cleaning
- English only`,
  },

  {
    source_id: 'drive:mo-botanical-gardens-rfi:1abPahSET',
    title: 'Missouri Botanical Gardens – RFI Response & Solution Summary',
    url: 'https://docs.google.com/document/d/1abPahSETHtMsX_4Smp_qhI6lZCkfWvshkf8tfS1H3t8/edit',
    content: `Missouri Botanical Gardens (MBG) – RFI Response & Solution Summary

## Background
The Missouri Botanical Garden (MBG), established in 1859 and recognized as a National Historic Landmark, is a global leader in botanical research, science education, and conservation. Its Kemper Center for Home Gardening serves as a trusted public resource, offering expert advice and support for plant care, pest and disease identification, and gardening recommendations — primarily for the Midwest, but with national and international reach.

The Kemper Center's "Plant Doctor Answer Service" responds to approximately 15,000 annual inquiries across phone, email, web forms, and SMS, particularly during seasonal peaks (April–May).

## Problems to Solve
- Multiple, fragmented communication channels and manual workflows, leading to inefficiency and duplicated effort.
- Data silos (spreadsheets, static PlantFinder database snapshots, and disjointed transcripts), hampering trend analysis and outreach planning.
- Heavy staff workloads answering repetitive, routine questions during seasonal peaks, straining limited nonprofit resources.

## Objective
Modernize the Plant Doctor Answer Service by implementing a cloud-based contact center and answer-service platform that will:
- Unify all inquiry channels into a single interface for agents/admins.
- Automate responses to routine questions.
- Integrate with existing PlantFinder database and MBG knowledge sources.

## Solution Components
- Core Platform: Omni-channel knowledgebase, helpdesk, advanced automations, secure cloud drive, conversation builder.
- Platform Add-ons: Live Chat, Developer Platform/Capacity DB, Inbox, Articles, Campaigns, CRM integrations.
- Workforce Optimization (WFO): Voice and screen recording, coaching, QM, workforce management, desktop analytics, keyword/phrase spotting.
- Process Automation: Workflow builder, custom workflows, integrations with internal/external platforms, API documentation.
- Knowledge Management: Indexed data from SharePoint, Box, OneDrive, and internal documentation.
- Virtual Agents (IVA): Intelligent support via chat, SMS, voice, email (inbound and outbound), 24/7 availability with escalation capabilities.

## Key Success Metrics
- Proactive project collaboration
- On-time, accurate completion of deliverables
- Swift time-to-value and rapid go-live`,
  },
];

async function main() {
  let totalChunks = 0;

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
        author: 'capacity-se',
      });
      process.stdout.write('.');
    }

    totalChunks += chunks.length;
  }

  console.log(`\n\nDone! Indexed ${DOCS.length} documents, ${totalChunks} total chunks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
