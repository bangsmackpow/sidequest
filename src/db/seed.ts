import { createDb } from "./index";
import {
  users,
  accounts,
  organizations,
  members,
  savedSearchProfiles,
  capabilityStatements,
  opportunities,
  opportunityNotes,
  opportunityAttachments,
} from "./schema";
import { StorageService } from "../services/storage";
import { hashPassword } from "better-auth/crypto";

export async function seedDatabase(d1: D1Database, bucket?: R2Bucket) {
  const db = createDb(d1);
  const storage = bucket ? new StorageService(bucket) : null;

  console.log("[Seed] Initializing SDVOSB multi-tenant demonstration data...");

  // 1. Create Organization
  const orgId = "org_demo_sdvosb";
  await db
    .insert(organizations)
    .values({
      id: orgId,
      name: "VALIANT VETERAN DEFENSE TECHNOLOGIES LLC",
      slug: "valiant-defense-sdvosb",
      logo: null,
      metadata: JSON.stringify({
        sbaCertification: "SDVOSB-2024-CERT-8841",
        vetCertStatus: "Verified",
        headquarters: "Reston, VA",
      }),
    })
    .onConflictDoNothing();

  // 2. Create Users, Credentials & Memberships
  const adminPasswordHash = await hashPassword("AdminSDVOSB!2026#Secure");
  const managerPasswordHash = await hashPassword("MarcusSDVOSB!2026#Secure");
  const memberPasswordHash = await hashPassword("SarahSDVOSB!2026#Secure");

  const seedUsers = [
    {
      id: "user_curtis_admin",
      name: "Curtis (Platform Administrator)",
      email: "admin@sdvosb-proposals.mil",
      role: "admin" as const,
      passwordHash: adminPasswordHash,
      // Fresh user created recently within the 3-day grace period
      createdAt: new Date(),
    },
    {
      id: "user_marcus_mgr",
      name: "Marcus Vance (Proposal Director)",
      email: "m.vance@valiantdefense.mil",
      role: "manager" as const,
      passwordHash: managerPasswordHash,
      createdAt: new Date(Date.now() - 1 * 86400000), // 1 day ago
    },
    {
      id: "user_sarah_member",
      name: "Sarah Miller (Capture Analyst)",
      email: "s.miller@valiantdefense.mil",
      role: "member" as const,
      passwordHash: memberPasswordHash,
      createdAt: new Date(Date.now() - 4 * 86400000), // 4 days ago (grace period expired demo)
    },
  ];

  for (const u of seedUsers) {
    await db
      .insert(users)
      .values({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: true,
        twoFactorEnabled: false,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: u.name,
          email: u.email,
          role: u.role,
        },
      });

    // Create / update account for email & password authentication
    await db
      .insert(accounts)
      .values({
        id: `acc_${u.id}`,
        userId: u.id,
        accountId: u.email,
        providerId: "credential",
        password: u.passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: accounts.id,
        set: {
          password: u.passwordHash,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(members)
      .values({
        id: `mem_${u.id}`,
        organizationId: orgId,
        userId: u.id,
        role: u.role,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: members.id,
        set: {
          role: u.role,
        },
      });
  }

  // 3. Create Capability Statement
  const capId = "cap_master_sdvosb_cyber";
  await db
    .insert(capabilityStatements)
    .values({
      id: capId,
      organizationId: orgId,
      title: "Master SDVOSB Enterprise Cloud & Zero Trust Cyber Profile",
      dunsUei: "VET876543210",
      cageCode: "9ABC4",
      sdvosbCertified: true,
      coreCompetencies: `- **Zero Trust Architecture (ZTA):** NIST SP 800-207, ICAM, and micro-segmentation for Defense Health clinical networks.
- **Enterprise GovCloud & DevSecOps:** Automated AWS/Azure GovCloud CI/CD pipelines compliant with DoD IL5/IL6.
- **Continuous Cyber Defense:** CMMC Level 2, NIST SP 800-171, and SIEM security automation.`,
      pastPerformance: `### Contract 1: Defense Health Enterprise DevSecOps
- **Agency:** Defense Health Agency (DHA) | Contract: HT0011-23-C-0019
- **Value:** $4,200,000 (Prime SDVOSB) | CPARS: Exceptional

### Contract 2: VA Medical Center Interoperability Gateway
- **Agency:** Department of Veterans Affairs (VA) | Contract: 36C10B24C0082
- **Value:** $2,100,000 (Prime SDVOSB) | CPARS: Exceptional`,
    })
    .onConflictDoNothing();

  // 4. Create Saved Search Profiles
  const profiles = [
    {
      id: "prof_dha_va_healthit",
      name: "DHA & VA Health IT (Simplified Acquisition Focus)",
      naicsCodes: JSON.stringify(["541512", "541519"]),
      setAsides: JSON.stringify(["SDVOSBC", "SDVOSBS", "VOSBC"]),
      noticeTypes: JSON.stringify(["p", "r", "k", "o", "s", "a"]),
      maxValue: 250000, // SAT Threshold
      active: true,
    },
    {
      id: "prof_zero_trust_dod",
      name: "DoD Zero Trust & Rule-of-Two Set-Aside Shaping",
      naicsCodes: JSON.stringify(["541512", "541511"]),
      setAsides: JSON.stringify(["SDVOSBC", "SBA"]),
      noticeTypes: JSON.stringify(["r", "k", "o", "s"]),
      maxValue: null,
      active: true,
    },
  ];

  for (const p of profiles) {
    await db
      .insert(savedSearchProfiles)
      .values({
        id: p.id,
        organizationId: orgId,
        name: p.name,
        naicsCodes: p.naicsCodes,
        setAsides: p.setAsides,
        noticeTypes: p.noticeTypes,
        pscCodes: "[]",
        maxValue: p.maxValue,
        active: p.active,
      })
      .onConflictDoNothing();
  }

  // 5. Create Realistic SDVOSB Opportunities across all Kanban stages
  const oppData = [
    {
      id: "sam-sdvosb-9901-cyber",
      solicitationNumber: "HT0011-26-R-0042",
      title: "Enterprise Cybersecurity Zero Trust Architecture Implementation",
      agency: "DEPARTMENT OF DEFENSE",
      subTier: "DEFENSE HEALTH AGENCY",
      office: "DHA FALLS CHURCH VA",
      postedDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() + 12 * 86400000).toISOString(),
      naicsCode: "541512",
      setAsideCode: "SDVOSBC",
      noticeType: "r",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9901-cyber/view",
      pointOfContactEmail: "co.defensehealth@dha.mil",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9901-cyber.json",
      status: "new",
    },
    {
      id: "sam-sdvosb-9904-telehealth",
      solicitationNumber: "36C24226Q0319",
      title: "Veterans Telehealth Remote Patient Monitoring Infrastructure Modernization",
      agency: "VETERANS AFFAIRS, DEPARTMENT OF",
      subTier: "VETERANS INTEGRATED SERVICE NETWORK 2",
      office: "242-NETWORK CONTRACT OFFICE 02",
      postedDate: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() + 18 * 86400000).toISOString(),
      naicsCode: "541512",
      setAsideCode: "SDVOSBC",
      noticeType: "r",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9904-telehealth/view",
      pointOfContactEmail: "visn2.contracting@va.gov",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9904-telehealth.json",
      status: "new",
    },
    {
      id: "sam-sdvosb-9902-sat-cloud",
      solicitationNumber: "36C10B26Q0188",
      title: "Cloud Infrastructure DevSecOps Support - Simplified Acquisition ($195k)",
      agency: "VETERANS AFFAIRS, DEPARTMENT OF",
      subTier: "VETERANS HEALTH ADMINISTRATION",
      office: "OIT AUSTIN AUTOMATION CENTER",
      postedDate: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      naicsCode: "541519",
      setAsideCode: "SDVOSBC",
      noticeType: "o",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9902-sat-cloud/view",
      pointOfContactEmail: "sarah.jenkins.va@va.gov",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9902-sat-cloud.json",
      status: "reviewing_sow",
    },
    {
      id: "sam-sdvosb-9905-fhir",
      solicitationNumber: "HT0011-26-Q-0089",
      title: "Fast Healthcare Interoperability Resources (FHIR) API Gateway Engineering",
      agency: "DEPARTMENT OF DEFENSE",
      subTier: "DEFENSE HEALTH AGENCY",
      office: "DHA AURORA CO",
      postedDate: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() + 9 * 86400000).toISOString(),
      naicsCode: "541511",
      setAsideCode: "SDVOSBC",
      noticeType: "o",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9905-fhir/view",
      pointOfContactEmail: "dha.fhir.co@dha.mil",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9905-fhir.json",
      status: "reviewing_sow",
    },
    {
      id: "sam-sdvosb-9903-ai-analytics",
      solicitationNumber: "VA-26-R-0891",
      title: "Predictive Healthcare Analytics & Machine Learning Support",
      agency: "VETERANS AFFAIRS, DEPARTMENT OF",
      subTier: "STRATEGIC ACQUISITION CENTER (SAC)",
      office: "SAC FREDERICK MD",
      postedDate: new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() + 8 * 86400000).toISOString(),
      naicsCode: "541511",
      setAsideCode: "SDVOSBC",
      noticeType: "r",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9903-ai-analytics/view",
      pointOfContactEmail: "sac.contracting@va.gov",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9903-ai-analytics.json",
      status: "drafting_rfi",
    },
    {
      id: "sam-sdvosb-9906-cmmc",
      solicitationNumber: "SP4709-26-Q-0055",
      title: "DoD CMMC Level 2 Readiness & Continuous Vulnerability Monitoring",
      agency: "DEFENSE LOGISTICS AGENCY",
      subTier: "DLA INFORMATION OPERATIONS",
      office: "DLA CONTRACTING SERVICES PHILADELPHIA",
      postedDate: new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() - 1 * 86400000).toISOString(),
      naicsCode: "541519",
      setAsideCode: "SDVOSBC",
      noticeType: "o",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9906-cmmc/view",
      pointOfContactEmail: "dla.cmmc.ko@dla.mil",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9906-cmmc.json",
      status: "submitted",
    },
    {
      id: "sam-sdvosb-9907-cloud-mig",
      solicitationNumber: "FA4890-25-C-0021",
      title: "Air Force Cyber Defense Cloud Migration Task Order (Simplified Acquisition)",
      agency: "DEPARTMENT OF DEFENSE",
      subTier: "DEPARTMENT OF THE AIR FORCE",
      office: "AIR COMBAT COMMAND ACC CONS",
      postedDate: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() - 10 * 86400000).toISOString(),
      naicsCode: "541512",
      setAsideCode: "SDVOSBC",
      noticeType: "o",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9907-cloud-mig/view",
      pointOfContactEmail: "acc.cons@us.af.mil",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9907-cloud-mig.json",
      status: "won",
    },
    {
      id: "sam-sdvosb-9908-rule-of-two",
      solicitationNumber: "W15P7T-26-R-0114",
      title: "Tactical Edge Cloud & Automated Telemetry Pipeline (Market Research)",
      agency: "DEPT OF DEFENSE",
      subTier: "DEPT OF THE ARMY",
      office: "W6QK ACC-APG ABERDEEN PROVING GROUND",
      postedDate: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      naicsCode: "541512",
      setAsideCode: "SBA",
      noticeType: "r",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9908-rule-of-two/view",
      pointOfContactEmail: "army.apg.contracting@army.mil",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9908-rule-of-two.json",
      status: "new",
    },
    {
      id: "sam-sdvosb-9909-sole-source",
      solicitationNumber: "36C10B26N0401",
      title: "Special Notice: Intent to Sole Source SDVOSB Cyber Rapid Response (FAR 19.1406)",
      agency: "VETERANS AFFAIRS, DEPARTMENT OF",
      subTier: "TECHNOLOGY ACQUISITION CENTER (TAC)",
      office: "TAC EATONTOWN NJ",
      postedDate: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      responseDeadline: new Date(Date.now() + 6 * 86400000).toISOString(),
      naicsCode: "541519",
      setAsideCode: "SDVOSBS",
      noticeType: "s",
      uiLink: "https://sam.gov/opp/sam-sdvosb-9909-sole-source/view",
      pointOfContactEmail: "tac.solesource@va.gov",
      rawJsonR2Key: "raw/opportunities/sam-sdvosb-9909-sole-source.json",
      status: "drafting_rfi",
    },
  ];

  for (const opp of oppData) {
    await db
      .insert(opportunities)
      .values(opp)
      .onConflictDoNothing();

    // If storage is provided, save raw JSON to mock R2
    if (storage) {
      await storage.saveRawOpportunityJson(opp.id, opp);
    }
  }

  // 6. Seed Inbound Contracting Officer correspondence & capture notes
  const notesData = [
    {
      id: "note_co_dha_update",
      opportunityId: "sam-sdvosb-9901-cyber",
      authorEmail: "Maj. Marcus Bennett (KO) <co.defensehealth@dha.mil>",
      subject: "RE: Sources Sought HT0011-26-R-0042 - Industry Clarifications",
      content: `Good afternoon Industry Partners,

We have received several inquiries regarding the required facility security clearance. Please be advised that an active Secret clearance is mandatory at the time of award, and Top Secret clearance eligibility is desired for key personnel. Responses remain due on the posted deadline.

Respectfully,
Maj. Marcus Bennett
Contracting Officer, Defense Health Agency`,
      source: "email",
    },
    {
      id: "note_strategy_cyber",
      opportunityId: "sam-sdvosb-9901-cyber",
      authorEmail: "admin@sdvosb-proposals.mil",
      subject: "Capture Strategy: Teaming & Past Performance Positioning",
      content: `Our DHA CPARS ratings from the HT0011-23-C-0019 contract position us as an undisputed Tier-1 prime candidate. We will highlight our 100% veteran-staffed Zero Trust engineering cell and FAR 52.219-27 compliance.`,
      source: "user",
    },
    {
      id: "note_co_va_sat",
      opportunityId: "sam-sdvosb-9902-sat-cloud",
      authorEmail: "Sarah Jenkins, Contract Specialist <sarah.jenkins.va@va.gov>",
      subject: "Solicitation 36C10B26Q0188 - Simplified Acquisition Threshold Notice",
      content: `This commercial item acquisition is 100% set aside for SDVOSBs under FAR 13.5 simplified acquisition threshold procedures ($195,000 ceiling). Quotes must include your active SAM.gov UEI and SBA VetCert verification.`,
      source: "email",
    },
    {
      id: "note_poc_dir_9901",
      opportunityId: "sam-sdvosb-9901-cyber",
      authorEmail: "co.defensehealth@dha.mil",
      subject: "Contracting Officer & OSDBU Contact Directory (HT0011-26-R-0042)",
      content: `Procuring Office: DEPARTMENT OF DEFENSE / DEFENSE HEALTH AGENCY / DHA FALLS CHURCH VA\n\nRegistered Points of Contact:\n1. Maj. Marcus Bennett (KO) (PRIMARY) — Email: co.defensehealth@dha.mil | Phone: 703-555-0199\n2. Elena Rostova (DHA OSDBU Small Business Specialist) (SECONDARY) — Email: osdbu.advocate@dha.mil | Phone: 703-555-0140`,
      source: "poc_directory",
    },
    {
      id: "note_poc_dir_9908",
      opportunityId: "sam-sdvosb-9908-rule-of-two",
      authorEmail: "army.apg.contracting@army.mil",
      subject: "Contracting Officer & OSDBU Contact Directory (W15P7T-26-R-0114)",
      content: `Procuring Office: DEPT OF DEFENSE / DEPT OF THE ARMY / W6QK ACC-APG ABERDEEN PROVING GROUND\n\nRegistered Points of Contact:\n1. Capt. David Thorne (KO) (PRIMARY) — Email: army.apg.contracting@army.mil | Phone: 410-555-0188\n2. Marcus Sterling (Army OSBP Small Business Advisor) (SECONDARY) — Email: apg.osbp@army.mil | Phone: 410-555-0192`,
      source: "poc_directory",
    },
    {
      id: "note_amendment_9902",
      opportunityId: "sam-sdvosb-9902-sat-cloud",
      authorEmail: "amendment-watcher@sdvosb-platform.internal",
      subject: "⚠️ Solicitation Amendment / Lifecycle Update (36C10B26Q0188)",
      content: `Detected official SAM.gov modification on solicitation 36C10B26Q0188:\n• Lifecycle Notice Type transitioned from [R] ➔ [K]\n• Response Deadline extended by 72 hours per Amendment 0001 (Q&A responses posted)`,
      source: "amendment",
    },
  ];

  for (const note of notesData) {
    await db
      .insert(opportunityNotes)
      .values({
        id: note.id,
        opportunityId: note.opportunityId,
        organizationId: orgId,
        authorEmail: note.authorEmail,
        subject: note.subject,
        content: note.content,
        source: note.source,
      })
      .onConflictDoNothing();
  }

  // 7. Seed Attachments
  const attachmentsData = [
    {
      id: "att_sow_9901",
      opportunityId: "sam-sdvosb-9901-cyber",
      filename: "PWS_Zero_Trust_Architecture_v1.2.pdf",
      r2Key: "attachments/sam-sdvosb-9901-cyber/PWS_Zero_Trust_Architecture_v1.2.pdf",
      contentType: "application/pdf",
      parsedText: "Performance Work Statement for Defense Health Agency Zero Trust Architecture Implementation.",
    },
    {
      id: "att_rfq_9902",
      opportunityId: "sam-sdvosb-9902-sat-cloud",
      filename: "RFQ_36C10B26Q0188_Cloud_DevSecOps.pdf",
      r2Key: "attachments/sam-sdvosb-9902-sat-cloud/RFQ_36C10B26Q0188_Cloud_DevSecOps.pdf",
      contentType: "application/pdf",
      parsedText: "Request for Quotation for VA Austin Automation Center Cloud DevSecOps Support under FAR Part 13.",
    },
  ];

  for (const att of attachmentsData) {
    await db
      .insert(opportunityAttachments)
      .values(att)
      .onConflictDoNothing();
  }

  console.log("[Seed] Demonstration data successfully loaded with hashed credentials!");
}
