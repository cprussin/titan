import { describe, expect, it } from "bun:test";

import { buildRobots } from "./build-robots";

describe(buildRobots, () => {
  it("allows crawling but keeps the API surface out of the index", () => {
    const robots = buildRobots("https://titan.test");
    expect(robots.rules).toStrictEqual({
      allow: "/",
      disallow: "/api/",
      userAgent: "*",
    });
  });

  it("points crawlers at the sitemap on the same origin", () => {
    expect(buildRobots("https://titan.test").sitemap).toBe(
      "https://titan.test/sitemap.xml",
    );
  });
});
