import { describe, expect, it } from "bun:test";
import { isValidWebhookSecret } from "./webhook-secret";

describe("isValidWebhookSecret", () => {
  it("accepts a call whose secret matches the configured one", () => {
    expect(isValidWebhookSecret("s3cret-value", "s3cret-value")).toBe(true);
  });

  it("rejects a mismatched secret", () => {
    expect(isValidWebhookSecret("wrong", "s3cret-value")).toBe(false);
  });

  it("rejects a secret that only shares a prefix", () => {
    expect(isValidWebhookSecret("s3cret", "s3cret-value")).toBe(false);
  });

  it("rejects a call that carries no secret", () => {
    expect(isValidWebhookSecret(undefined, "s3cret-value")).toBe(false);
  });

  it("rejects every call when the webhook is not configured", () => {
    expect(isValidWebhookSecret("s3cret-value", undefined)).toBe(false);
    expect(isValidWebhookSecret(undefined, undefined)).toBe(false);
  });
});
