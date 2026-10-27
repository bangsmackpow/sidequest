# Sidequest Strategic Review & Disabled American Veteran (SDVOSB) Opportunity Playbook

> **Purpose:** A top-down architectural, capture-strategy, and market-intelligence review of **Sidequest** as a mission-critical engine for winning federal contracts—paired with a broader reference playbook of federal, state, and private-sector opportunities exclusively available to Disabled American Veterans.

---

## Part 1: Top-Down Review of Sidequest (Current Architecture vs. Capture Reality)

Winning on SAM.gov is rarely about submitting the best proposal to a public RFP on the day it drops—by the time a formal Request for Proposals (`ptype=o`) hits SAM.gov, the Contracting Officer (KO) and program office often already have an acquisition strategy and favored requirements locked in. **Top-performing SDVOSBs win during the Pre-Solicitation and Sources Sought phases (`ptype=p,r`)**, or via high-velocity Simplified Acquisition Threshold (SAT) quotes (`ptype=k`).

Below is an honest assessment of where Sidequest excels today and the specific technical/functional gaps in the current codebase that directly impact contract win rates ($P_{\text{win}}$).

### 1.1 What Sidequest Already Does Right
- **Zero-Latency Edge Architecture:** Running on Cloudflare Workers, D1, KV, and R2 ([`src/index.ts`](../src/index.ts)) ensures low-cost, high-availability execution for scheduled SAM.gov ingestion and real-time proposal drafting.
- **Compliance-Aware Drafting Foundation:** [`RfiGeneratorService`](../src/services/rfi-generator.ts) already bakes in **FAR 52.219-27** and **13 CFR § 125.6** (Limitations on Subcontracting) language, VetCert representation, and SDVOSB sole-source citations (**FAR 19.1406**).
- **Inbound MIME Email Interception:** [`handleInboundEmail`](../src/workers/email.ts) automatically parses incoming RFC 822 emails via `postal-mime`, extracts solicitation numbers via regex, and archives raw `.eml` and PDF/DOCX attachments into Cloudflare R2.
- **Multi-Tenant Security & MFA Enforcement:** [`src/auth/middleware.ts`](../src/auth/middleware.ts) enforces RFC 6238 TOTP MFA after a 3-day grace period and provides role-based access control (`admin`, `manager`, `member`).

### 1.2 Critical Gaps in the Current Codebase That Risk Losing Contracts

| Area | Current Implementation | Why This Costs You Contracts |
| :--- | :--- | :--- |
| **1. Restricted Notice Types (`ptype`)** | [`SamGovApiClient.searchOpportunities`](../src/services/sam-api.ts) hardcodes `ptype: "r,o"` (Sources Sought & Solicitations). | **Misses 4 critical notice types:**<br>• `k` (**Combined Synopsis/Solicitation**): The #1 vehicle for fast-turnaround commercial & SAT (<$250k) contracts under FAR Part 12/13.<br>• `p` (**Presolicitation**): Early warning 15–60 days before an RFP drops.<br>• `s` (**Special Notices**): Industry Days, draft RFPs, and Sole Source Intent notices.<br>• `a` (**Award Notices**): Crucial for seeing *who* won, at *what price*, and identifying Prime contractors you can subcontract to. |
| **2. Over-Filtered Set-Aside Query** | [`runSamIngestion`](../src/workers/ingest.ts) filters strictly by `typeOfSetAside: "SDVOSBC"`. | **You miss the #1 capture play in GovCon: "Rule of Two" Flipping.**<br>Most Sources Sought (`ptype=r`) are posted as *Unrestricted* or *Total Small Business (`SBA`)* while the KO conducts market research. If two or more capable SDVOSBs respond to an unrestricted Sources Sought, you can compel/convince the KO to convert the final RFP into an **SDVOSB Set-Aside** (mandatory at the VA under 38 U.S.C. § 8127 *Kingdomware*, and strongly favored across DoD/civilian agencies under FAR 19.1405). Filtering only for `SDVOSBC` means you never see unrestricted Sources Sought notices to shape them! You also miss `SDVOSBS` (Sole Source) and `VOSBC`. |
| **3. Silent Alerts & One-Way Email** | [`runSamIngestion`](../src/workers/ingest.ts) inserts rows into `opportunityAlerts` in D1, and [`OutboundEmailDispatcher`](../src/workers/outbound-email.ts) exists, **but they are never connected**. | When a high-value matching notice drops on SAM.gov, Sidequest logs an alert in the database but never sends an immediate email, SMS, or Slack/Teams webhook to you. Furthermore, while [`handleInboundEmail`](../src/workers/email.ts) receives emails, there is no UI action to **send** your generated Capability Statement or Q&A questions directly to `pointOfContactEmail` (the KO/Contract Specialist) and thread their replies. |
| **4. Blind to Amendments & Attachment Contents** | [`runSamIngestion`](../src/workers/ingest.ts) skips notices where `noticeId` or `solicitationNumber` already exists, and ignores `notice.resourceLinks`. | Government solicitations frequently issue **Amendments (Mod 0001, 0002)** that extend deadlines, change NAICS/set-asides, or publish Q&A responses. Because the poller currently skips existing solicitation numbers (`if (existing.length > 0) continue;`), **you are blind to deadline changes and amendments**. Additionally, `resourceLinks` (the actual Statement of Work / PWS PDFs hosted on SAM.gov) are not automatically downloaded into R2 and parsed into `opportunityAttachments.parsedText`. |
| **5. Truncated Point of Contact (POC) Data** | [`opportunities`](../src/db/schema.ts) only stores `pointOfContactEmail`. | [`SamGovNotice.pointOfContact`](../src/types/sam.ts) provides an array of contacts (Primary KO, Contract Specialist, secondary POCs) with `fullName`, `title`, `phone`, and `email`. Discarding names and phone numbers prevents building a relationship CRM with specific Contracting Officers and Agency OSDBU (Office of Small and Disadvantaged Business Utilization) reps. |

---

## Part 2: Feature Roadmap for Sidequest (What We Should Build Next)

To transform Sidequest from a pipeline tracker into an unfair competitive advantage, we should prioritize the following capabilities across **Communication**, **Lifecycle Tracking**, and **Capture Intelligence**:

### Phase 1: Full-Spectrum SAM.gov Lifecycle & Amendment Engine
1. **Expand Notice Type & Set-Aside Matrix (`src/services/sam-api.ts` & `src/workers/ingest.ts`):**
   - Poll `ptype: "p,r,k,o,s,a"` (Presolicitation, Sources Sought, Combined Synopsis/Solicitation, Solicitation, Special Notice, Award Notice).
   - Support two distinct ingestion modes in `searchProfiles`:
     - **Direct Bid Mode:** `SDVOSBC`, `SDVOSBS`, `VOSBC`, `VOSBS`.
     - **"Rule of Two" Shaping Mode:** Poll `ptype=r` (Sources Sought) where `typeOfSetAside` is `NONE`, `SBA` (Total Small Business), or blank within your target NAICS codes, flagging them specifically as *"Set-Aside Conversion Targets."*
2. **Solicitation Family & Amendment Diffing:**
   - Group notices by `solicitationNumber` (parent-child relationship) rather than skipping duplicates.
   - When an existing `solicitationNumber` receives a new `noticeId` or updated `responseDeadLine` / `typeOfSetAside` / `resourceLinks`:
     - Record an **Amendment Event** with a visual diff (e.g., *"Response deadline moved from Nov 12 to Nov 19"* or *"Set-aside changed from SBA to SDVOSBC"*).
     - Trigger an immediate high-priority push notification.
3. **Automated SOW/PWS Attachment Ingestion:**
   - Iterate over `notice.resourceLinks[]` during ingestion, stream the PDFs/DOCX files directly from SAM.gov into Cloudflare R2 (`BUCKETS`), extract text, and store in `opportunityAttachments`.

### Phase 2: Bidirectional Channel Communication & GovCon CRM
1. **KO / Contract Specialist / OSDBU Contact Registry:**
   - Expand schema to store full POC records (`fullName`, `role` [KO, CS, COR, OSDBU], `agency`, `officeAddress`, `phone`, `email`) and link them across multiple solicitations so you can see every contract a specific Contracting Officer has ever issued.
2. **One-Click Outbound Dispatch & Threading:**
   - Wire [`OutboundEmailDispatcher`](../src/workers/outbound-email.ts) into the Opportunity Detail modal so you can click **"Send Capability Statement to KO"** or **"Submit Formal RFP Question (Q&A)"** directly from Sidequest, using a reply-to address routed back through Cloudflare Email Routing (`capture+<solicitationNumber>@yourdomain.com`) for automatic thread capture.
3. **Real-Time Multi-Channel Notifications:**
   - Connect `opportunityAlerts` creation in [`src/workers/ingest.ts`](../src/workers/ingest.ts) to [`OutboundEmailDispatcher`](../src/workers/outbound-email.ts) + optional Slack/Discord/Teams/SMS webhooks for:
     - New high-match Sources Sought or Combined Synopsis/Solicitation.
     - Amendment / Q&A attachment posted.
     - T-minus 72h and T-minus 24h submission deadline countdowns.
4. ** Formal Q&A Deadline Tracker:**
   - Most solicitations have a **Questions Due Date** (typically 7–10 days before the proposal due date) hidden inside the text. Missing the Q&A deadline means you cannot clarify ambiguous requirements or challenge restrictive specs. Extract and track `questionsDueDate` alongside `responseDeadline`.

### Phase 3: Award Intelligence, Incumbent Tracking & Compliance Tools
1. **Award Notice (`ptype=a`) & FPDS / USAspending.gov Integration:**
   - Automatically ingest Award Notices and query the free **USAspending.gov API** (no API key required!) by NAICS and Agency to answer:
     - *Who is the incumbent contractor on this expiring contract?*
     - *What was the historical award ceiling and obligated spend?*
     - *Which large Prime contractors just won major awards in my NAICS and now need an SDVOSB subcontractor to meet their mandatory 3%–5% SDVOSB subcontracting goals?*
2. **Interactive FAR 52.219-27 "Limitations on Subcontracting" (LOS) Calculator:**
   - Build a calculator inside the Opportunity workspace where you enter total contract price, your direct labor/materials, **"Similarly Situated Entity"** (other VetCert SDVOSB) subcontractor costs, and non-SDVOSB subcontractor costs.
   - Automatically verify that non-similarly situated subcontractors do not exceed **50% (Services)**, **50% (Supplies/Products minus cost of materials)**, or **85% (General Construction)** / **75% (Specialty Trade Construction)**.
3. **AI-Powered Section L/M Shredder & Go/No-Go Matrix:**
   - Use Cloudflare Workers AI (`@cf/meta/llama-3.1-70b-instruct` or Anthropic/OpenAI API) to scan ingested SOW/PWS text and generate:
     - **Bid / No-Bid Scorecard:** Clearance requirements, place of performance, bonding, certifications required, incumbent presence.
     - **Compliance Matrix:** Every "shall/must" requirement in the PWS mapped to your response section.

---

## Part 3: How Top-Performing SDVOSBs Thrive in This Industry

Why do 10% of SDVOSBs win 90% of set-aside dollars while others submit dozens of blind proposals and win nothing? They follow five core operational plays:

### Play 1: The "Rule of Two" Offense (Shaping Before the RFP)
Under **FAR 19.1405** (and **38 U.S.C. § 8127** for the VA), a Contracting Officer **must** set aside an acquisition for SDVOSBs if they have a reasonable expectation that:
1. **Two or more** responsible SDVOSBs will submit offers, and
2. Award can be made at a **fair and reasonable price**.

**How winners execute this:**
- They never treat a Sources Sought (`ptype=r`) as "optional paperwork."
- They maintain a **Peer Network of 2–3 friendly SDVOSBs** in the same NAICS codes. When an attractive *Unrestricted* or *Total Small Business* Sources Sought drops, they alert a friendly SDVOSB peer so **at least two strong VetCert SDVOSB responses** land on the Contracting Officer's desk before the deadline—legally triggering the Rule of Two and forcing/enabling an SDVOSB set-aside!

### Play 2: Mastering the VA "Vets First" Mandate (*Kingdomware*)
In *Kingdomware Technologies, Inc. v. United States* (2016), the U.S. Supreme Court unanimously ruled that the **Department of Veterans Affairs (VA)** must apply the SDVOSB/VOSB Rule of Two to **all** procurements—even orders placed on the Federal Supply Schedule (GSA).
- The VA is by far the #1 buyer from SDVOSBs (obligating over $10B+ annually to SDVOSBs).
- Any SDVOSB should prioritize VA Strategic Acquisition Center (SAC), National Acquisition Center (NAC), Technology Acquisition Center (TAC), and regional VISN (Veterans Integrated Service Network) contracting offices.

### Play 3: Pitching Direct Sole-Source Awards (FAR 19.1406 / VAAR 819.7007)
Most newcomers don't realize a Contracting Officer can hand an SDVOSB a **Sole Source contract without competition** under **FAR 19.1406** (and **VAAR 819.7007**) up to:
- **$4.5 Million** for services/standard NAICS (and up to **$5 Million** at the VA under 38 U.S.C. § 8127(c)).
- **$7.0 Million** (up to $8.5M with recent inflation adjustments) for manufacturing NAICS codes.
- **How it works:** If you identify a program office pain point (or respond as the *only* qualified SDVOSB to a Sources Sought where the Rule of Two isn't met), the KO can bypass full competition and negotiate directly with you.

### Play 4: Leveraging "Similarly Situated Entities" (13 CFR § 125.6)
Historically, small businesses feared bidding on larger contracts because they couldn't perform 50% of the work with their own W-2 employees.
- Under current SBA regulations (**13 CFR § 125.6**), work performed by a **"Similarly Situated Entity"** (another SBA VetCert-certified SDVOSB subcontractor) **counts toward your 50% self-performance requirement!**
- This allows two or three small SDVOSBs to team together (one as Prime, two as First-Tier Subs) to win multi-million-dollar contracts while remaining 100% compliant with FAR 52.219-27.

### Play 5: Avoiding the "Illegal Pass-Through" Trap & Mastering the Non-Manufacturer Rule (NMR)
Many YouTube "GovCon gurus" teach the "Middleman Strategy" (find a solicitation, get a quote from a large commercial company, mark it up 15%, and subcontract 95% of the work).
- **For Services:** Subcontracting more than 50% of the contract value to a non-SDVOSB is a violation of the **False Claims Act** (carrying treble damages and criminal penalties).
- **For Products/Supplies:** You must either manufacture the product yourself OR qualify under the **Non-Manufacturer Rule (13 CFR § 121.406)**:
  1. Your firm has <500 employees;
  2. You are primarily engaged in retail/wholesale trade and normally sell the type of item being supplied;
  3. You take ownership/possession of the item with your personnel, equipment, or facilities in a manner consistent with industry practice; AND
  4. **Crucial:** The product must be manufactured by a **U.S. small business**, **UNLESS** the SBA has issued a **Class Waiver** or **Individual Waiver** of the Non-Manufacturer Rule (OR the procurement is under the **$250,000 Simplified Acquisition Threshold** where special rules apply—check current FAR 19.505(c) thresholds!).
- *Feature Opportunity for Sidequest:* Cross-reference every product solicitation's NAICS/PSC code against the official **SBA Non-Manufacturer Rule Class Waiver List** automatically!

---

## Part 4: Broader Opportunities for Disabled American Veterans (Beyond SAM.gov)

SAM.gov represents only the tip of the iceberg. Many of the most lucrative, lowest-competition opportunities for Disabled American Veterans live on specialized portals, state programs, and federal growth accelerators that are **not** listed on SAM.gov.

### 4.1 Hidden Federal Procurement Portals (Where SAM.gov Doesn't Reach)

1. **Unison Marketplace (formerly FedBid) — High-Velocity Reverse Auctions**
   - **What it is:** Many agencies (DoD, DHS, DOJ, Interior, VA) post thousands of micro-purchases ($10k–$25k) and Simplified Acquisition ($25k–$250k) product/equipment buys exclusively on **Unison Marketplace** rather than full SAM.gov RFPs.
   - **Why it matters:** No 50-page proposal required. You submit line-item pricing and manufacturer part numbers in a structured portal, often with SDVOSB set-asides.

2. **DLA DIBBS (Defense Logistics Agency Internet Bid Board System)**
   - **What it is:** The automated portal (`dibbs.bsm.dla.mil`) where the U.S. military buys millions of National Stock Number (NSN) spare parts, consumables, medical supplies, hardware, and tactical gear.
   - **Why it matters:** Solicitations are standardized, machine-readable, and awarded largely on automated price/delivery evaluation scores (PPIRS/SPRS supplier performance scores), with formal SDVOSB evaluation preferences and set-asides.

3. **GSA eBuy & Multiple Award Schedule (MAS)**
   - **What it is:** Once a vendor holds a GSA Schedule contract (or teams with a GSA Schedule holder via a Contractor Team Arrangement — **CTA**), they gain access to **GSA eBuy**, a closed portal where thousands of RFQs are posted every week that **never appear on SAM.gov**.
   - **Pro Tip:** Don't rush to get your own GSA Schedule on Day 1 (it requires $25,000/year in sales to maintain). Instead, form a **GSA Contractor Team Arrangement (CTA)** or subcontract with an established SDVOSB GSA Schedule holder first.

4. **Government Purchase Card (GPC) Micro-Purchases (<$10,000)**
   - **What it is:** Purchases under the Micro-Purchase Threshold ($10,000 for general supplies/services; $2,000 for construction; $2,500 for SCA services) **do not require competitive bidding or SAM.gov posting**.
   - **Why it matters:** Any agency GPC cardholder can swipe their government Visa/Mastercard directly with your SDVOSB today if your price is reasonable. Building a 1-page "GPC Line Card" and emailing local military bases and VA medical centers is the fastest way to generate immediate cash flow and past performance.

---

### 4.2 Federal Growth Accelerators & Force Multipliers for SDVOSBs

1. **SBA All Small Mentor-Protégé Program (ASMPP) & Joint Ventures (13 CFR § 125.9)**
   - **The Ultimate Superpower:** As a VetCert SDVOSB (Protégé), you can enter an SBA-approved Mentor-Protégé agreement with a multi-billion-dollar large defense contractor (e.g., Booz Allen, Leidos, CACI, or a graduated mid-tier firm).
   - **How it works:** You and your large-business Mentor form an **SDVOSB Joint Venture (JV) LLC**. That JV can bid on **any SDVOSB set-aside contract**, using the **large business Mentor's past performance, facility security clearance (FCL), financial resources, and staff**, while the Mentor can perform up to **60% of the work** (and own up to 49% of the JV).

2. **DoD Mentor-Protégé Program (MPP)**
   - Separate from the SBA program, the **Department of Defense Mentor-Protégé Program** actually **reimburses** large defense primes (or gives them subcontracting credit) for spending money to train your SDVOSB, upgrade your cybersecurity (CMMC Level 2), fund your ISO/CMMI certifications, and transfer engineering technology to your firm.

3. **SBA Federal Surplus Personal Property Program for VOSBs (15 U.S.C. § 657b(g))**
   - **Virtually Unknown Benefit:** Under the Veterans Small Business Enhancement Act, SBA VetCert-certified VOSBs and SDVOSBs have priority access to **receive federal surplus personal property** (heavy machinery, vehicles, IT equipment, generators, lab gear, medical equipment, office equipment) through **GSAXcess** and State Agencies for Surplus Property (SASPs) for minimal service/handling fees to use in running their business.

4. **Veterans Institute for Procurement (VIP)**
   - **What it is:** A 100% **free** (fully funded) residential executive training program in Maryland (VIP START, VIP GROW, VIP INTERNATIONAL, VIP AEROSPACE) specifically for VOSB and SDVOSB owners.
   - **Why it matters:** Taught by active Contracting Officers, SBA officials, defense primes, and GovCon attorneys—and gives you an instant national network of hundreds of vetted SDVOSB peers for Rule-of-Two teaming and Joint Ventures.

5. **SBIR / STTR (America's Seed Fund) — Non-Dilutive R&D Capital**
   - **What it is:** Federal agencies with large R&D budgets (DoD/AFWERX/SOFWERX, NIH, NSF, NASA, DHS, DOE) must set aside 3.65% of their extramural R&D budget for small businesses.
   - **Why it matters:**
     - **Phase I:** $75,000 – $275,000 (6 months feasibility).
     - **Phase II:** $750,000 – $2,000,000 (24 months prototype development).
     - **Phase III:** **Unlimited sole-source production contracts** across *any* federal agency without further competition!
     - As a software/tech builder, Dual-Use Defense Tech SBIRs (like **AFWERX Open Topic**, **xTechSearch**, and **SOFWERX**) are prime territory—and **Sidequest itself** (or an AI-assisted Defense Acquisition/Logistics module) could even compete for DoD SBIRs.

---

### 4.3 State-Level Disabled Veteran Set-Aside Programs (Double-Dipping Your Status)

Federal contracts have heavy national competition. **State-level Disabled Veteran Business Enterprise (DVBE / SDVOB) programs** often have far fewer certified competitors, resulting in agencies desperately searching for certified Disabled Veterans to help them meet statutory mandates:

| State / Program | Statutory Mandate / Goal | Key Mechanism |
| :--- | :--- | :--- |
| **California (DVBE)** | **3% Mandatory Goal** across *all* state agencies & utilities (CPUC GO 156). | Includes the **DVBE Incentive** (adds up to a 5% bid price preference on competitive bids) and the **SB/DVBE Option** (agencies can award contracts between **$5,000 and $250,000** directly by getting just 2 quotes from DVBEs without public bidding!). |
| **New York (SDVOB)** | **6% Statewide Goal** under Article 3 of the NYS Veterans' Services Law. | Discretionary purchasing authority allows NY state agencies to purchase directly from certified SDVOBs **up to $500,000 (up to $750k in some cases) without formal competitive bidding!** |
| **Texas (HUB — Service-Disabled Veteran)** | Statewide HUB Goals (11.2%–32.9% depending on category). | Veterans with a **20%+ service-connected disability** qualify as a Texas **Historically Underutilized Business (HUB)** and gain access to the Texas Comptroller CMBL (Centralized Master Bidders List) where state agencies and universities must solicit HUBs. |
| **Virginia (SWaM — SDV)** | **42% SWaM Goal** (with dedicated Service-Disabled Veteran designation). | Includes the **Virginia DSBSD** certification and micro-business set-asides up to $10,000 / small business set-asides up to $100,000 on the eVA portal. |
| **Florida (VBE)** | Statutory Price Preference & Tie-Breaker (**Fla. Stat. § 295.187**). | Certified Florida Veteran Business Enterprises receive vendor preference in state procurements through MyFloridaMarketPlace (MFMP). |
| **Maryland (VSBE)** | **3% Veteran-Owned Small Business Enterprise Goal** (recently expanded). | Enforced across Maryland eMMA (eMaryland Marketplace Advantage) procurements and prime subcontracting plans. |

---

### 4.4 Corporate Supplier Diversity (Fortune 500 Private-Sector Contracts)

Major corporations—especially Defense Primes, Banks, Telecoms, Utilities, Healthcare Systems, and Automakers—have multi-billion-dollar **Supplier Diversity commitments** for Disabled Veterans (often required by their own federal prime contracts under FAR 52.219-9):

1. **NaVOBA (National Veteran-Owned Business Association):**
   - Certifies **SDVOBs (Service-Disabled Veteran-Owned Businesses)** specifically for Fortune 1000 corporate procurement portals (Walmart, Raytheon, Lockheed Martin, JPMorgan Chase, Johnson & Johnson, PG&E, Verizon).
2. **Disability:IN — VODE (Veteran-Owned Disability Enterprise):**
   - Certifies businesses owned by service-disabled veterans for corporate disability inclusion supply chains (Microsoft, Google, Boeing, CVS Health, Accenture).
3. **DoD Subcontracting Portals (Direct Registration):**
   - Every major Defense Prime maintains an internal supplier portal where they actively hunt for VetCert SDVOSBs to satisfy their **3%–5% statutory SDVOSB subcontracting mandate**. Registering directly in the supplier portals of **Lockheed Martin, RTX (Raytheon), Northrop Grumman, General Dynamics, BAE Systems, Leidos, Booz Allen Hamilton, SAIC, Peraton, and CACI** puts you on their internal small business liaison radar before they ever post publicly.

---

### 4.5 Free Technical, Legal & Capital Resources for Disabled Veteran Entrepreneurs

1. **APEX Accelerators (formerly PTAC — Procurement Technical Assistance Centers):**
   - Funded by the DoD Office of Small Business Programs. Provides **100% free** 1-on-1 counseling, free commercial bid-matching feeds (covering state/local/federal portals), capability statement reviews, and direct introductions to agency Small Business Specialists.
2. **VBOC (Veterans Business Outreach Centers):**
   - SBA-funded regional centers providing free business plan review, VetCert recertification assistance, and financial readiness.
3. **Syracuse University IVMF (Institute for Veterans and Military Families):**
   - Runs **EBV (Entrepreneurship Bootcamp for Veterans)**, **Dog Tag Inc.**, and **V-WISE**—all expenses paid (travel, lodging, curriculum) entrepreneurship accelerators specifically for post-9/11 disabled veterans.
4. **Non-Dilutive Veteran Grants & Pitch Competitions:**
   - **Warrior Rising:** Mentorship, "Vetprenuer" academy, and $20,000+ non-dilutive business grants.
   - **PenFed Foundation Veteran Entrepreneur Program:** Ignition grants and growth capital network.
   - **Second Service Foundation (formerly StreetShares Foundation):** The Military Entrepreneur Challenge ($4,000–$15,000+ non-dilutive grants).
   - **D'Aniello Institute / Bunker Labs (now merged with IVMF):** Ambassador and CEO Circle networks for scaling veteran tech/GovCon companies.

---

## Summary Priority Matrix for Sidequest Development

If we translate this strategic review into immediate engineering sprints in `sidequest`, here is the highest-ROI execution order:

1. **Sprint 1 (Discovery & Rule-of-Two Offense):**
   - Update [`src/services/sam-api.ts`](../src/services/sam-api.ts) and [`src/workers/ingest.ts`](../src/workers/ingest.ts) to capture `ptype: "p,r,k,o,s,a"`, track **Solicitation Amendments** (deadline/scope changes), and add a **"Rule of Two Shaping"** filter that pulls unrestricted/SBA Sources Sought (`ptype=r`) in your NAICS codes so you can flip them to SDVOSB set-asides.
2. **Sprint 2 (Bidirectional Communication & Active Alerts):**
   - Connect [`OutboundEmailDispatcher`](../src/workers/outbound-email.ts) to [`runSamIngestion`](../src/workers/ingest.ts) for instant email/webhook alerts on high-match opportunities and amendments.
   - Add **"Send to Contracting Officer"** directly in the UI modal to dispatch generated RFIs/Capability Statements and thread replies via [`src/workers/email.ts`](../src/workers/email.ts).
   - Store the full `pointOfContact` array (names, phones, titles) to build an Agency/KO relationship directory.
3. **Sprint 3 (Attachment Shredding, Compliance & Award Intelligence):**
   - Auto-download `resourceLinks` (SOW/PWS PDFs) from SAM.gov into R2 during ingestion.
   - Add the **FAR 52.219-27 Limitations on Subcontracting (50% Rule) Interactive Calculator** and **Non-Manufacturer Rule (NMR) Waiver Checker**.
   - Integrate **USAspending.gov API** and `ptype=a` Award Notices to track incumbents, historical award prices, and Prime winners needing SDVOSB subcontractors.
