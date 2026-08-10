import { describe, expect, it } from "bun:test";

import { buildSitemap } from "./build-sitemap";

describe(buildSitemap, () => {
  it("lists the public entry points as absolute URLs on the given origin", () => {
    const urls = buildSitemap("https://titan.test").map((entry) => entry.url);
    expect(urls).toStrictEqual([
      "https://titan.test/",
      "https://titan.test/login",
    ]);
  });
});
