import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { normalizeDzPhone } from "@/lib/phone";
import { OrderStatusCard } from "@/components/OrderStatusCard";
import { Bike, CheckCircle2, MapPin, Minus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { RESTAURANT, formatPrice } from "@/lib/menu";
import { useI18n } from "@/lib/i18n";
import { quoteDelivery } from "@/lib/delivery.functions";
import { submitOrder as submitOrderFn } from "@/lib/order-submit.functions";
import { WILAYAS, getDeviceId } from "@/lib/wilayas";

const MapPicker = lazy(() => import("@/components/MapPicker"));

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "سلة الطلب | ألفا ديليفري" },
      {
        name: "description",
        content:
          "اطلب من متاجر ألفا ديليفري ونوصل لك للمنزل — أكمل سلة الطلبات وأدخل اسمك ورقم هاتفك وعنوانك.",
      },
      { property: "og:title", content: "سلة الطلب | ألفا ديليفري" },
      {
        property: "og:description",
        content: "أكمل طلبك عبر ألفا ديليفري ونوصله ساخناً إلى باب دارك.",
      },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { lines, total, setQty, remove, clear, store } = useCart();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => { setActiveId(localStorage.getItem("alpha-active-order")); }, []);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [quote, setQuote] = useState<{
    distanceKm: number;
    fee: number;
    outOfRange: boolean;
    mapsUrl: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  const grandTotal = total + (quote && !quote.outOfRange ? quote.fee : 0);
  const address = quote?.address || "";

  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [sameWilaya, setSameWilaya] = useState(true);
  async function quoteFor(lat: number | null, lng: number | null, w = wilaya) {
    setError(null);
    setLocating(true);
    try {
      const res = await quoteDelivery({ data: { lat, lng, storeId: store?.id, wilaya: w || null } });
      setSameWilaya(res.sameWilaya);
      if (res.needsLocation) { setQuote(null); setLocating(false); return; }
      const c = new URL(res.mapsUrl).searchParams.get("query")?.split(",").map(Number) ?? [0, 0];
      setQuote({ ...res, lat: lat ?? c[0]!, lng: lng ?? c[1]! });
      if (res.outOfRange) setError(t("outOfRange"));
    } catch {
      setError(t("locationDenied"));
    }
    setLocating(false);
  }

  function shareLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError(t("locationDenied"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void quoteFor(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError(t("locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !wilaya || (!sameWilaya && !commune.trim())) {
      setError(t("fillRequired"));
      return;
    }
    if (!normalizeDzPhone(phone)) {
      setError(t("invalidPhone"));
      return;
    }
    if (!quote) {
      setError(t("locationRequired"));
      return;
    }
    if (quote.outOfRange) {
      setError(t("outOfRange"));
      return;
    }
    setLoading(true);
    const res = await submitOrderFn({ data: {
      wilaya: wilaya || null,
      device_id: getDeviceId(),
      customer_name: name.trim() || "زائر",
      phone: phone.trim(),
      address: [sameWilaya ? "" : `${commune.trim()} - ${wilaya}`, address.trim()].filter(Boolean).join(" | ") || `${quote.lat.toFixed(6)}, ${quote.lng.toFixed(6)}`,
      notes: notes.trim() || null,
      items: lines.map((l) => ({
        id: l.item.id,
        name: l.item.name,
        price: l.item.price,
        qty: l.qty,
      })),
      total: grandTotal,
      delivery_fee: quote.fee,
      distance_km: quote.distanceKm,
      lat: quote.lat,
      lng: quote.lng,
      maps_url: quote.mapsUrl,
      store_id: store?.id ?? null,
    } }).catch(() => ({ ok: false as const }));
    setLoading(false);
    if (!res.ok) {
      setError("reason" in res && res.reason === "phone" ? t("invalidPhone") : t("orderError"));
      return;
    }
    clear();
    if ("id" in res && res.id) {
      localStorage.setItem("alpha-active-order", res.id);
      setActiveId(res.id);
    }
  }

  if (activeId) {
    return (
      <OrderStatusCard
        id={activeId}
        onFinished={() => { localStorage.removeItem("alpha-active-order"); setActiveId(null); }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="flex items-center gap-3 text-2xl font-black sm:text-4xl">
        <Bike className="size-7 shrink-0 text-primary sm:size-9" />
        {t("orderTitle")}
      </h1>
      {store && (
        <p className="mt-1 text-sm font-bold text-primary">
          {store.name}
        </p>
      )}
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        {t("orderIntro")}
      </p>

      {lines.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground">{t("emptyCart")}</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90"
          >
            {t("browseMenu")}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {/* Cart */}
          <div>
            <h2 className="text-xl font-bold">{t("cart")}</h2>
            <div className="mt-4 space-y-3">
              {lines.map((l) => (
                <div
                  key={l.item.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                >
                  {l.item.image && (
                    <img
                      src={l.item.image}
                      alt={l.item.name}
                      loading="lazy"
                      width={800}
                      height={600}
                      className="size-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold">{l.item.name}</h3>
                    <p className="text-sm text-primary font-bold">
                      {formatPrice(l.item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(l.item.id, l.qty - 1)}
                      className="flex size-8 items-center justify-center rounded-md border border-border hover:bg-secondary"
                      aria-label={t("decrease")}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center font-bold">{l.qty}</span>
                    <button
                      onClick={() => setQty(l.item.id, l.qty + 1)}
                      className="flex size-8 items-center justify-center rounded-md border border-border hover:bg-secondary"
                      aria-label={t("increase")}
                    >
                      <Plus className="size-4" />
                    </button>
                    <button
                      onClick={() => remove(l.item.id)}
                      className="mx-1 text-muted-foreground hover:text-destructive"
                      aria-label={t("removeItem")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 p-4 text-lg font-black">
              <span>{t("total")}</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Checkout form */}
          <div>
            <h2 className="text-xl font-bold">{t("deliveryInfo")}</h2>
            <form onSubmit={submitOrder} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("nameOptional")}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t("namePlaceholder")}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("phoneRequired")}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  type="tel"
                  dir="ltr"
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-left outline-none focus:ring-2 focus:ring-ring"
                  placeholder="05 XX XX XX XX"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("detectedAddress")}
                </label>
                <p className="rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-2.5 text-sm">
                  {address || t("addressAuto")}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("wilaya")}</label>
                <select
                  value={wilaya}
                  onChange={(e) => { setWilaya(e.target.value); if (e.target.value) void quoteFor(quote && sameWilaya ? quote.lat : null, quote && sameWilaya ? quote.lng : null, e.target.value); }}
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">—</option>
                  {WILAYAS.map((w, i) => (
                    <option key={w} value={w}>{String(i + 1).padStart(2, "0")} - {w}</option>
                  ))}
                </select>
              </div>
              {!sameWilaya && (
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("commune")} *</label>
                  <input value={commune} onChange={(e) => setCommune(e.target.value)} required
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
                  <p className="mt-1 text-xs text-muted-foreground">{t("interWilayaNote")}</p>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("notesOptional")}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t("notesPlaceholder")}
                />
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 font-bold">
                  <MapPin className="size-4 text-primary" />
                  {t("locationTitle")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("locationHint")}
                </p>
                <button
                  type="button"
                  onClick={shareLocation}
                  disabled={locating}
                  className="mt-3 min-h-12 w-full rounded-xl border-2 border-primary/60 bg-primary/15 text-base font-bold text-primary active:scale-[0.99] disabled:opacity-60"
                >
                  {locating ? t("locating") : t("shareLocation")}
                </button>

                <p className="mt-4 text-sm font-bold">{t("pickOnMap")}</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t("mapPickHint")}
                </p>
                <ClientOnly fallback={<div className="h-64 rounded-lg bg-secondary" />}>
                  <Suspense fallback={<div className="h-64 rounded-lg bg-secondary" />}>
                    <MapPicker
                      center={{ lat: store?.lat ?? RESTAURANT.lat, lng: store?.lng ?? RESTAURANT.lng }}
                      value={quote ? { lat: quote.lat, lng: quote.lng } : null}
                      onPick={(p) => void quoteFor(p.lat, p.lng)}
                    />
                  </Suspense>
                </ClientOnly>

                {quote && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="font-bold text-green-500">{t("locationReady")}</p>
                    <p className="text-muted-foreground">
                      {t("distance")}: <bdi dir="ltr">{quote.distanceKm}</bdi>{" "}
                      {t("km")}
                    </p>
                    <a
                      href={quote.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-primary underline"
                    >
                      {t("viewOnMaps")}
                    </a>
                  </div>
                )}
              </div>

              {quote && !quote.outOfRange && (
                <div className="space-y-1 rounded-xl bg-primary/10 p-4 text-sm">
                  <div className="flex justify-between">
                    <span>{t("subtotal")}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("deliveryFee")}</span>
                    <span>{formatPrice(quote.fee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-primary">
                    <span>{t("grandTotal")}</span>
                    <span>{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-destructive/15 p-3 text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="min-h-14 w-full rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/25 transition-colors active:scale-[0.99] hover:bg-primary/90 disabled:opacity-50"
              >
                {loading
                  ? t("sendingOrder")
                  : `${t("confirmOrder")} — ${formatPrice(grandTotal)}`}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                {t("payOnDelivery")}
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
