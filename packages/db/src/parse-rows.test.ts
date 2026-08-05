import { describe, expect, it } from "bun:test";
import { userSchema } from "@titan/domain/profile";
import { parseDataRows, parseFirstDataRow } from "./parse-rows";

const user = {
  createdAt: "2026-01-01T00:00:00.000Z",
  displayName: "Athlete",
  id: "user-1",
};

describe("parseDataRows", () => {
  it("parses each row's data against the schema", () => {
    const parsed = parseDataRows(userSchema, [{ data: user }]);
    expect(parsed).toEqual([user]);
  });

  it("throws when a row's data does not match the schema", () => {
    expect(() => parseDataRows(userSchema, [{ data: { id: 42 } }])).toThrow();
  });
});

describe("parseFirstDataRow", () => {
  it("parses the first row", () => {
    expect(parseFirstDataRow(userSchema, [{ data: user }])).toEqual(user);
  });

  it("returns undefined for an empty result", () => {
    expect(parseFirstDataRow(userSchema, [])).toBeUndefined();
  });
});
