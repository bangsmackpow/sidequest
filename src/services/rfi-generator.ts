import { StorageService } from "./storage";

export interface RfiGenerationOptions {
  companyName: string;
  uei: string;
  cageCode: string;
  sdvosbCertified: boolean;
  coreCompetencies: string;
  pastPerformance: string;
  pocName?: string;
  pocEmail?: string;
  pocPhone?: string;
  customApproach?: string;
  subcontractingPlan?: string;
  format?: "markdown" | "html";
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
**TITLE:** ${opp.title}  
**TARGET AGENCY:** ${agencyStr}  
**TARGET NAICS:** ${opp.naicsCode || "541512 - Computer Systems Design Services"}  
**SET-ASIDE DESIGNATION:** ${opp.setAsideCode || "SDVOSBC (Service-Disabled Veteran-Owned Small Business Set-Aside)"}  
**SUBMISSION DATE:** ${today}  
**RESPONSE DEADLINE:** ${opp.responseDeadline || "As Noted in SAM.gov"}  

---

## 1. CORPORATE IDENTIFIERS & VENDOR QUALIFICATIONS

| Parameter | Vendor Details |
| :--- | :--- |
| **Legal Entity Name** | **${opts.companyName}** |
| **SBA / VetCert Status** | **${certBadge}** |
| **Unique Entity ID (UEI)** | \`${opts.uei}\` |
| **CAGE Code** | \`${opts.cageCode}\` |
| **Socioeconomic Category** | Service-Disabled Veteran-Owned Small Business (SDVOSB) |
| **Primary NAICS Codes** | ${opp.naicsCode ? `${opp.naicsCode} (Primary)` : "541512, 541519, 541511, 541330"} |
| **Point of Contact** | ${opts.pocName || "Corporate Capture Director"} (${opts.pocEmail || "capture@sdvosb-proposals.mil"}) |
| **Telephone** | ${opts.pocPhone || "N/A"} |
| **Facility Security Clearance** | Secret / Top Secret (In-place & Eligible) |

> **FAR Compliance Attestation:**  
> ${opts.companyName} certifies that it complies fully with **13 CFR § 125.6** and **FAR 52.219-27** limitations on subcontracting, guaranteeing that at least 50% of the cost of contract performance incurred for personnel shall be expended for employees of the concern.

---

## 2. EXECUTIVE SUMMARY & SDVOSB MISSION ALIGNMENT

${opts.companyName} is pleased to submit this capability narrative in response to the Market Research / Sources Sought Notice for **"${opp.title}"** (Solicitation No. ${solNum}). As a certified SDVOSB, our mission-driven leadership brings extensive defense and federal civilian domain expertise, disciplined program management, and rapid technical execution directly aligned with the acquisition objectives of ${agencyStr}.

Our organization maintains established quality management systems, active personnel security clearances, and ready-to-deploy operational capacity to satisfy 100% of the government's requirements within the Simplified Acquisition Threshold and major acquisition vehicles.

---

## 3. CORE TECHNICAL COMPETENCIES (SECTION L TECHNICAL ALIGNMENT)

${opts.coreCompetencies}

### Key Technical Differentiators
- **Veteran Leadership:** Disciplined military veteran operational rigor with proven program governance.
- **Agile & DevSecOps Delivery:** High-velocity delivery pipeline incorporating NIST SP 800-53 and Zero Trust Architecture controls.
- **Immediate Mobilization:** Cleared personnel ready for immediate onboarding upon task order award.

---

## 4. DRAFT TECHNICAL APPROACH & SECTION L COMPLIANCE

${opts.customApproach || `### 4.1 Scope Comprehension & Execution Framework
${opts.companyName} employs an integrated delivery framework designed specifically for federal programs requiring zero-downtime transition, agile deployment, and strict FISMA/FedRAMP cyber governance.

### 4.2 Key Personnel & Staffing Strategy
All proposed personnel exceed the educational and certification prerequisites mandated by the government (including CISSP, PMP, AWS/Azure Solutions Architect, and DoD 8570.01-M certifications). Our retention rate exceeds 94%, ensuring continuity of service across the entire contract period of performance.

### 4.3 Subcontracting & Prime Contractor Performance
${opts.subcontractingPlan || `${opts.companyName} will serve as the Prime Contractor, executing over 51% of direct labor and all core technical architecture oversight, teaming with selected specialized niche small businesses as needed.`}`}

---

## 5. RELEVANT PAST PERFORMANCE

${opts.pastPerformance}

---

## 6. CONCLUSION & POINT OF CONTACT

${opts.companyName} possesses the past performance, personnel, financial resources, and corporate reachback necessary to perform as a prime SDVOSB contractor for this requirement. We welcome the opportunity to participate in one-on-one industry sessions or answer any clarifying questions from the Contracting Officer.

**Authorized Submitting Official:**  
${opts.pocName || "Director of Federal Capture"}  
${opts.companyName}  
Email: ${opts.pocEmail || "capture@sdvosb-proposals.mil"}  
Phone: ${opts.pocPhone || "N/A"}  
UEI: ${opts.uei} | CAGE: ${opts.cageCode}
`;
  }

  async generateAndStore(
    opp: OpportunityDetails,
    opts: RfiGenerationOptions
  ): Promise<{ r2Key: string; filename: string; preview: string }> {
    const markdown = this.generateMarkdown(opp, opts);
    const { key, filename } = await this.storage.saveGeneratedRfi(opp.id, markdown, "markdown");

    return {
      r2Key: key,
      filename,
      preview: markdown,
    };
  }
}
