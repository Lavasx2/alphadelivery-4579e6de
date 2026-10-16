import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { tr } from "@/lib/tr";
import { useMemo, useState } from "react";
import { Flame, MapPin, Phone, ShoppingBag, Star, UtensilsCrossed, ArrowRight } from "lucide-react";
import crustBanner from "@/assets/crust-banner.jpg.asset.json";
import { formatPrice } from "@/lib/menu";
import { localizeItem } from "@/lib/menu-i18n";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { getStoreBySlug } from "@/lib/stores-public.functions";
import { storeTheme } from "@/lib/stores";

export const Route = createFileRoute("/store/$slug")({
  loader: async ({ params }) => {
    const res = await getStoreBySlug({ data: { slug: params.slug } });
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "متجر غير متوفر | ألفا ديليفري" }, { name: "robots", content: "noindex" }] };
    const s = loaderData.store;
    const title = `${s.name} | ألفا ديليفري`;
    const desc = s.tagline || s.description || `اطلب من ${s.name} عبر ألفا ديليفري والدفع عند الاستلام.`;
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (s.banner_url?.startsWith("https://")) {
      meta.push({ property: "og:image", content: s.banner_url }, { name: "twitter:image", content: s.banner_url });
    }
    return { meta };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-2xl font-black">{tr("تعذّر تحميل المتجر")}</h1>
      <p className="mt-2 text-muted-foreground">{tr("حاول تحديث الصفحة من فضلك.")}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-2xl font-black">{tr("هذا المتجر غير متوفر")}</h1>
      <Link to="/" className="mt-4 inline-block font-bold text-primary">{tr("تصفح المتاجر")}</Link>
    </div>
  ),
  component: StorePage,
});

function StorePage() {
  const { store, items: rawItems } = Route.useLoaderData();
  const { addFrom, count, store: cartStore } = useCart();
  const { t, lang } = useI18n();
  const [category, setCategory] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const mapsKey = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const banner = store.banner_url || (store.slug === "crust" ? crustBanner.url : null);

  const items = useMemo(() => rawItems.map((i) => localizeItem(i, lang)), [rawItems, lang]);
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const shown = category ? items.filter((i) => i.category === category) : items;
  const cartStoreRef = { id: store.id, slug: store.slug, name: store.name, lat: store.lat, lng: store.lng };

  function add(id: string) {
    const raw = rawItems.find((r) => r.id === id);
    if (!raw) return;
    if (cartStore && cartStore.id !== store.id && count > 0) {
      if (!window.confirm(`سلتك تحتوي طلبات من ${cartStore.name}. هل تريد إفراغها والطلب من ${store.name}؟`)) return;
    }
    addFrom(cartStoreRef, raw);
    setAddedId(id);
    setTimeout(() => setAddedId(null), 900);
  }

  const mapSrc = store.place_id
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=place_id:${store.place_id}&language=${lang}&zoom=16`
    : store.lat != null && store.lng != null
      ? `https://www.google.com/maps/embed/v1/view?key=${mapsKey}&center=${store.lat},${store.lng}&zoom=16`
      : null;

  return (
    <div style={storeTheme(store.primary_color, store.secondary_color)}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {banner ? (
            <img src={banner} alt={store.name} className="size-full object-cover" fetchPriority="high" />
          ) : (
            <div className="size-full bg-gradient-to-br from-primary/40 via-background to-accent/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/85 to-background/40" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex w-fit items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground">
            <ArrowRight className="size-4" /> {tr("كل المتاجر")}
          </Link>
          <div className="flex items-center gap-4">
            {store.logo_url ? (
              <img src={store.logo_url} alt="" className="size-20 rounded-2xl border-2 border-primary object-cover" />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <UtensilsCrossed className="size-9" />
              </span>
            )}
            <div>
              <h1 className="text-3xl font-black sm:text-5xl">{store.name}</h1>
              {store.tagline && <p className="mt-1 text-lg text-primary font-bold">{store.tagline}</p>}
            </div>
          </div>
          {store.description && <p className="max-w-xl text-muted-foreground">{store.description}</p>}
          <div className="flex flex-wrap gap-3">
            {store.rating != null && (store.rating_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-primary">
                <Star className="size-4 fill-primary" /> {store.rating} · {store.rating_count ?? 0} {t("ratingOn")}
              </span>
            )}
            {store.phone && (
              <a href={`tel:${store.phone}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-sm font-bold">
                <Phone className="size-4 text-primary" /> <bdi dir="ltr">{store.phone}</bdi>
              </a>
            )}
            {store.maps_url && (
              <a href={store.maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-sm font-bold">
                <MapPin className="size-4 text-primary" /> {t("ourLocation")}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-black sm:text-3xl">{t("menu")}</h2>
        <div className="-mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"}
              onClick={() => setCategory(c)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-full px-5 text-sm font-bold ${
                category === c ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"
              }`}
            >
              {c ?? t("all")}
            </button>
          ))}
        </div>
        {shown.length === 0 && <p className="mt-8 text-muted-foreground">{tr("لا توجد منتجات بعد.")}</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {shown.map((item) => (
            <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 via-card to-accent/20">
                    <UtensilsCrossed className="size-10 text-primary/60" />
                  </div>
                )}
                {item.popular && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                    <Flame className="size-3" /> {t("mostOrdered")}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-base font-bold sm:text-lg">{item.name}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex flex-1 items-end justify-between gap-2">
                  <span className="text-lg font-black text-primary">{formatPrice(item.price)}</span>
                  <button
                    onClick={() => add(item.id)}
                    className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-black ${
                      addedId === item.id ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {addedId === item.id ? t("added") : t("addToCart")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {count > 0 && cartStore?.id === store.id && (
          <Link
            to="/order"
            className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-6 py-3 font-black text-primary-foreground shadow-lg"
          >
            <ShoppingBag className="size-5" /> {t("myOrder")} ({count})
          </Link>
        )}
      </section>

      {mapsKey && mapSrc && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="text-2xl font-black">{t("visitUs")}</h2>
          {store.address && <p className="mt-1 text-muted-foreground">{store.address}</p>}
          <iframe title={store.name} src={mapSrc} className="mt-4 h-64 w-full rounded-2xl border-0 sm:h-80" loading="lazy" />
        </section>
      )}
    </div>
  );
}
