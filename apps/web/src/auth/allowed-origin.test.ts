import { describe, expect, it } from "bun:test";
import { isOriginAllowed } from "./allowed-origin";

const proxy = "https://titan.example.com";
const suffix = "-cprussins-projects.vercel.app";

describe("isOriginAllowed", () => {
  it("allows the production (proxy) origin itself", () => {
    expect(isOriginAllowed(proxy, suffix, proxy)).toBe(true);
  });

  it("allows an https preview origin whose host ends with the suffix", () => {
    expect(
      isOriginAllowed(
        proxy,
        suffix,
        "https://titan-web-git-branch-cprussins-projects.vercel.app",
      ),
    ).toBe(true);
  });

  it("rejects a preview origin that doesn't match the suffix", () => {
    expect(isOriginAllowed(proxy, suffix, "https://evil.example.com")).toBe(
      false,
    );
  });

  it("rejects a non-https origin even when the host matches", () => {
    expect(
      isOriginAllowed(
        proxy,
        suffix,
        "http://titan-web-git-branch-cprussins-projects.vercel.app",
      ),
    ).toBe(false);
  });

  it("allows only the proxy origin when no suffix is configured", () => {
    expect(isOriginAllowed(proxy, undefined, proxy)).toBe(true);
    expect(
      isOriginAllowed(proxy, undefined, "https://anything.vercel.app"),
    ).toBe(false);
  });

  it("rejects an unparseable origin", () => {
    expect(isOriginAllowed(proxy, suffix, "not a url")).toBe(false);
  });
});
