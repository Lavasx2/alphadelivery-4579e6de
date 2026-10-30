import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

// Owner-only generic table editor. Access is enforced by row-level security on each table.
const TABLES: { name: string; pk: string }[] = [
  { name: "stores", pk: "id" },
  { name: "menu_items", pk: "id" },
  { name: "orders", pk: "id" },
  { name: "courier_applications", pk: "id" },
  { name: "support_tickets", pk: "id" },
  { name: "customer_reports", pk: "id" },
  { name: "customer_bans", pk: "id" },
  { name: "profiles", pk: "id" },
  { name: "user_roles", pk: "id" },
  { name: "app_settings", pk: "key" },
];

type Row = Record<string, unknown>;
const LOCKED = new Set(["id", "created_at", "updated_at"]);

const toText = (v: unknown) =>
  v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);

function fromText(text: string, original: unknown): unknown {
  if (text === "") return null;
  if (typeof original === "number") return Number(text);
  if (typeof original === "boolean") return text === "true";
  if (original !== null && typeof original === "object") return JSON.parse(text);
  return text;
}

export function DatabaseManager() {
  const { t } = useI18n();
  const [table, setTable] = useState(TABLES[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setMsg("");
    const db = supabase as unknown as { from: (n: string) => any };
    let q = db.from(table.name).select("*").limit(200);
    if (table.pk === "id" && table.name !== "app_settings") q = q.order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) setMsg(error.message);
    setRows((data as Row[]) ?? []);
  }, [table]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = rows.filter((r) =>
    !search ? true : JSON.stringify(r).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABLES.map((x) => (
          <button
            key={x.name}
            onClick={() => setTable(x)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              table.name === x.name ? "bg-primary text-primary-foreground" : "border border-border bg-card"
            }`}
          >
            {x.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          placeholder={t("dbSearch")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={load} className="rounded-lg border border-border px-4 text-sm font-bold">
          {t("dbRefresh")}
        </button>
      </div>
      {msg && <p className="text-sm text-destructive">{msg}</p>}
      <p className="text-xs text-muted-foreground">
        {visible.length} {t("dbRows")}
      </p>
      {visible.map((r) => (
        <RowEditor key={String(r[table.pk])} table={table} row={r} onDone={load} />
      ))}
    </div>
  );
}

function RowEditor({ table, row, onDone }: { table: { name: string; pk: string }; row: Row; onDone: () => void }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, toText(v)])),
  );
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const db = supabase as unknown as { from: (n: string) => any };
  const pkVal = row[table.pk];

  const save = async () => {
    setMsg("");
    try {
      const patch: Row = {};
      for (const [k, v] of Object.entries(draft)) {
        if (LOCKED.has(k) || k === table.pk) continue;
        if (v !== toText(row[k])) patch[k] = fromText(v, row[k]);
      }
      if (!Object.keys(patch).length) return;
      const { error } = await db.from(table.name).update(patch).eq(table.pk, pkVal);
      setMsg(error ? error.message : t("saved"));
      if (!error) onDone();
    } catch {
      setMsg(t("dbInvalid"));
    }
  };

  const remove = async () => {
    if (!confirm(t("dbDeleteConfirm"))) return;
    const { error } = await db.from(table.name).delete().eq(table.pk, pkVal);
    if (error) setMsg(error.message);
    else onDone();
  };

  const title = toText(row["name"] ?? row["customer_name"] ?? row["email"] ?? row["full_name"] ?? row["key"] ?? pkVal);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <button onClick={() => setOpen(!open)} className="flex w-full justify-between text-start text-sm font-bold">
        <span className="truncate">{title}</span>
        <span className="text-xs text-muted-foreground">{toText(row["created_at"]).slice(0, 10)}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {Object.keys(draft).map((k) => (
            <label key={k} className="block text-xs">
              <span className="font-semibold text-muted-foreground">{k}</span>
              <textarea
                rows={(draft[k] ?? "").length > 60 ? 3 : 1}
                disabled={LOCKED.has(k) || k === table.pk}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1 font-mono text-xs disabled:opacity-60"
                value={draft[k] ?? ""}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              {t("save")}
            </button>
            <button onClick={remove} className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground">
              {t("dbDelete")}
            </button>
          </div>
          {msg && <p className="text-xs">{msg}</p>}
        </div>
      )}
    </div>
  );
}
