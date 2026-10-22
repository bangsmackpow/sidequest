export interface SamGovNotice {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
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
  };
}

export interface SamSearchParams {
  apiKey?: string;
  postedFrom: string; // MM/dd/yyyy
  postedTo: string; // MM/dd/yyyy
  limit?: number;
  ptype?: string; // e.g. "r,o"
  typeOfSetAside?: string; // e.g. "SDVOSBC"
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
   * Search SAM.gov opportunities with pagination
   */
  async fetchOpportunities(params: Omit<SamSearchParams, "apiKey">): Promise<{
    notices: SamGovNotice[];
    totalRecords: number;
  }> {
    if (!this.apiKey) {
      console.warn("SAM_GOV_API_KEY not configured. Generating realistic mock SDVOSB notices for dev/demo.");
      return this.getMockOpportunities(params);
    }

    const allNotices: SamGovNotice[] = [];
    let offset = params.offset || 0;
    const limit = params.limit || 100;
    let totalRecords = 0;
    const maxSafetyPages = 5; // Prevent runaway worker timeouts on large ranges

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

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "Sidequest-SDVOSB-Ingest/1.0",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
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
        type: "o", // Solicitation / Combined Synopsis
        uiLink: "https://sam.gov/opp/sam-sdvosb-9902-sat-cloud/view",
        pointOfContact: [
          {
            email: "sarah.jenkins.va@va.gov",
            fullName: "Sarah Jenkins, Contract Specialist",
            type: "primary",
            phone: "512-555-0143",
          },
        ],
        description: "Commercial item simplified acquisition ($195,000 threshold) set aside 100% for Service-Disabled Veteran-Owned Small Businesses. Kubernetes and Terraform automation.",
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
    ];

    return {
      notices: mockNotices,
      totalRecords: mockNotices.length,
    };
  }
}
