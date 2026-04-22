import 'dotenv/config';
import { upsertDocument } from '../server/lib/embeddings.js';

const CHUNK_SIZE = 1500;
const OVERLAP = 225;

const content = `CAAD Integrated Systems Inventory - Pass 2 of 2
SA Customer Application and Documentation
Customer APIs, Internal Webservices, SFTP, Databases, and Supporting Systems
Prepared 22 April 2026

EXECUTIVE SUMMARY
This is the second of two passes over the SA Customer Application and Documentation (CAAD) space. It inventories every non-telephony system that SmartAction applications exchange data with - customer REST/SOAP APIs, internal SmartAction buslogic webservices, databases, SFTP drops, SMS gateways, payment processors, CRMs, and identity providers. 138 integration rows were captured across 87 distinct applications / pages.

Headline findings:
- SmartAction's buslogic webservice is the universal middleware layer. Every customer-facing application exposes a per-app service at mc2-qa1.dc.smartaction.local (test), uat-buslogic.dc.smartaction.local (UAT), and buslogicsec-nlb (prod), all on port 8282, with a REST-ish shape of /buslogic/{env}/{AppName}/{AppName}.svc/{ver}/{Operation}.
- OAuth2 client_credentials and Bearer tokens dominate newer integrations (Tekion, Athena, XTime, LGA, Innomotics/Siemens, InContact Token API). Older integrations rely on Basic auth (AAA D3 Fusion, ALFA, Siemens Siebel), static headers (DSW, WorthWhile, CHC), or encrypted web.config credentials.
- Apigee is the customer-facing API gateway for DSW (dswinc-prod.apigee.net / dswinc-test.apigee.net).
- SFTP / FTP is the data-exchange channel of choice for bulk-record scenarios.
- The AAA family dominates the dispatch side: D3 Fusion (AAACP, AAAWA, AAACO, CAASCO, ACG), CDX OAuth2 for out-of-area. IP whitelist 72.26.112.96/28, 72.28.118.160/28, 192.131.21.0/24 recurs across the portfolio.
- Twilio and OneReach handle SMS across most customers; Textel and ZipWhip appear in specific deployments.

SMARTACTION BUSLOGIC (INTERNAL MIDDLEWARE)
The buslogic layer is SmartAction's own REST webservice that sits between the voice/chat runtime and customer backends. Every live customer application has a corresponding service.
- Test: https://mc2-qa1.dc.smartaction.local:8282/buslogic/test/{App}/{App}.svc/{ver}/
- UAT: https://uat-buslogic.dc.smartaction.local:8282/buslogic/uat/{App}/{App}.svc/{ver}/
- Prod: https://buslogicsec-nlb:8282/buslogic/prod/{App}/{App}.svc/{ver}/
Typical operations: Lookup/PhoneNumber/{phone}, Lookup/{IdField}/{value}, update methods (email/phone/address/payment), AddCallData, GetCallData, Ping health check.
Applications with buslogic: DSW_FD, GetARoom_FD, Guardian_FD, CityFurniture_FD, BJs_FD, LegalAndGeneral_FD, LGA_Retirement_FD, Aspirus_FD, Innomotics_FD, Siemens_FD, PurchasingPower_FD, CAASCO, ACG_ProviderDispatch, ACG_ERSChatbot, AZDES, Covenant, SA_Dealership.

CUSTOMER REST/SOAP APIs

DSW (Apigee-hosted):
- Prod: https://dswinc-prod.apigee.net
- Test: https://dswinc-test.apigee.net
- Endpoints: /customers/search?phone={phone}, /orders/phone/{phone}, /customers/getAtgLoginByProfileId/{AtgID}, /orders/status/{OrderNumber}, /customers/triggerPasswordReset
- Auth: API key (encrypted in web.config, plain in engineering KeePass)
- IP whitelist: 72.26.112.96/28, 192.131.21.0/24, 72.28.118.160/28
- Note: Test flows against prod URLs per client request due to test data gaps.

Athena Healthcare (HenrySchein):
- Base: https://api.preview.platform.athenahealth.com/v1/{practiceKey}/...
- Endpoints: /patients, /patients/{id}/appointments, /providers, /departments, /appointmenttypes, /appointments/open, /appointments/{id}, /appointments/{id}/cancel, /appointments/waitlist
- Auth: OAuth2 client credentials; scope athena/service/Athenanet.MDP.*
- Status: Sandbox only - not yet live. Credentials in Keeper.

Tekion Cloud (SA_Dealership):
- Portal: https://apc.tekioncloud.com/app/docs/versions/3.1.0/apis/
- Endpoints: Get Token (POST), Create Customer, Create Vehicle, Search Customer by Phone, Search Appointment, Opcode, Service Menu (by VIN), Service Shop, Transportation, Employee, Appointment Slots, Appointment Create/Cancel
- Auth: OAuth Bearer token; requires app_id, secret_key, dealer_Id
- Note: Use TEK00 as ServiceAdvisorId for auto-assignment. VIN required for service-menu lookup.

XTime / Cox Automotive (SA_Dealership & Honda):
- Prod: https://api.retailapi-coxautoinc.com/service
- Sandbox: https://sandbox.api.coxautoinc.com/xtime/service
- Token: https://auth.coxautoinc.com/token
- Endpoints: /services, /appointment-availabilities, /appointments-bookings, /appointments, /customers
- Auth: OAuth2 client credentials; headers developerKey and x-api-key required
- Note: Reschedule API currently broken. Recall API non-functional.

Sabre Synxis (Advantage Reserve, New Hotel Onboarding):
- Reservation: https://services-i1.synxis.com/v1
- Channel Connect (SOAP): https://chc-i1.synxis.com/channelconnect/v2_7/api
- Profile Management: https://propertyconnect-i1.synxis.com/ProfileManager.asmx
- Auth: API key (api@smartaction.com account)
- Data: Reservation lookup/create/cancel, availability, rates, guest profile, payment

AAA D3 Fusion (AAACP, AAAWA, AAACO, CAASCO, ACG):
- AAACP prod: https://cpa.ers.national.aaa.com/
- AAACP UAT: https://cpa.ersuat.national.aaa.com/
- AAAWA prod: https://smartaction.aaawa.com/
- AAAWA test: https://smartaction-qa.aaawa.com/
- ACG prod: https://svc.acg.aaa.com:443/
- ACG test: https://qasvc.acg.aaa.com:443/
- CAASCO prod: https://d3smartaction.caasco.ca/
- CAASCO test: https://d3smartactionqa.caasco.ca:27000/
- Common paths: /fusion-members/{memNum}, /fusion-members/members?telephoneNumber=, /fusion-ers/v2/call, /fusion-ers/v2/calls, /fusion-ers/v2/call/{date}/{callId}/{memNum}
- Auth: Basic auth; encrypted credentials in Keeper/web.config
- IP whitelist: 72.26.112.96/28, 192.131.21.0/24, 72.28.118.160/28

AAA CDX (membership, out-of-area authorization):
- Token: https://api.national.aaa.com/common/oauth2/token
- Member endpoints: https://api.national.aaa.com/membership/services/v1/
- Auth: OAuth2

Legal & General America (LegalAndGeneral_FD and LGA_Retirement_FD):
- Token QA: https://api-qa.lgamerica.com/authentication/v1/token
- Token prod: https://api.lgamerica.com/authentication/v1/token
- Self-service endpoints: /SelfService/v1/customer/{caller/detail, authenticate, detail, update/email, update/phonenumber, update/address, update/paymentmethod, authorize-payment, form/request}
- Auth: encrypted credentials in web.config and KeePass

Siemens (Innomotics_FD and Siemens_FD):
- Innomotics_FD: OAuth2 against Azure (login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token), API surface at apim-sirius-intf-qa.siemens.com
- Siemens_FD backends: Siebel SOAP (integration.gateway.premiumservices.siemens.com), Salesforce OAuth2 JWT Bearer Flow (siemens-df-uat.my.salesforce.com/services/data/v51.0/query, JKS keystore), AWS API Gateway postback (b8mfpdbdp3.execute-api.us-east-1.amazonaws.com/dev/items)

Other customer APIs:
- WorthWhile (Guardian): https://gpp-guardian.worthwhiletest.com/integration/v1.0/ (test), https://gppcrm.com/integration/v1.0/ (prod); HTTP header token; contacts, claims, SMS
- LYNX (State Farm Glass): https://www.lynxservices.com/LYNXBusinessServices/GlassClaimSolutionService.svc; SOAP
- HighPower Warranty: https://hconnect.hpts.tv:8965/WorkOrderData.svc?wsdl; SOAP; static credentials in Common.cs
- Review Wave Charlie AI: https://test-api.charlieai.com / https://api.reviewwave.com; Bearer token
- RoadAmerica: https://corewsqa.road-america.com/ext/IVR/ServiceSmartAction.svc/ (test); no credentials
- FirstDirectLending: https://webservices.firstdirectlending.com/Proxy (prod); long token per request
- Purchasing Power: https://api.purchasingpwr.com/; OAuth2 with basic-auth credentials; Bearer token
- City Furniture: https://asap.intra.cityfurniture.io/; credentials in engineering KeePass
- ALFA Insurance: https://ww6.alfains.com:4373/SmartActionProxyService/; Basic auth; IP whitelisted
- BJ's Wholesale: https://209.117.67.89:4113/accent/services/MemberInformation; AuthHeader in web.config
- CHC (Aspirus Health): https://ehrconnect.chchealth.net/ehrc-ws/api/EHRCSmartAction; key/value pair in header; IPSEC VPN (IT-4889)

SFTP / FTP DATA EXCHANGES
- FCI_FD: vendor → SA; daily outbound call files; FILENUMBER, PHONE, STARTTIME, ENDTIME, TIMEZONE, OFFICE, DNIS, CLIENTNAME; 30-day retention
- Guardian_FD: SA → vendor; customer survey CSVs exported daily 11:59 PM EST
- BJs_FD: SA → vendor; refund request export nightly 8:59 PM PT to ftp03.startek.com:22/SmartAction
- CovenantDSFD: bidirectional; driver/manager imports 6 AM PST; callback export twice daily
- Purchasing Power: vendor → SA; 10 emergency message .wav files via client SFTP
- DSW Daily Call Export: SA → vendor; CSV to CrushFTP (https://ftp4.smartaction.com/UAT/); auth metrics 11:30 AM UTC, call summary 11:35 AM UTC

SMS / MESSAGING PLATFORMS
- Twilio: outbound SMS notifications across AAACPERS, Advantage Reserve, ACG_ProviderDispatch
- OneReach: primary SMS for SA_Dealership (appointment reminders), AZDES (Rich Web Chat), CAASCO_ERSChatbot
- Textel: outbound verification-code delivery via webhook to https://nova.smartaction.ai (Capacity-Okta integration)
- ZipWhip (ACG): AT&T Landline Texting, routed via MuleSoft webhooks
- RingCX SMS: RingCX-native SMS for University of Oklahoma SMS IVA

IDENTITY AND AUTHENTICATION
- Okta: on-demand outbound voice-call pipeline (ALFA/CapacityOkta) delivering verification codes; triggered by Textel
- InContact Token API: https://na1.nice-incontact.com/authentication/v1/token/access-key; AppId + AppPassword yields Bearer token for Signal API calls
- Microsoft Azure AD (Innomotics/Siemens): client_credentials OAuth2 on login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
- Salesforce OAuth2 JWT Bearer Flow (Siemens_FD): connected-app pattern with JKS keystore

PAYMENT PROCESSORS
- CyberSource (SKNV - NOVA hybrid): payment transactions and card data
- Experian (FDLSCC, via FDL): soft credit checks behind the FDL API

CRMs, DATABASES, AND DATA WAREHOUSES
- Salesforce: SmartAction writes 14 distinct records to OU student Opportunity object; SECO customer data; Siemens_FD service requests (OAuth JWT)
- CapacityDB: internal operational DB used by Advantage Reserve, Agentic Reservation Management, SpecialtyCommerce, OU IVA, SA_Dealership
- Supabase (DSW Daily Call Export): two edge functions, export-auth-metrics and export-call-summary, run on daily cron
- Caigo.AZDES_MAC: Callback, RecentlyCompleted, RetryData tables; ETL AZDES_MAC_RetryAPI every 30 min

CONTACT-CENTER BACK-END INTEGRATIONS
- InContact CTI / Signal API: used by DSW_FD, GetARoom, Advantage Reserve, PACSUN, New Hotel Onboarding, CityFurniture_FD, and more
- ACG PureConnect (Genesys): http://10.96.149.10:8083 primary / 10.96.149.11:8083 secondary (QA); 10.96.148.91:8083 primary / 10.112.148.221:8083 secondary (prod). Endpoints: /status/as, /xfercCB/as, /xferSMS/as. IP-whitelisted to SA Buslogic IP range.
- Microsoft Azure Bot Service (ACG DirectLine): https://infra-nlb:8450/DirectLineService/Conversation/Receive/ (prod)
- Gladly: SIP bridge via sip:5t4n6j0wnrl.sip.livekit.cloud (PACSUN)

GEOSPATIAL AND SUPPORTING SERVICES
- Google Geocoding: address-to-lat/long for AAACPERS service-location mapping (API key)
- Canadian Post database: geography and address validation for CAAMAN
- DispatchTrack: ETA tracking for CityFurniture_FD (https://city-furniture.dispatchtrack.com/track_order/...)
- Smartsheet: public form for Honda dealership onboarding data collection

AUTHENTICATION PATTERNS SUMMARY
- OAuth2 client credentials: Tekion, Athena, XTime, LGA, Innomotics/Siemens (Azure), AAA CDX, Purchasing Power
- OAuth2 JWT Bearer Flow: Siemens Salesforce (JKS keystore + consumer key + API user)
- Bearer token: ReviewWave Charlie AI, InContact Signal API (post-token), Tekion (post-get-token)
- API key in header: DSW (Apigee), XTime (developerKey + x-api-key), DispatchTrack, Google Geocoding, Twilio
- Basic auth: AAA D3 Fusion, ALFA Insurance, CAASCO Dispatch, Siemens Siebel, MuleSoft (ACG)
- SFTP credentials: per-customer accounts on ftp03.startek.com, ftp4.smartaction.com
- Static header/in-code: WorthWhile (HTTP header token), HighPower (Common.cs), Aspirus CHC (Key/Value pair)

RISKS AND FOLLOW-UPS
- Static credentials in source files: HighPower warranty lookup carries credentials in Common.cs — rotate or vault
- DSW test traffic against prod URLs: confirm rate limits and PII handling accommodate the overlap
- Siemens_FD: Salesforce OAuth JWT keystore must be managed as a secret across environments
- Athena (HenrySchein): sandbox-only; production cutover needs full OAuth credentials and scope grant from Athena
- XTime Reschedule and Recall APIs flagged as broken/non-functional — confirm state with Cox Automotive
- Several older pages record partial detail (Apex, Pack Rat, AAACOERS, AAAWCNY) — worth back-filling
- Buslogic prod endpoint buslogicsec-nlb:8282 is internal only — confirm no accidental external exposure

Source: https://docs.google.com/document/d/1ByJqzpVTiPCGBPOVPL1snKchqAl5OzmEAdAOOcaJjQs/edit`;

function chunkText(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
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

async function main() {
  const chunks = chunkText(content);
  console.log(`Indexing CAAD Integrations Inventory (Pass 2): ${chunks.length} chunks`);
  for (let i = 0; i < chunks.length; i++) {
    await upsertDocument({
      source: 'drive',
      source_id: `drive:caad-integrations-inventory-pass2:${i}`,
      title: 'CAAD Integrated Systems Inventory (Pass 2) — Customer APIs, SFTP, SMS, Auth Patterns',
      content: chunks[i],
      url: 'https://docs.google.com/document/d/1ByJqzpVTiPCGBPOVPL1snKchqAl5OzmEAdAOOcaJjQs/edit',
      author: 'PS Team',
    });
    process.stdout.write('.');
  }
  console.log(`\nDone — ${chunks.length} chunks indexed.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
