import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type Ticket = { id: string; email: string; message: string; status: string; created_at: string };

export function SupportManager() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Ticket[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Ticket[]);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function resolve(id: string) {
    await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", id);
    void load();
  }

  if (!rows.length) return <p className="mt-8 text-muted-foreground">{t("noTickets")}</p>;
  return (
    <div className="mt-8 space-y-3">
      {rows.map((r) => (
        <div key={r.id} className={`rounded-xl border border-border bg-card p-4 ${r.status === "resolved" ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <bdi dir="ltr" className="font-bold">{r.email}</bdi>
            <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`mailto:${r.email}?subject=${encodeURIComponent("Alpha Delivery")}`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("replyByEmail")}</a>
            {r.status !== "resolved" && (
              <button onClick={() => void resolve(r.id)} className="rounded-lg border border-border px-4 py-2 text-sm font-bold">
                {t("markResolved")}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
