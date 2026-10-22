import { test, describe, before } from "node:test";
import assert from "node:assert";
import { SamGovClient } from "../src/services/sam-api";
import { RfiGenerator } from "../src/services/rfi-generator";
import { StorageService } from "../src/services/storage";
import { handleInboundEmail } from "../src/workers/email";

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

    // Verify written to mock R2
    const saved = await storage.getObject(result.r2Key);
    assert.ok(saved);
  });
});
