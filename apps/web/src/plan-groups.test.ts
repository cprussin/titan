import { describe, expect, it } from "bun:test";
import type { SlotRole } from "@titan/domain/program";
import { groupByRole } from "./plan-groups";

const exercise = (id: string, role: SlotRole) => ({ id, role });

describe("groupByRole", () => {
  it("orders groups primary, secondary, accessory and drops empty roles", () => {
    const groups = groupByRole([
      exercise("a", "accessory"),
      exercise("b", "primary"),
      exercise("c", "accessory"),
    ]);
    expect(groups).toEqual([
      { exercises: [exercise("b", "primary")], role: "primary" },
      {
        exercises: [exercise("a", "accessory"), exercise("c", "accessory")],
        role: "accessory",
      },
    ]);
  });

  it("preserves the original order within a role", () => {
    const groups = groupByRole([
      exercise("x", "secondary"),
      exercise("y", "secondary"),
    ]);
    expect(groups).toEqual([
      {
        exercises: [exercise("x", "secondary"), exercise("y", "secondary")],
        role: "secondary",
      },
    ]);
  });

  it("is empty for no exercises", () => {
    expect(groupByRole([])).toEqual([]);
  });
});
