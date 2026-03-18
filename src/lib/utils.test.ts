import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "text-sm")).toContain("px-2");
    expect(cn("px-2", "text-sm")).toContain("text-sm");
  });
});
