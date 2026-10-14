import { describe, expect, it } from "vitest";
import { normalizeDzPhone } from "./phone";

describe("normalizeDzPhone", () => {
  it("accepts a valid mobile number with spaces", () => {
    expect(normalizeDzPhone("05 55 12 34 56")).toBe("0555123456");
  });
  it("accepts +213 prefix", () => {
    expect(normalizeDzPhone("+213661234567")).toBe("0661234567");
  });
  it("rejects too short numbers", () => {
    expect(normalizeDzPhone("0555123")).toBeNull();
  });
  it("rejects letters", () => {
    expect(normalizeDzPhone("05551234ab")).toBeNull();
  });
});
