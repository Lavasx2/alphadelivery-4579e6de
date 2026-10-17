export type LocationError = "locationPermissionDenied" | "locationTimeout" | "locationUnavailable" | "locationSecureRequired";

export class DeviceLocationError extends Error {
  constructor(public readonly key: LocationError) {
    super(key);
  }
}

export function requestDeviceLocation(): Promise<{ lat: number; lng: number }> {
  if (!window.isSecureContext) return Promise.reject(new DeviceLocationError("locationSecureRequired"));
  if (!navigator.geolocation) return Promise.reject(new DeviceLocationError("locationUnavailable"));
  return new Promise((resolve, reject) => {
    const locate = (highAccuracy: boolean) => navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (error) => {
        if (error.code === 3 && highAccuracy) { locate(false); return; }
        reject(new DeviceLocationError(error.code === 1 ? "locationPermissionDenied" : error.code === 3 ? "locationTimeout" : "locationUnavailable"));
      },
      { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 15000 : 10000, maximumAge: highAccuracy ? 0 : 60000 },
    );
    locate(true);
  });
}