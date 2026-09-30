import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Search, Star, Store as StoreIcon, Bike, Banknote, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import logo from "@/assets/alpha-logo.jpg.asset.json";
import { listStores } from "@/lib/stores-public.functions";
import { STORE_CATEGORIES } from "@/lib/stores";
import { InstallApp } from "@/components/InstallApp";

const storesQuery = queryOptions({ queryKey: ["stores", "public"], queryFn: () => listStores() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ألفا ديليفري | Alpha Delivery — كل المتاجر في تطبيق واحد" },
      {
        name: "description",
        content: "ألفا ديليفري: اطلب من مطاعم ومتاجر مدينتك، ادفع نقداً عند الاستلام، وموصلونا يوصلون لباب بيتك.",
      },
      { property: "og:title", content: "ألفا ديليفري | Alpha Delivery" },
      { property: "og:description", content: "كل المتاجر في تطبيق واحد — الدفع عند الاستلام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(storesQuery),
  errorComponent: () => <p className="p-10 text-center">تعذر تحميل المتاجر. حاول مجدداً.</p>,
  notFoundComponent: () => <p className="p-10 text-center">غير موجود</p>,
  component: HomePage,
});

function HomePage() {
  const { data: stores } = useSuspenseQuery(storesQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return stores.filter(
      (st) =>
        (!cat || st.category === cat) &&
        (!s ||
          st.name.toLowerCase().includes(s) ||
          (st.tagline ?? "").toLowerCase().includes(s) ||
          (st.category ?? "").includes(s)),
    );
  }, [stores, q, cat]);

  return (
    <div>
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center md:py-16">
          <img src={logo.url} alt="Alpha Delivery" className="size-24 rounded-3xl object-cover shadow-lg" />
          <h1 className="text-3xl font-black sm:text-5xl">
            ألفا <span className="text-primary">ديليفري</span>
          </h1>
          <p className="max-w-xl text-muted-foreground">
            كل مطاعم ومتاجر مدينتك في مكان واحد. اطلب الآن وادفع نقداً عند الاستلام.
          </p>
          <div className="relative w-full max-w-lg">
            <Search className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن متجر أو مطعم..."
              className="w-full rounded-xl border border-input bg-background py-3 pe-4 ps-10 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[null, ...STORE_CATEGORIES].map((c) => (
              <button
                key={c ?? "all"}
                onClick={() => setCat(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  cat === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
                }`}
              >
                {c ?? "الكل"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-black">المتاجر المتاحة</h2>
        {filtered.length === 0 ? (
          <p className="mt-6 text-muted-foreground">لا توجد متاجر مطابقة.</p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((st) => (
              <Link
                key={st.id}
                to="/store/$slug"
                params={{ slug: st.slug }}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition-transform hover:-translate-y-1"
              >
                <div className="relative h-36 bg-secondary" style={{ background: st.primary_color ?? undefined }}>
                  {st.banner_url && (
                    <img src={st.banner_url} alt="" className="size-full object-cover" loading="lazy" />
                  )}
                  {st.featured && (
                    <span className="absolute start-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      مميز
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-3 p-4">
                  <div className="-mt-10 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-card bg-background">
                    {st.logo_url ? (
                      <img src={st.logo_url} alt={st.name} className="size-full object-cover" />
                    ) : (
                      <StoreIcon className="size-7 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold group-hover:text-primary">{st.name}</h3>
                    {st.tagline && <p className="line-clamp-1 text-sm text-muted-foreground">{st.tagline}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {st.rating !== null && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-primary text-primary" /> {st.rating}
                        </span>
                      )}
                      {st.category && <span>{st.category}</span>}
                      {st.address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> <span className="line-clamp-1">{st.address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          <Feature icon={<Banknote className="size-6" />} title="الدفع عند الاستلام" text="تدفع ثمن الطلب والتوصيل نقداً للموصل." />
          <Feature icon={<Bike className="size-6" />} title="شبكة موصلين موحدة" text="موصلون معتمدون يوصلون من كل المتاجر." />
          <Link to="/open-store" className="rounded-2xl border border-primary/40 p-5 hover:bg-primary/5">
            <div className="flex items-center gap-2 font-extrabold text-primary">
              <StoreIcon className="size-6" /> افتح متجرك على ألفا
            </div>
            <p className="mt-2 text-sm text-muted-foreground">سجّل متجرك، صمّم صفحتك وأضف منيوك — ننشره بعد المراجعة.</p>
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10">
          <InstallApp />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 font-extrabold">
        <span className="text-primary">{icon}</span> {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
