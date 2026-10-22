import { test, describe } from "node:test";
import assert from "node:assert";
import app from "../src/index";
import PostalMime from "postal-mime";

describe("Email Parser & App Routing Tests", () => {
  test("PostalMime parses RFC822 MIME raw email text and headers", async () => {
    const rawEmail = `From: contracting.officer@us.af.mil
To: capture@sdvosb-proposals.mil
Subject: Amendment 0002 for Solicitation HT0011-26-R-0042
Date: Wed, 21 Oct 2026 12:00:00 -0400
Message-ID: <co-update-4492@us.af.mil>
Content-Type: text/plain; charset=utf-8

Good afternoon,

Please find attached the updated responses to industry questions regarding RFP HT0011-26-R-0042.
The revised response deadline is November 15, 2026.

Respectfully,
Maj. Marcus Bennett
Contracting Officer (KO)`;

    const parser = new PostalMime();
    const encoder = new TextEncoder();
    const parsed = await parser.parse(encoder.encode(rawEmail).buffer);

    assert.strictEqual(parsed.from?.address, "contracting.officer@us.af.mil");
    assert.strictEqual(parsed.subject, "Amendment 0002 for Solicitation HT0011-26-R-0042");
    assert.ok(parsed.text?.includes("HT0011-26-R-0042"));
    assert.ok(parsed.text?.includes("Maj. Marcus Bennett"));
  });

  test("GET /health returns healthy status code 200", async () => {
    const res = await app.fetch(new Request("http://localhost/health"), {} as any);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any;
    assert.strictEqual(data.status, "healthy");
    assert.strictEqual(data.service, "sidequest-sdvosb-capture");
  });

  test("GET / returns Kanban UI HTML layout", async () => {
    const res = await app.fetch(new Request("http://localhost/"), {} as any);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("SDVOSB CAPTURE"));
    assert.ok(html.includes("col-new"));
    assert.ok(html.includes("col-drafting"));
    assert.ok(html.includes("col-won"));
  });
});
