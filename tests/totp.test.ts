import { test, describe } from "node:test";
import assert from "node:assert";
import {
  generateBase32Secret,
  generateTotp,
  verifyTotp,
  generateBackupCodes,
  getOtpAuthUri,
} from "../src/auth/totp";

describe("TOTP MFA Engine Tests", () => {
  test("generates base32 secret with correct characters", () => {
    const secret = generateBase32Secret();
    assert.strictEqual(secret.length, 20);
    assert.match(secret, /^[A-Z2-7]+$/);
  });

  test("generates valid 6-digit TOTP and verifies it", async () => {
    const secret = generateBase32Secret();
    const token = await generateTotp(secret);
    assert.match(token, /^\d{6}$/);

    const isValid = await verifyTotp(secret, token);
    assert.strictEqual(isValid, true);

    const isInvalid = await verifyTotp(secret, "000000" === token ? "111111" : "000000");
    assert.strictEqual(isInvalid, false);
  });

  test("generates backup codes in expected format", () => {
    const codes = generateBackupCodes(6);
    assert.strictEqual(codes.length, 6);
    for (const code of codes) {
      assert.match(code, /^[A-F0-9]{4}-[A-F0-9]{4}$/);
    }
  });

  test("constructs standard otpauth URI", () => {
    const uri = getOtpAuthUri("admin@sdvosb-proposals.mil", "Sidequest SDVOSB", "JBSWY3DPEHPK3PXP");
    assert.ok(uri.startsWith("otpauth://totp/Sidequest%20SDVOSB:admin%40sdvosb-proposals.mil?secret=JBSWY3DPEHPK3PXP"));
    assert.ok(uri.includes("issuer=Sidequest%20SDVOSB"));
  });
});
