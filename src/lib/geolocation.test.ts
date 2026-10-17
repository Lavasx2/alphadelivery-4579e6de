import { afterEach, describe, expect, it, vi } from "vitest";
import { requestDeviceLocation } from "./geolocation";

afterEach(() => vi.unstubAllGlobals());
function setup(getCurrentPosition: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("window", { isSecureContext: true });
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
}
describe("device location", () => {
  it("requests phone location permission and returns coordinates", async () => {
    const get = vi.fn((success, _failure, _options) => success({ coords: { latitude: 35.4, longitude: 8.1 } }));
    setup(get);
    await expect(requestDeviceLocation()).resolves.toEqual({ lat: 35.4, lng: 8.1 });
    expect(get.mock.calls[0]?.[2]).toEqual({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
  it("explains denied permission without repeated prompts", async () => {
    const get = vi.fn((_success, failure) => failure({ code: 1 }));
    setup(get);
    await expect(requestDeviceLocation()).rejects.toMatchObject({ key: "locationPermissionDenied" });
    expect(get).toHaveBeenCalledTimes(1);
  });
  it("retries a GPS timeout with lower accuracy", async () => {
    const get = vi.fn().mockImplementationOnce((_success, failure) => failure({ code: 3 }))
      .mockImplementationOnce((success) => success({ coords: { latitude: 36, longitude: 3 } }));
    setup(get);
    await expect(requestDeviceLocation()).resolves.toEqual({ lat: 36, lng: 3 });
    expect(get.mock.calls[1]?.[2].enableHighAccuracy).toBe(false);
  });
});