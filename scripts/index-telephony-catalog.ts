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

const TELEPHONY_CATALOG = `# Telephony Platform Integration Catalog (CAAD Space)
Source: Confluence space 'SA Customer Application and Documentation' (CAAD), equity.atlassian.net
Extracted: 2026-04-22. 200 pages surveyed. 39 applications catalogued.

## Summary Metrics
- Total applications catalogued: 39
- Apps using SIP: 12 | Not using SIP: 14
- Apps using InContact / NiC / CXone: 15
- Apps using Retell: 6
- Apps using Five9: 3
- Apps using RingCX: 2
- Apps using Vonage: 1
- PSTN-only: 10
- Status Production: 19 | Planning/In Progress/Dev: 11 | Dead: 4

---

## InContact Signal API Overview (Reference)
Platform: InContact / CXone (NICE) | SIP: Varies per customer
Transfer: SIP REFER-style handoff driven by Signal API POST
Data: POST /incontactapi/services/v18.0/interactions/{contactId}/signal with p1..p9 query params (ANI, DNIS, TransferAlias, ReasonForTransfer). Auth via POST to /authentication/v1/token/access-key, then Bearer token.
Region: CXone na1 | Status: Reference
Notes: Cross-cutting doc describing how all SmartAction apps signal call context and trigger transfers within CXone. Signal payload carries structured screen-pop data.
Source: CAAD/2886369313

## Applications Using InContact / NiC (Index)
Platform: InContact / CXone | SIP: Yes | Transfer: Signal API
Customers listed: DSW_FD (Central), Choice_FD (UserHub), GetARoom (Central), OldRepublic (UserHub), McGrawHillAuth (UserHub), CityFurniture_FD (UserHub)
API versions: v10.0 / v17.0
Source: CAAD/2493145740

## DSW_FD
Platform: InContact (NiC) | SIP: Yes
Transfer: SIP transfer via inContact VPN; Signal API for escalation context
Data: SIP route to 4004010186@216.20.237.73 via inContact VPN. APIs: buslogic REST (Lookup/PhoneNumber, OrdersOnFile, OrderStatus, PasswordReset, InContactSignal) plus Apigee-hosted customer APIs.
Volume: High | Infrastructure: PBX 7 / nj-pbx51, inContact VPN, dswinc-prod.apigee.net
Status: Production
Notes: IP whitelist 72.26.112.96/28, 192.131.21.0/24, 72.28.118.160/28. Customer APIs via Apigee gateway.
Source: CAAD/2493125284

## GetARoom_FD (Central)
Platform: InContact (NiC) | SIP: Yes
Transfer: SIP via inContact; Signal API for screen pop
Data: InContact Token API (api.incontact.com/InContactAuthorizationServer/Token), then signal. Buslogic endpoints: GetPopCities, GetCountries, GetOtherCities, GetRegions/{Country}, CancelReservation, Submit, SendConfirmationEmail, CheckIfMobile, SendTextMessage, Lookup/PhoneNumber, LookupID, Ping.
Volume: ~130,000 calls/month | Infrastructure: LAX pbx11, inContact
Status: Production | Notes: Central-region NiC tenant. Large volume hotel reservation IVA.
Source: CAAD/2493125008

## GetARoom_NewReservationDetails
Platform: InContact (NiC) | SIP: Yes
Transfer: SIP via Signal API
Data: SIP headers on inbound; transfer triggers Signal API POST /InContactSignal/{contactId} with pipe-delimited caller data in p1..p9.
Infrastructure: DID block +1-999-625-08XX; auth at api.incontact.com/InContactAuthorizationServer/Token
Status: Production
Notes: Buslogic AddCallData / GetCallData coordinate state between B2 app and OR bot keyed on ANI.
Source: CAAD/2493190639

## Guardian_FD IVA
Platform: Five9 + SmartAction | SIP: Yes
Transfer: SIP Transfer (SIP trunk Five9↔SA, then SA→OR)
Data: SIP headers X-DNIS, X-ANI, X-Intent, X-Result exchanged with Five9. APIs to WorthWhile (gpp-guardian.worthwhiletest.com / gppcrm.com) for contacts, claims, SMS.
Infrastructure: Five9 ↔ SA SIP trunk; DIDs 4242175381 (claim check), 4242175391 (new claim), 7012514340 (survey)
Status: Production
Notes: Daily survey CSV exported to SFTP 11:59 PM EST. Auth via HTTP header token.
Source: CAAD/2493191919

## Advantage Reserve
Platform: NiC InContact (via BluIP SBC) + Retell (Margaritaville Key West only) | SIP: Yes
Transfer: SIP via Signal API (NiC); Retell native transfer
Data: SIP headers; Signal API p1 pipe-delimited (Resort|Guest|Intent|Nature|Confirmation#|Rooms|ArrivalDate|DepartureDate|Adults|Children|Ages|BedType|Perks|TransferReason|CancelReason). Sabre Synxis REST + SOAP.
Infrastructure: BluIP SBC → LAX-PBX7 or NJ-PBX56 → NOVA or Retell
Status: Production
Notes: Hybrid NOVA + Retell routing. Twilio SMS for email capture.
Source: CAAD/2493201117

## AAACPERS
Platform: Vonage (SIP Registration) | SIP: Yes
Transfer: SIP via registration delegate-subscriber
Data: SIP registration (username/password/domain) on SBC. D3 Fusion API callbacks for ETA and dispatch updates.
Infrastructure: Vonage SBC | Status: Production
Notes: D3 Fusion endpoints on national.aaa.com. Basic auth (Keeper). CDX OAuth2 for out-of-area.
Source: CAAD/2493200824

## AAAWAERS
Platform: PSTN | SIP: No | Transfer: Blind transfer
Data: D3 Fusion REST API; zip-code table for service-area routing.
Volume: ~16,000 calls/month | Infrastructure: PSTN inbound | Status: Production
Notes: Server username/password, encrypted. Credentials in Keeper.
Source: CAAD/2493124846

## FCI_FD
Platform: Omnivoice (PSTN) | SIP: No | Transfer: Blind transfer to agent
Data: SFTP imports of daily outbound call files (FILENUMBER, PHONE, STARTTIME, ENDTIME, TIMEZONE, OFFICE, DNIS, CLIENTNAME). Customer-specific REST APIs per config DID.
Volume: Multi-tenant (15 configs) | Infrastructure: Omnivoice | Status: Production
Notes: 15 tenants (FirstCredit, Cleveland Clinic, UPMC, …). 30-day SFTP retention.
Source: CAAD/2493183571

## ReviewWave_ApptSched
Platform: PSTN (after-hours only) | SIP: No | Transfer: None (no live transfer)
Data: AWS S3 export of call recordings + voicemail. ReviewWave Charlie AI REST API, Bearer token.
Infrastructure: PSTN (after-hours) | Status: Production
Notes: test-api.charlieai.com / api.reviewwave.com
Source: CAAD/2493188107

## RoadAmerica – RADispatchNotificationSpanish
Platform: PSTN (outbound) | SIP: No | Transfer: Blind transfer (DID driven by TFN passed in API)
Data: Buslogic → RoadAmerica web service (corewsqa.road-america.com / corews.road-america.com). No credentials, no IP whitelist.
Volume: Outbound dialer | Infrastructure: pbx4b queue RADispatchNotification | Status: Production
Operations: InitializeCall, CallCompleted, WriteResults, ShouldContinue, Ping.
Source: CAAD/2493126163

## FirstDirectLending – FDLSCC
Platform: PSTN | SIP: No | Transfer: Blind transfer
Data: REST to webservices.firstdirectlending.com/Proxy (prod) & ProxyDev (test) - mailer-code lookup, credit-check, submission. Long token per request.
Volume: Day-parted | Infrastructure: Inbound 8008981335 → SA DID 4242080318 | Status: Production
Notes: Operates 3 AM–7 PM PT.
Source: CAAD/2493125909

## HighPower – HighPowerWarranty
Platform: SIP | SIP: Yes | Transfer: SIP transfer
Data: SIP headers; warranty lookup API hconnect.hpts.tv:8965/WorkOrderData.svc (SOAP).
Infrastructure: PBX 66.23.190.10, SIP ext 1701 | Status: Production
Notes: Customer 888-827-6126 → SA DID 3104171846. Transfer ext 12706014800.
Source: CAAD/2493125963

## LYNX – LYNXGD
Platform: PSTN | SIP: No | Transfer: Blind transfer
Data: State Farm GlassClaimSolutionService (SOAP) - policy, coverage, dispatch. Buslogic CreateFNOL / CreateDispatch. Failover DID 2394797472.
Volume: B2B | Infrastructure: pbx4b queue LYNXGD; TFN 8773479066 → SA DID 3103590653 | Status: Production
Notes: IP whitelist 72.26.112.96/28 (LAX), 72.28.118.160/28 (NJ).
Source: CAAD/2493124685

## OU Online Enrollment Services
Platform: RingCX | SIP: No | Transfer: RingCX live-queue escalation
Data: Salesforce /services/apexrest/startbotflow; SMS via Textel / RingCX; Capacity DB.
Volume: SMS-based | Infrastructure: RingCX | Status: Production (Draft 3/2/26)
Notes: SMS-based IVA. 14 data pushes to unified student record on Salesforce Opportunity object.
Source: CAAD/3156508677

## University of Oklahoma (OU) – SMS GC RingCX
Platform: RingCX | SIP: No | Transfer: RingCX escalation to live queue
Data: SMS via RingCX; Salesforce startbotflow; Calendly for coach booking; Capacity DB.
Context vars: Optedin, Firstname, Lastname, Advisor, Academic Program. 15 workflows / 3 phases.
Infrastructure: RingCX | Status: Production (Draft 3/2/26)
Source: CAAD/3026878466

## SECO Agentic Solution
Platform: Retell → Five9 | SIP: Yes | Transfer: SIP REFER via Five9
Data: SIP headers X-Five9CallId, X-Five9SessionId carry session linkage. Custom SECO APIs via Capacity integration layer.
Volume: Agentic | Infrastructure: Retell + Five9 | Status: Production
Notes: Two-agent pipeline with hand-off to Five9 on completion.
Source: CAAD/3123019811

## New Hotel Onboarding (Retell Agent Pipeline)
Platform: Retell + InContact | SIP: No (native) / Yes via Signal API transfer
Transfer: InContact Signal API for escalation — POST /incontactapi/services/v18.0/interactions/{contactId}/signal
Data: SmartAction hotel configuration APIs. Sabre HSS (REST) & CHC (SOAP) on customer side.
Volume: Agentic | Infrastructure: Retell + InContact | Status: Production
Notes: Front-Door + Multi-Prompt agent pattern.
Source: CAAD/3112566786

## Agentic Reservation Management
Platform: Retell → Five9 | SIP: Yes | Transfer: SIP REFER via Five9 with screen pop
Data: SIP headers X-Five9CallId, X-Five9SessionId and screen-pop data. SmartAction booking/reservation APIs; CapacityDB.
Volume: Agentic | Infrastructure: Retell + Five9 | Status: Production
Notes: Two-agent pipeline (Front Door + Multi-Prompt) transferring on escalation.
Source: CAAD/2994798643

## PACSUN Voice IVA
Platform: Retell + Gladly | SIP: Yes | Transfer: Retell native + Signal API
Data: Retell SIP integration sip:5t4n6j0wnrl.sip.livekit.cloud → Gladly. Escalates to NiC via Signal API.
Infrastructure: Retell LiveKit → Gladly SIP; InContact | Status: Draft (11/18/25)
Source: CAAD/2782887937

## SKNV – NOVA Application
Platform: Retell + NOVA | SIP: Varies | Transfer: Hybrid — Retell → NOVA for payment
Data: Retell agent authenticates & calculates amount; NOVA handles payment (CyberSource). FRED API for patient records; Capacity Dev Platform for patient lookup.
Volume: Healthcare | Infrastructure: Retell + NOVA + CyberSource | Status: Production
Notes: Payment flow split from conversation flow for PCI separation.
Source: CAAD/2761228289

## ACG – ACG_ProviderDispatch
Platform: Outbound dialer | SIP: No | Transfer: Outbound placement only
Data: ACG Fusion ERS API svc.acg.aaa.com/fusion-ers/v2/call/status/update. Twilio for mobile verification. Buslogic ACG_ProviderDispatch.svc.
Infrastructure: AAACalloutNotification DB | Status: Dead (live 12/9/2020)
Source: CAAD/2493124511
`;

async function main() {
  const chunks = chunkText(TELEPHONY_CATALOG);
  console.log(`Indexing Telephony Integration Catalog: ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    await upsertDocument({
      source: 'confluence',
      source_id: `confluence:telephony-catalog:${i}`,
      title: 'Telephony Platform Integration Catalog (CAAD)',
      content: chunks[i],
      url: 'https://equity.atlassian.net/wiki/spaces/CAAD/overview',
      author: 'capacity-sa',
    });
    process.stdout.write('.');
  }

  console.log(`\nDone! Indexed ${chunks.length} chunks.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
