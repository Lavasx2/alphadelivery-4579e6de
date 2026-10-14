import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bike, CheckCircle2, Clock, PackageCheck, XCircle } from "lucide-react";
import { getOrderStatus } from "@/lib/order-status.functions";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/menu";

type Status = Awaited<ReturnType<typeof getOrderStatus>>;

export function OrderStatusCard({ id, onFinished }: { id: string; onFinished: () => void }) {
  const { t } = useI18n();
  const [st, setSt] = useState<Status | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const load = () => getOrderStatus({ data: { id } }).then((r) => alive && setSt(r)).catch(() => {});
    void load();
    const iv = setInterval(load, 10000);
    return () => { alive = false; clearInterval(iv); };
  }, [id]);

  if (st === undefined) {
    return <div className="mx-auto max-w-lg px-4 py-24 text-center text-muted-foreground">{t("loading")}</div>;
  }
  if (st === null) {
    onFinished();
    return null;
  }

  const finished = st.status === "delivered" || st.status === "cancelled" || st.status === "rejected";
  const steps = [
    { key: "new", label: t("statusPending"), icon: Clock },
    { key: "delivering", label: t("statusAccepted"), icon: Bike },
    { key: "delivered", label: t("statusDelivered"), icon: PackageCheck },
  ];
  const idx = st.status === "delivered" ? 2 : st.status === "delivering" ? 1 : 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-center text-2xl font-black sm:text-3xl">{t("orderStatusTitle")}</h1>
      {st.storeName && <p className="mt-1 text-center font-bold text-primary">{st.storeName}</p>}

      {st.status === "cancelled" || st.status === "rejected" ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <XCircle className="size-12 text-destructive" />
          <p className="mt-3 font-bold">{t("statusCancelled")}</p>
        </div>
      ) : (
        <ol className="mt-8 space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const reached = i <= idx;
            return (
              <li
                key={s.key}
                className={`flex items-center gap-4 rounded-2xl border p-4 ${reached ? "border-primary bg-primary/10" : "border-border bg-card opacity-60"}`}
              >
                <span className={`flex size-10 items-center justify-center rounded-full ${reached ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  {i < idx ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                </span>
                <div>
                  <p className="font-bold">{s.label}</p>
                  {s.key === "delivering" && reached && st.courierName && (
                    <p className="text-sm text-muted-foreground">
                      {t("courierLabel")}: {st.courierName}
                      {st.courierPhone && <> — <bdi dir="ltr">{st.courierPhone}</bdi></>}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-6 text-center font-black text-primary">{t("total")}: {formatPrice(st.total)}</p>
      {!finished && <p className="mt-2 text-center text-xs text-muted-foreground">{t("oneOrderAtATime")}</p>}

      {finished && (
        <div className="mt-6 flex justify-center">
          <Link to="/" onClick={onFinished} className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">
            {t("newOrder")}
          </Link>
        </div>
      )}
      <div className="mt-4 text-center">
        <Link to="/support" className="text-sm text-primary underline">{t("support")}</Link>
      </div>
    </div>
  );
}
