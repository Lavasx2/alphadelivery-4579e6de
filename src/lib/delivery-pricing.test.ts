import { describe, expect, it } from "vitest";
import { localFee, interWilayaFee } from "./delivery-pricing";

describe("delivery pricing", () => {
  it("inside the wilaya never exceeds 350 DA", () => {
    expect(localFee(200)).toBe(350);
  });
  it("between wilayas never exceeds 1800 DA", () => {
    expect(interWilayaFee(5000)).toBe(1800);
  });
  it("between wilayas rises with distance", () => {
    expect(interWilayaFee(800)).toBeGreaterThan(interWilayaFee(100));
  });
});
