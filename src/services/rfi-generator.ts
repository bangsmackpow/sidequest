import { StorageService } from "./storage";

export type ProposalTemplateType = "sources_sought" | "sat_quote" | "past_performance_matrix";

export interface RfiGenerationOptions {
  companyName: string;
  uei: string;
  cageCode: string;
  sdvosbCertified: boolean;
  coreCompetencies: string;
  pastPerformance: string;
  templateType?: ProposalTemplateType;
  pocName?: string;
  pocEmail?: string;
  pocPhone?: string;
  customApproach?: string;
  subcontractingPlan?: string;
  proposedPrice?: number;
  deliveryTimelineDays?: number;
}

export interface OpportunityDetails {
  id: string;
  solicitationNumber?: string | null;
  title: string;
  agency?: string | null;
  subTier?: string | null;
  office?: string | null;
  naicsCode?: string | null;
  setAsideCode?: string | null;
  responseDeadline?: string | null;
  pointOfContactEmail?: string | null;
}

export class RfiGenerator {
  constructor(private storage: StorageService) {}

  generateMarkdown(opp: OpportunityDetails, opts: RfiGenerationOptions): string {
    const template = opts.templateType || "sources_sought";

    if (template === "sat_quote") {
      return this.generateSatQuoteMarkdown(opp, opts);
    } else if (template === "past_performance_matrix") {
      return this.generatePastPerformanceMatrixMarkdown(opp, opts);
    }

    return this.generateSourcesSoughtMarkdown(opp, opts);
  }

  /**
   * Template 1: Sources Sought & RFI Capabilities Statement (Section L compliant)
   */
  private generateSourcesSoughtMarkdown(opp: OpportunityDetails, opts: RfiGenerationOptions): string {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const solNum = opp.solicitationNumber || opp.id;
    const agencyStr = [opp.agency, opp.subTier, opp.office].filter(Boolean).join(" - ") || "U.S. Federal Government";
    const certBadge = opts.sdvosbCertified
      ? "VERIFIED SERVICE-DISABLED VETERAN-OWNED SMALL BUSINESS (SDVOSB)"
      : "VETERAN-OWNED SMALL BUSINESS (VOSB)";

    return `# CAPABILITY STATEMENT & SOURCES SOUGHT / RFI RESPONSE

**SOLICITATION / NOTICE ID:** ${solNum}  
**PROJECT TITLE:** ${opp.title}  
**PROCURING AGENCY:** ${agencyStr}  
**TARGET NAICS:** ${opp.naicsCode || "541512 - Computer Systems Design Services"}  
**SOCIOECONOMIC DESIGNATION:** ${opp.setAsideCode || "SDVOSBC (Service-Disabled Veteran-Owned Small Business Set-Aside)"}  
**SUBMISSION DATE:** ${today}  
**RESPONSE DEADLINE:** ${opp.responseDeadline || "As Noted in SAM.gov"}  

---

## 1. CORPORATE IDENTIFIERS & SDVOSB QUALIFICATIONS

| Corporate Parameter | Certified Vendor Details |
| :--- | :--- |
| **Legal Entity Name** | **${opts.companyName}** |
| **SBA / VetCert Status** | **${certBadge}** |
| **Unique Entity ID (UEI)** | \`${opts.uei}\` |
| **CAGE Code** | \`${opts.cageCode}\` |
| **Socioeconomic Status** | Service-Disabled Veteran-Owned Small Business (SDVOSB) |
| **Primary NAICS Codes** | ${opp.naicsCode ? `${opp.naicsCode} (Primary)` : "541512, 541519, 541511, 541330"} |
| **Point of Contact** | ${opts.pocName || "Corporate Capture Director"} (${opts.pocEmail || "capture@sdvosb-proposals.mil"}) |
| **Telephone** | ${opts.pocPhone || "(555) 789-0123"} |
| **Facility Security Clearance** | Active Secret / Top Secret Cleared Facility |

> **FAR 52.219-27 & 13 CFR § 125.6 Subcontracting Limitation Attestation:**  
> ${opts.companyName} explicitly certifies that it complies with the mandatory limitations on subcontracting. As the Prime SDVOSB Contractor, at least 50% of the cost of contract performance incurred for personnel shall be expended by employees of the concern or similarly situated SDVOSB entities.

---

## 2. EXECUTIVE SUMMARY & MISSION ALIGNMENT

${opts.companyName} is honored to submit this comprehensive capability narrative in response to the Sources Sought / Market Research notice for **"${opp.title}"** (Solicitation No. ${solNum}).

As an established, agile SDVOSB contractor, our leadership combines military veteran operational discipline with enterprise technology delivery across federal healthcare and defense agencies. We possess the cleared personnel, mature governance processes (ISO 9001/27001, CMMI Level 3), and contract reachback necessary to perform as a prime contractor with zero mobilization friction.

---

## 3. CORE TECHNICAL COMPETENCIES (SECTION L ALIGNMENT)

${opts.coreCompetencies}

### 3.1 Differentiating Capabilities
- **Veteran Operational Tenacity:** Mission-first culture led by military combat veterans with deep federal domain knowledge.
- **Zero Trust & DevSecOps Maturity:** Native implementation of NIST SP 800-207 Zero Trust Architecture and DoD DevSecOps Reference Design.
- **Rapid Staffing & Cleared Bench:** Pre-vetted roster of Secret and Top Secret/SCI cleared engineers and system architects ready for Day 1 transition.

---

## 4. DRAFT TECHNICAL APPROACH & EXECUTION FRAMEWORK

${opts.customApproach || `### 4.1 Technical Understanding & Performance Work Statement (PWS) Execution
Our execution methodology is built upon iterative, sprint-based milestones adhering to the Federal Agile Playbook. We implement strict configuration baselines, continuous security validation, and automated compliance auditing.

### 4.2 Personnel & Key Staffing Ratios
Proposed key personnel satisfy all DoD 8570.01-M / 8140 baseline certifications (including CISSP, PMP, AWS Certified Solutions Architect Professional, and Red Hat Certified Engineers). We maintain an average staff retention rate exceeding 94%.

### 4.3 Teaming & Subcontracting Structure
${opts.subcontractingPlan || `${opts.companyName} will execute over 51% of direct labor as prime contractor, retaining overall technical architecture, cybersecurity oversight, and quality management, partnering with specialized veteran-owned niche subcontractors as appropriate.`}`}

---

## 5. RELEVANT PAST PERFORMANCE

${opts.pastPerformance}

---

## 6. CONCLUSION & POINT OF CONTACT

${opts.companyName} possesses the corporate qualifications, cleared staff, past performance ratings, and financial capacity to successfully execute this requirement as an SDVOSB Prime Contractor. We look forward to receiving the formal RFP / RFQ and are available for industry one-on-ones or pre-solicitation conferences.

**Authorized Submitting Official:**  
${opts.pocName || "Director of Federal Capture"}  
${opts.companyName}  
Email: ${opts.pocEmail || "capture@sdvosb-proposals.mil"}  
Phone: ${opts.pocPhone || "(555) 789-0123"}  
UEI: ${opts.uei} | CAGE: ${opts.cageCode}
`;
  }

  /**
   * Template 2: Simplified Acquisition Threshold (< $250k) Commercial Item Quote
   */
  private generateSatQuoteMarkdown(opp: OpportunityDetails, opts: RfiGenerationOptions): string {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const priceFormatted = (opts.proposedPrice || 185000).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

    const solNum = opp.solicitationNumber || opp.id;
    const agencyStr = [opp.agency, opp.subTier, opp.office].filter(Boolean).join(" - ") || "Federal Agency";

    return `# SIMPLIFIED ACQUISITION QUOTE & COMMERCIAL PROPOSAL
*(FAR Part 12 & FAR Part 13 Simplified Acquisition Procedures)*

**SOLICITATION NUMBER:** ${solNum}  
**SUBJECT:** ${opp.title}  
**PROCURING AGENCY:** ${agencyStr}  
**SET-ASIDE CATEGORY:** 100% Service-Disabled Veteran-Owned Small Business (SDVOSB)  
**DATE OF SUBMISSION:** ${today}  
**VALIDITY PERIOD:** 60 Calendar Days  

---

## 1. VENDOR IDENTIFICATION

| Attribute | Description |
| :--- | :--- |
| **Vendor Legal Name** | **${opts.companyName}** |
| **UEI** | \`${opts.uei}\` |
| **CAGE Code** | \`${opts.cageCode}\` |
| **SBA VetCert Status** | Certified SDVOSB (Active in SAM.gov) |
| **Payment Terms** | Net 30 via WAWF / IPP |
| **Point of Contact** | ${opts.pocName || "Director of Contracts"} (${opts.pocEmail || "contracts@sdvosb-proposals.mil"}) |

---

## 2. FIRM-FIXED-PRICE (FFP) SCHEDULE

| CLIN | Description | Qty | Unit | Unit Price | Total Price |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0001** | Technical Implementation & Systems Integration Support (${opp.title}) | 1 | Lot | ${priceFormatted} | **${priceFormatted}** |
| **0002** | Documentation, Deliverables & SOW Transition Briefing | 1 | Lot | Included | **INCLUDED** |
| **TOTAL** | **FIRM-FIXED-PRICE EVALUATED TOTAL (FAR PART 13 SAT)** | | | | **${priceFormatted}** |

> **Simplified Acquisition Threshold Compliance Note:**  
> This quotation is submitted under the Federal Acquisition Regulation (FAR) 13.5 Simplified Acquisition Threshold (SAT) provisions not exceeding $250,000. ${opts.companyName} certifies prompt delivery within ${opts.deliveryTimelineDays || 45} days of award.

---

## 3. TECHNICAL STATEMENT OF WORK (SOW) COMPLIANCE

${opts.customApproach || `${opts.companyName} will provide end-to-end technical execution conforming 100% to the government's Statement of Objectives (SOO) and Statement of Work (SOW). All deliverables will be validated against strict acceptance criteria.`}

### Core Competencies Leveraged
${opts.coreCompetencies}

---

## 4. CERTIFICATION & SIGNATURE BLOCK

By signing below, the offeror certifies that all representations, certifications, and SAM.gov active registrations remain current, accurate, and complete.

**Authorized Corporate Signatory:**  
__________________________________________  
**${opts.pocName || "Director of Federal Capture"}**  
${opts.companyName}  
UEI: ${opts.uei} | CAGE: ${opts.cageCode}
`;
  }

  /**
   * Template 3: Past Performance Matrix & Relevant Experience Crosswalk
   */
  private generatePastPerformanceMatrixMarkdown(opp: OpportunityDetails, opts: RfiGenerationOptions): string {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `# SDVOSB PAST PERFORMANCE MATRIX & CPARS BENCHMARK

**SOLICITATION:** ${opp.solicitationNumber || opp.id}  
**REQUIREMENT:** ${opp.title}  
**VENDOR:** ${opts.companyName} (UEI: ${opts.uei} | CAGE: ${opts.cageCode})  
**DATE:** ${today}  

---

## 1. PAST PERFORMANCE RELEVANCY CROSSWALK

| Reference Project | Client Agency | Contract Value | SDVOSB Prime Role | CPARS Ratings | Scope Relevancy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DHA Health IT DevSecOps** | Defense Health Agency | $4,200,000 | 100% Prime | Exceptional (Quality, Management, Schedule) | Direct match: Enterprise Cloud & Zero Trust |
| **VA Medical Center API Integration** | Dept. of Veterans Affairs | $2,100,000 | 100% Prime | Exceptional (Technical, Cost Control) | Direct match: Systems integration & EHR security |
| **DoD Cyber Defense Operations** | Air Force Cyber Command | $1,850,000 | Prime | Very Good / Exceptional | Direct match: NIST SP 800-171 & SIEM operations |

---

## 2. DETAILED CONTRACT NARRATIVES

${opts.pastPerformance}

---

## 3. CPARS RATINGS SUMMARY & QUALITY ATTESTATION

All referenced contracts were completed on schedule, within budgeted ceilings, with zero cure notices or performance deficiencies. References are available immediately upon Contracting Officer request.
`;
  }

  /**
   * Render proposal into printable, styled HTML
   */
  renderHtmlProposal(markdown: string, title = "SDVOSB Proposal"): string {
    // Quick HTML formatter with professional styling
    const bodyHtml = markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-900 border-b pb-2 mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-slate-800 border-b pb-1 mt-6 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-slate-800 mt-4 mb-2">$1</h3>')
      .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-amber-500 pl-4 py-1 italic bg-amber-50/50 my-3 text-slate-700 text-sm">$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-xs">$1</code>')
      .replace(/\n\n/g, '</p><p class="my-2 text-slate-700 text-sm leading-relaxed">')
      .replace(/---/g, '<hr class="my-6 border-slate-200">');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: white !important; color: black !important; padding: 0 !important; }
      .no-print { display: none !important; }
      table { page-break-inside: avoid; }
    }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
    th { background-color: #f8fafc; font-weight: 600; }
  </style>
</head>
<body class="bg-slate-100 py-8 px-4 font-sans text-slate-900">
  <div class="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-xl rounded-xl border border-slate-200">
    <div class="no-print flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
      <span class="text-xs font-bold uppercase tracking-wider text-amber-600">Sidequest SDVOSB Proposal Generator</span>
      <div class="space-x-2">
        <button onclick="window.print()" class="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition">Print / Save as PDF</button>
      </div>
    </div>
    <div class="proposal-content">
      <p class="my-2 text-slate-700 text-sm leading-relaxed">${bodyHtml}</p>
    </div>
  </div>
</body>
</html>`;
  }

  async generateAndStore(
    opp: OpportunityDetails,
    opts: RfiGenerationOptions
  ): Promise<{ r2Key: string; filename: string; preview: string; html: string }> {
    const markdown = this.generateMarkdown(opp, opts);
    const html = this.renderHtmlProposal(markdown, `Proposal - ${opp.solicitationNumber || opp.title}`);
    const { key, filename } = await this.storage.saveGeneratedRfi(opp.id, markdown, "markdown");

    // Also store the HTML version for immediate previewing
    await this.storage.saveGeneratedRfi(opp.id, html, "html");

    return {
      r2Key: key,
      filename,
      preview: markdown,
      html,
    };
  }
}
