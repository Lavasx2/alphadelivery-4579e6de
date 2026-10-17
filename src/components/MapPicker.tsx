import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, LocateFixed, MapPin, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { DeviceLocationError, requestDeviceLocation } from "@/lib/geolocation";

type LatLng = { lat: number; lng: number };

declare global {
  interface Window {
    google?: unknown;
    __crustMapsInit?: () => void;
  }
}

let loadPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];
    if (!key) {
      reject(new Error("NO_MAPS_KEY"));
      return;
    }
    window.__crustMapsInit = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__crustMapsInit${
      channel ? `&channel=${channel}` : ""
    }`;
    s.async = true;
    s.onerror = () => reject(new Error("MAPS_LOAD_FAILED"));
    document.head.appendChild(s);
  });
  loadPromise.catch(() => { loadPromise = null; });
  return loadPromise;
}

function MapCanvas({
  center,
  value,
  onPick,
}: {
  center: LatLng;
  value: LatLng | null;
  onPick: (p: LatLng) => void;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);
  const { t } = useI18n();
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    void loadMaps()
      .then(() => {
        if (cancelled || !divRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (window as any).google.maps;
        const map = new g.Map(divRef.current, {
          center: value ?? center,
          zoom: value ? 16 : 13,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        const marker = new g.Marker({
          position: value ?? center,
          map,
          draggable: true,
        });
        markerRef.current = marker;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const emit = (e: any) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          onPickRef.current({ lat, lng });
        };
        map.addListener("click", emit);
        marker.addListener("dragend", emit);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google?.maps;
      if (g && mapRef.current) g.event.clearInstanceListeners(mapRef.current);
      if (g && markerRef.current) g.event.clearInstanceListeners(markerRef.current);
      markerRef.current?.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value && markerRef.current) {
      markerRef.current.setPosition(value);
      mapRef.current?.panTo(value);
    }
  }, [value]);

  return <div className="relative min-h-0 flex-1 bg-secondary">
    <div ref={divRef} className="absolute inset-0 touch-none" />
    {failed && <p role="alert" className="absolute inset-x-4 top-4 rounded-lg bg-background p-4 text-sm text-destructive">{t("mapLoadFailed")}</p>}
  </div>;
}

export default function MapPicker({ center, value, onPick }: {
  center: LatLng;
  value: LatLng | null;
  onPick: (p: LatLng) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LatLng | null>(value);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function locate() {
    setError(null);
    setLocating(true);
    try { setDraft(await requestDeviceLocation()); }
    catch (e) { setError(t(e instanceof DeviceLocationError ? e.key : "locationUnavailable")); }
    finally { setLocating(false); }
  }
  return <DialogPrimitive.Root open={open} onOpenChange={(next) => {
    if (next) { setDraft(value); setError(null); }
    setOpen(next);
  }}>
    <DialogPrimitive.Trigger asChild>
      <Button type="button" variant="secondary" className="h-64 w-full flex-col gap-3 whitespace-normal rounded-lg border border-border text-base">
        <MapPin className="size-10" />
        <span className="flex items-center gap-2"><Maximize2 />{t("openLocationMap")}</span>
        {value && <bdi dir="ltr" className="text-sm text-muted-foreground">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</bdi>}
      </Button>
    </DialogPrimitive.Trigger>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background" />
      <DialogPrimitive.Content className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-background text-foreground outline-none" aria-describedby={undefined}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <DialogPrimitive.Title className="text-lg font-bold">{t("locationTitle")}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild><Button type="button" variant="outline" size="icon" aria-label={t("closeMap")}><X /></Button></DialogPrimitive.Close>
        </div>
        <MapCanvas center={center} value={draft} onPick={setDraft} />
        <div className="shrink-0 space-y-3 border-t border-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => void locate()} disabled={locating} className="min-h-12 flex-1 whitespace-normal"><LocateFixed />{locating ? t("locating") : t("shareLocation")}</Button>
            <Button type="button" disabled={!draft || locating} className="min-h-12 flex-1 whitespace-normal" onClick={() => {
              if (!draft) return;
              onPick(draft);
              setOpen(false);
            }}><Check />{t("confirmLocation")}</Button>
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
