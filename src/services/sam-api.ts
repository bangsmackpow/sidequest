export interface SamGovNotice {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  fullParentPathCode?: string;
  department?: string;
  subTier?: string;
  office?: string;
  postedDate?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  typeOfSetAside?: string;
  type?: string;
  uiLink?: string;
  pointOfContact?: Array<{
    email?: string;
    fullName?: string;
    type?: string;
    phone?: string;
  }>;
  resourceLinks?: string[];
  description?: string;
  award?: {
    amount?: number;
    date?: string;
    number?: string;
    awardee?: {
      name?: string;
      ueiSAM?: string;
      cageCode?: string;
    };
  };
}

/**
 * Extracts agency, subTier, and contracting office from SAM.gov v2 fullParentPathName or legacy fields
 */
export function parseSamAgencyHierarchy(notice: SamGovNotice): {
  agency: string;
  subTier: string | null;
  office: string | null;
} {
  if (notice.department && notice.department !== "FEDERAL AGENCY") {
    return {
      agency: notice.department,
      subTier: notice.subTier || null,
      office: notice.office || null,
    };
  }
  if (notice.fullParentPathName) {
    const parts = notice.fullParentPathName
      .split(".")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return {
        agency: parts[0],
        subTier: parts.length > 1 ? parts[1] : null,
        office: parts.length > 2 ? parts.slice(2).join(" / ") : parts[1] || null,
      };
    }
  }
  return {
    agency: notice.department || "FEDERAL AGENCY",
    subTier: notice.subTier || null,
    office: notice.office || null,
  };
}

export interface SamSearchParams {
  apiKey?: string;
  postedFrom: string; // MM/dd/yyyy
  postedTo: string; // MM/dd/yyyy
  limit?: number;
  ptype?: string; // e.g. "p,r,k,o,s,a"
  typeOfSetAside?: string; // e.g. "SDVOSBC"
  naicsCode?: string;
  offset?: number;
}

export interface SamApiResponse {
  totalRecords: number;
  opportunitiesData?: SamGovNotice[];
  message?: string;
}

export class SamGovClient {
  private baseUrl = "https://api.sam.gov/opportunities/v2/search";

  constructor(private apiKey?: string) {}

  /**
   * Search SAM.gov opportunities with quota-aware single-batch retrieval and 429 fallback
   */
  async fetchOpportunities(params: Omit<SamSearchParams, "apiKey">): Promise<{
    notices: SamGovNotice[];
    totalRecords: number;
    quotaThrottled?: boolean;
    nextAccessTime?: string;
  }> {
    if (!this.apiKey) {
      console.warn("SAM_GOV_API_KEY not configured. Generating realistic mock SDVOSB notices for dev/demo.");
      return this.getMockOpportunities(params);
    }

    const allNotices: SamGovNotice[] = [];
    let offset = params.offset || 0;
    const limit = params.limit || 100;
    let totalRecords = 0;
    const maxSafetyPages = 1; // Single 100-record batch per sync to preserve SAM.gov daily API quota

    for (let page = 0; page < maxSafetyPages; page++) {
      const url = new URL(this.baseUrl);
      url.searchParams.set("api_key", this.apiKey);
      url.searchParams.set("postedFrom", params.postedFrom);
      url.searchParams.set("postedTo", params.postedTo);
      url.searchParams.set("limit", limit.toString());
      url.searchParams.set("offset", offset.toString());

      if (params.ptype) {
        url.searchParams.set("ptype", params.ptype);
      }
      if (params.typeOfSetAside) {
        url.searchParams.set("typeOfSetAside", params.typeOfSetAside);
      }
      if (params.naicsCode) {
        url.searchParams.set("ncode", params.naicsCode);
      }

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "Sidequest-SDVOSB-Ingest/1.0",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 429) {
          let nextAccess = "Next UTC Midnight";
          try {
            const parsed = JSON.parse(errorText);
            if (parsed.nextAccessTime) nextAccess = parsed.nextAccessTime;
          } catch {
            // ignore
          }
          console.warn(
            `[SAM.gov Quota Guard] Daily API rate limit reached (429). Next reset: ${nextAccess}. Preserving existing live database records without injecting mock data.`
          );
          return {
            notices: [],
            totalRecords: 0,
            quotaThrottled: true,
            nextAccessTime: nextAccess,
          };
        }
        throw new Error(`SAM.gov API error (${res.status}): ${errorText}`);
      }

      const data = (await res.json()) as SamApiResponse;
      totalRecords = data.totalRecords || 0;
      const notices = data.opportunitiesData || [];

      allNotices.push(...notices);

      if (allNotices.length >= totalRecords || notices.length < limit) {
        break;
      }

      offset += limit;
    }

    return {
      notices: allNotices,
      totalRecords,
    };
  }

  /**
   * Format Date object into MM/dd/yyyy required by SAM.gov
   */
  static formatSamDate(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  /**
   * Realistic SDVOSB opportunities for local testing and sandbox operation
   */
  private getMockOpportunities(params: Omit<SamSearchParams, "apiKey">): {
    notices: SamGovNotice[];
    totalRecords: number;
  } {
    const mockNotices: SamGovNotice[] = [
      {
        noticeId: "sam-sdvosb-9901-cyber",
        title: "Enterprise Cybersecurity Zero Trust Architecture Implementation",
        solicitationNumber: "HT0011-26-R-0042",
        department: "DEPARTMENT OF DEFENSE",
        subTier: "DEFENSE HEALTH AGENCY",
        office: "DHA FALLS CHURCH VA",
        postedDate: new Date().toISOString().split("T")[0],
        responseDeadLine: new Date(Date.now() + 14 * 86400000).toISOString(),
        naicsCode: "541512",
        typeOfSetAside: "SDVOSBC",
        type: "r", // Sources Sought
        uiLink: "https://sam.gov/opp/sam-sdvosb-9901-cyber/view",
        pointOfContact: [
          {
            email: "co.defensehealth@dha.mil",
            fullName: "Maj. Marcus Bennett (KO)",
            type: "primary",
            phone: "703-555-0199",
          },
          {
            email: "osdbu.advocate@dha.mil",
            fullName: "elena.rostova@dha.mil (OSDBU Small Business Specialist)",
            type: "secondary",
            phone: "703-555-0140",
          },
        ],
        resourceLinks: [
          "https://sam.gov/api/prod/opps/v3/opportunities/resources/files/PWS_Zero_Trust_DHA_2026.pdf",
        ],
        description: "Sources Sought notice to identify SDVOSB firms capable of deploying Zero Trust architecture across clinical health networks. Response requires capability statement and past performance matrix.",
      },
      {
        noticeId: "sam-sdvosb-9902-sat-cloud",
        title: "Cloud Infrastructure DevSecOps Support - Simplified Acquisition",
        solicitationNumber: "36C10B26Q0188",
        department: "VETERANS AFFAIRS, DEPARTMENT OF",
        subTier: "VETERANS HEALTH ADMINISTRATION",
        office: "OIT AUSTIN AUTOMATION CENTER",
        postedDate: new Date().toISOString().split("T")[0],
        responseDeadLine: new Date(Date.now() + 7 * 86400000).toISOString(),
        naicsCode: "541519",
        typeOfSetAside: "SDVOSBC",
        type: "k", // Combined Synopsis / Solicitation (FAR Part 12/13 SAT)
        uiLink: "https://sam.gov/opp/sam-sdvosb-9902-sat-cloud/view",
        pointOfContact: [
          {
            email: "sarah.jenkins.va@va.gov",
            fullName: "Sarah Jenkins, Contract Specialist",
            type: "primary",
            phone: "512-555-0143",
          },
        ],
        resourceLinks: [
          "https://sam.gov/api/prod/opps/v3/opportunities/resources/files/RFQ_36C10B26Q0188_SOW.pdf",
        ],
        description: "Commercial item combined synopsis/solicitation ($195,000 threshold) set aside 100% for Service-Disabled Veteran-Owned Small Businesses. Kubernetes and Terraform automation.",
      },
      {
        noticeId: "sam-sdvosb-9903-ai-analytics",
        title: "Predictive Healthcare Analytics & Machine Learning Support",
        solicitationNumber: "VA-26-R-0891",
        department: "VETERANS AFFAIRS, DEPARTMENT OF",
        subTier: "STRATEGIC ACQUISITION CENTER (SAC)",
        office: "SAC FREDERICK MD",
        postedDate: new Date().toISOString().split("T")[0],
        responseDeadLine: new Date(Date.now() + 21 * 86400000).toISOString(),
        naicsCode: "541511",
        typeOfSetAside: "SDVOSBC",
        type: "r", // Sources Sought / RFI
        uiLink: "https://sam.gov/opp/sam-sdvosb-9903-ai-analytics/view",
        pointOfContact: [
          {
            email: "sac.contracting@va.gov",
            fullName: "Robert Cole, Contracting Officer",
            type: "primary",
            phone: "240-555-0177",
          },
        ],
        description: "RFI: Seeking SDVOSB vendor capabilities for predictive clinical outcomes modeling and veteran suicide prevention data engineering pipelines.",
      },
      {
        noticeId: "sam-sdvosb-9908-rule-of-two",
        title: "Tactical Edge Cloud & Automated Telemetry Pipeline (Market Research)",
        solicitationNumber: "W15P7T-26-R-0114",
        department: "DEPT OF DEFENSE",
        subTier: "DEPT OF THE ARMY",
        office: "W6QK ACC-APG ABERDEEN PROVING GROUND",
        postedDate: new Date().toISOString().split("T")[0],
        responseDeadLine: new Date(Date.now() + 10 * 86400000).toISOString(),
        naicsCode: "541512",
        typeOfSetAside: "SBA", // Currently Total Small Business — prime target for SDVOSB Rule-of-Two conversion!
        type: "r", // Sources Sought
        uiLink: "https://sam.gov/opp/sam-sdvosb-9908-rule-of-two/view",
        pointOfContact: [
          {
            email: "army.apg.contracting@army.mil",
            fullName: "Capt. David Thorne (KO)",
            type: "primary",
            phone: "410-555-0188",
          },
          {
            email: "apg.osbp@army.mil",
            fullName: "Marcus Sterling (Army OSBP Small Business Advisor)",
            type: "secondary",
            phone: "410-555-0192",
          },
        ],
        description: "Sources Sought Notice for market research. The Government is evaluating whether to set this acquisition aside for Service-Disabled Veteran-Owned Small Businesses (SDVOSB) under FAR 19.1405 Rule of Two if two or more qualified SDVOSBs respond.",
      },
      {
        noticeId: "sam-sdvosb-9909-sole-source",
        title: "Special Notice: Intent to Sole Source SDVOSB Cyber Rapid Response (FAR 19.1406)",
        solicitationNumber: "36C10B26N0401",
        department: "VETERANS AFFAIRS, DEPARTMENT OF",
        subTier: "TECHNOLOGY ACQUISITION CENTER (TAC)",
        office: "TAC EATONTOWN NJ",
        postedDate: new Date().toISOString().split("T")[0],
        responseDeadLine: new Date(Date.now() + 5 * 86400000).toISOString(),
        naicsCode: "541519",
        typeOfSetAside: "SDVOSBS",
        type: "s", // Special Notice / Sole Source Intent
        uiLink: "https://sam.gov/opp/sam-sdvosb-9909-sole-source/view",
        pointOfContact: [
          {
            email: "tac.solesource@va.gov",
            fullName: "Diana Vance, Senior Contracting Officer",
            type: "primary",
            phone: "732-555-0164",
          },
        ],
        description: "Notice of Intent to award a Sole Source SDVOSB contract under VAAR 819.7007 / FAR 19.1406 ($3.8M ceiling) for rapid vulnerability remediation.",
      },
      {
        noticeId: "sam-sdvosb-9910-award-notice",
        title: "AWARD NOTICE: Enterprise EHR Data Migration & Cloud Security Support",
        solicitationNumber: "36C10B25C0911",
        department: "VETERANS AFFAIRS, DEPARTMENT OF",
        subTier: "VETERANS HEALTH ADMINISTRATION",
        office: "STRATEGIC ACQUISITION CENTER",
        postedDate: new Date().toISOString().split("T")[0],
        responseDeadLine: new Date(Date.now() + 365 * 86400000).toISOString(),
        naicsCode: "541512",
        typeOfSetAside: "SDVOSBC",
        type: "a", // Award Notice
        uiLink: "https://sam.gov/opp/sam-sdvosb-9910-award-notice/view",
        pointOfContact: [
          {
            email: "sac.awards@va.gov",
            fullName: "Thomas Wright, Contracting Officer",
            type: "primary",
            phone: "540-555-0122",
          },
        ],
        award: {
          amount: 14850000,
          date: new Date().toISOString().split("T")[0],
          number: "36C10B26C0044",
          awardee: {
            name: "APEX FEDERAL INTEGRATORS LLC",
            ueiSAM: "APX998877665",
            cageCode: "7KLP2",
          },
        },
        description: "Contract Award Notice ($14.85M). Prime contractor seeks additional VetCert SDVOSB subcontractors for regional VISN rollout under 13 CFR 125.6 similarly situated entity provisions.",
      },
    ];

    return {
      notices: mockNotices,
      totalRecords: mockNotices.length,
    };
  }
}
