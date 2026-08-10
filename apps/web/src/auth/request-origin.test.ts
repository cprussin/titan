import { describe, expect, it } from "bun:test";
import { requestOrigin } from "./request-origin";

describe("requestOrigin", () => {
  it("uses the forwarded host and protocol when a proxy set them", () => {
    const request = new Request("https://internal.local/api/auth/google", {
      headers: {
        "x-forwarded-host": "preview.vercel.app",
        "x-forwarded-proto": "https",
      },
    });
    expect(requestOrigin(request)).toBe("https://preview.vercel.app");
  });

  it("defaults the forwarded protocol to https", () => {
    const request = new Request("https://internal.local/api/auth/google", {
      headers: { "x-forwarded-host": "preview.vercel.app" },
    });
    expect(requestOrigin(request)).toBe("https://preview.vercel.app");
  });

  it("falls back to the request URL origin without a forwarded host", () => {
    const request = new Request("http://localhost:3000/api/auth/google");
    expect(requestOrigin(request)).toBe("http://localhost:3000");
  });
});
