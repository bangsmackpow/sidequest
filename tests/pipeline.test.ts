import { test, describe } from "node:test";
import assert from "node:assert";
import { SamGovClient } from "../src/services/sam-api";
import { RfiGenerator } from "../src/services/rfi-generator";
import { StorageService } from "../src/services/storage";
import {
  calculateLimitationsOnSubcontracting,
  checkNonManufacturerRule,
  fetchHistoricalAwardIntelligence,
} from "../src/services/compliance-and-intel";

// Mock R2 Bucket for unit testing
class MockR2Bucket {
  private store = new Map<string, { body: any; metadata: any }>();

  async put(key: string, value: any, options?: any) {
    this.store.set(key, { body: value, metadata: options });
    return { key, size: 100 };
  }

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    return {
      body: item.body,
      text: async () => (typeof item.body === "string" ? item.body : JSON.stringify(item.body)),
      arrayBuffer: async () => new ArrayBuffer(8),
    };
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  async list() {
    return { objects: Array.from(this.store.keys()).map((k) => ({ key: k })) };
  }
}

describe("SDVOSB Pipeline & Ingestion Engine Tests", () => {
  const mockBucket = new MockR2Bucket() as any;
  const storage = new StorageService(mockBucket);

  test("SamGovClient formats dates to MM/dd/yyyy correctly", () => {
    const date = new Date("2026-10-21T12:00:00Z");
    const formatted = SamGovClient.formatSamDate(date);
    assert.match(formatted, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.strictEqual(formatted, "10/21/2026");
  });

  test("SamGovClient mock fallback returns valid SDVOSB opportunities", async () => {
    const client = new SamGovClient(); // No API key triggers dev mock
    const res = await client.fetchOpportunities({
      postedFrom: "10/01/2026",
      postedTo: "10/21/2026",
      ptype: "r,o",
      typeOfSetAside: "SDVOSBC",
    });

    assert.ok(res.totalRecords > 0);
    assert.ok(res.notices.length > 0);
    const notice = res.notices[0];
    assert.ok(notice.noticeId);
    assert.ok(notice.title);
    assert.strictEqual(notice.typeOfSetAside, "SDVOSBC");
  });

  test("RfiGenerator creates compliant Section L response and saves in R2", async () => {
    const generator = new RfiGenerator(storage);
    const opp = {
      id: "HT0011-26-R-0042",
      solicitationNumber: "HT0011-26-R-0042",
      title: "Enterprise Cybersecurity Zero Trust Architecture Implementation",
      agency: "DEFENSE HEALTH AGENCY",
      naicsCode: "541512",
      setAsideCode: "SDVOSBC",
      responseDeadline: "2026-11-15",
    };

    const result = await generator.generateAndStore(opp, {
      templateType: "sources_sought",
      companyName: "VALIANT VETERAN DEFENSE TECHNOLOGIES LLC",
      uei: "VET876543210",
      cageCode: "9ABC4",
      sdvosbCertified: true,
      coreCompetencies: "Zero Trust, FedRAMP, SIEM Engineering",
      pastPerformance: "DHA Medical Cloud Modernization ($4.2M)",
      pocName: "Marcus Vance",
      pocEmail: "m.vance@sdvosb-proposals.mil",
    });

    assert.ok(result.r2Key.startsWith("proposals/HT0011-26-R-0042/"));
    assert.ok(result.preview.includes("VALIANT VETERAN DEFENSE TECHNOLOGIES LLC"));
    assert.ok(result.preview.includes("VET876543210"));
    assert.ok(result.preview.includes("13 CFR § 125.6"));
    assert.ok(result.preview.includes("Zero Trust, FedRAMP"));
    assert.ok(result.html.includes("<!DOCTYPE html>"));

    // Verify written to mock R2
    const saved = await storage.getObject(result.r2Key);
    assert.ok(saved);
  });

  test("RfiGenerator creates Simplified Acquisition Threshold (< $250k) Quote", async () => {
    const generator = new RfiGenerator(storage);
    const opp = {
      id: "36C10B26Q0188",
      solicitationNumber: "36C10B26Q0188",
      title: "Cloud Infrastructure DevSecOps Support - Simplified Acquisition",
      agency: "VETERANS AFFAIRS, DEPARTMENT OF",
      naicsCode: "541519",
      setAsideCode: "SDVOSBC",
    };

    const result = await generator.generateAndStore(opp, {
      templateType: "sat_quote",
      companyName: "VALIANT VETERAN DEFENSE TECHNOLOGIES LLC",
      uei: "VET876543210",
      cageCode: "9ABC4",
      sdvosbCertified: true,
      coreCompetencies: "Kubernetes, DevSecOps, Cloud Automation",
      pastPerformance: "VA Medical Center API Integration",
      proposedPrice: 195000,
      deliveryTimelineDays: 30,
    });

    assert.ok(result.preview.includes("SIMPLIFIED ACQUISITION QUOTE"));
    assert.ok(result.preview.includes("$195,000.00"));
    assert.ok(result.preview.includes("FAR Part 13"));
    assert.ok(result.preview.includes("30 days of award"));
  });

  test("RfiGenerator creates Past Performance Relevancy Matrix", async () => {
    const generator = new RfiGenerator(storage);
    const opp = {
      id: "VA-26-R-0891",
      solicitationNumber: "VA-26-R-0891",
      title: "Predictive Healthcare Analytics & Machine Learning Support",
      agency: "VETERANS AFFAIRS, DEPARTMENT OF",
    };

    const result = await generator.generateAndStore(opp, {
      templateType: "past_performance_matrix",
      companyName: "VALIANT VETERAN DEFENSE TECHNOLOGIES LLC",
      uei: "VET876543210",
      cageCode: "9ABC4",
      sdvosbCertified: true,
      coreCompetencies: "Machine Learning, Analytics",
      pastPerformance: "VA Suicide Prevention Analytics ($2.1M)",
    });

    assert.ok(result.preview.includes("PAST PERFORMANCE MATRIX"));
    assert.ok(result.preview.includes("CPARS"));
  });

  test("RfiGenerator creates Rule-of-Two Set-Aside Conversion & Kingdomware Determination Request", async () => {
    const generator = new RfiGenerator(storage);
    const opp = {
      id: "W15P7T-26-R-0114",
      solicitationNumber: "W15P7T-26-R-0114",
      title: "Tactical Edge Cloud & Automated Telemetry Pipeline",
      agency: "VETERANS AFFAIRS, DEPARTMENT OF",
      naicsCode: "541512",
      setAsideCode: "SBA",
    };

    const result = await generator.generateAndStore(opp, {
      templateType: "rule_of_two_shaping",
      companyName: "VALIANT VETERAN DEFENSE TECHNOLOGIES LLC",
      uei: "VET876543210",
      cageCode: "9ABC4",
      sdvosbCertified: true,
      coreCompetencies: "Tactical Cloud, Zero Trust",
      pastPerformance: "VA Cloud Migration ($4.2M)",
    });

    assert.ok(result.preview.includes("RULE OF TWO"));
    assert.ok(result.preview.includes("Kingdomware"));
    assert.ok(result.preview.includes("13 CFR § 125.6"));
  });

  test("RfiGenerator creates Formal Solicitation Q&A Submittal Matrix", async () => {
    const generator = new RfiGenerator(storage);
    const opp = {
      id: "HT0011-26-Q-0089",
      solicitationNumber: "HT0011-26-Q-0089",
      title: "FHIR API Gateway Engineering",
      agency: "DEFENSE HEALTH AGENCY",
    };

    const result = await generator.generateAndStore(opp, {
      templateType: "rfp_qa_inquiries",
      companyName: "VALIANT VETERAN DEFENSE TECHNOLOGIES LLC",
      uei: "VET876543210",
      cageCode: "9ABC4",
      sdvosbCertified: true,
      coreCompetencies: "FHIR, HL7",
      pastPerformance: "DHA Interoperability",
    });

    assert.ok(result.preview.includes("OFFEROR QUESTIONS MATRIX"));
    assert.ok(result.preview.includes("Similarly Situated Entity"));
  });

  test("FAR 52.219-27 / 13 CFR 125.6 Calculator properly credits Similarly Situated Entities and flags pass-through violations", () => {
    // Case 1: Prime does $200k (40%), Similarly Situated SDVOSB Sub does $150k (30%) -> Combined SDVOSB Team = 70%, Non-SDVOSB = 30% ($150k) -> COMPLIANT!
    const compliantRes = calculateLimitationsOnSubcontracting({
      procurementType: "services",
      totalContractValue: 500000,
      primeDirectDollars: 200000,
      similarlySituatedSubDollars: 150000,
      nonSdvosbSubDollars: 150000,
    });
    assert.strictEqual(compliantRes.compliant, true);
    assert.strictEqual(compliantRes.effectiveSdvosbTeamPercent, 70);
    assert.strictEqual(compliantRes.actualNonSdvosbPercent, 30);

    // Case 2: Non-SDVOSB Sub does $300k (60%) on a $500k Services contract -> VIOLATION (>50%)
    const violationRes = calculateLimitationsOnSubcontracting({
      procurementType: "services",
      totalContractValue: 500000,
      primeDirectDollars: 200000,
      similarlySituatedSubDollars: 0,
      nonSdvosbSubDollars: 300000,
    });
    assert.strictEqual(violationRes.compliant, false);
    assert.strictEqual(violationRes.actualNonSdvosbPercent, 60);
  });

  test("Non-Manufacturer Rule (NMR) checker identifies SBA Class Waivers and Services exemptions", () => {
    const waiverRes = checkNonManufacturerRule("334111");
    assert.strictEqual(waiverRes.hasActiveClassWaiver, true);
    assert.ok(waiverRes.waiverSummary.includes("Electronic Computers"));

    const servicesRes = checkNonManufacturerRule("541512");
    assert.strictEqual(servicesRes.hasActiveClassWaiver, false);
    assert.ok(servicesRes.resellerStrategy.includes("does not apply to service contracts"));
  });
});
