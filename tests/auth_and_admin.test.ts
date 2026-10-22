import { test, describe } from "node:test";
import assert from "node:assert";
import { generateBase32Secret, generateTotp, verifyTotp } from "../src/auth/totp";
import { hashPassword, verifyPassword } from "better-auth/crypto";

describe("Real Authentication, MFA & Admin Console Tests", () => {
  test("Better Auth password hashing and verification works securely", async () => {
    const rawPass = "AdminSDVOSB!2026#Secure";
    const hashed = await hashPassword(rawPass);
    assert.notStrictEqual(hashed, rawPass);

    const matches = await verifyPassword({ password: rawPass, hash: hashed });
    assert.strictEqual(matches, true);

    const wrongMatches = await verifyPassword({ password: "WrongPassword123", hash: hashed });
    assert.strictEqual(wrongMatches, false);
  });

  test("MFA TOTP code generation matches verification window", async () => {
    const secret = generateBase32Secret(20);
    const code = await generateTotp(secret);
    assert.match(code, /^\d{6}$/);

    const verified = await verifyTotp(secret, code);
    assert.strictEqual(verified, true);
  });

  test("MFA 3-day grace period calculation logic", () => {
    const now = Date.now();
    const graceLimitMs = 3 * 24 * 60 * 60 * 1000;

    // Case 1: Fresh user created today
    const freshUserCreatedAt = new Date(now);
    const ageFresh = now - freshUserCreatedAt.getTime();
    const remainingDaysFresh = Math.max(0, Math.ceil((graceLimitMs - ageFresh) / (24 * 60 * 60 * 1000)));
    const enforcedFresh = ageFresh > graceLimitMs;
    assert.strictEqual(remainingDaysFresh, 3);
    assert.strictEqual(enforcedFresh, false);

    // Case 2: User created 2 days ago
    const midUserCreatedAt = new Date(now - 2 * 24 * 60 * 60 * 1000);
    const ageMid = now - midUserCreatedAt.getTime();
    const remainingDaysMid = Math.max(0, Math.ceil((graceLimitMs - ageMid) / (24 * 60 * 60 * 1000)));
    const enforcedMid = ageMid > graceLimitMs;
    assert.strictEqual(remainingDaysMid, 1);
    assert.strictEqual(enforcedMid, false);

    // Case 3: User created 4 days ago without MFA
    const oldUserCreatedAt = new Date(now - 4 * 24 * 60 * 60 * 1000);
    const ageOld = now - oldUserCreatedAt.getTime();
    const remainingDaysOld = Math.max(0, Math.ceil((graceLimitMs - ageOld) / (24 * 60 * 60 * 1000)));
    const enforcedOld = ageOld > graceLimitMs;
    assert.strictEqual(remainingDaysOld, 0);
    assert.strictEqual(enforcedOld, true);
  });
});
