import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMenuImage } from "@/lib/menu-admin.functions";
import { STORE_CATEGORIES, storeTheme } from "@/lib/stores";
import { formatPrice } from "@/lib/menu";

export async function uploadImage(file: File): Promise<string> {
  if (file.size > 3 * 1024 * 1024) throw new Error("الصورة كبيرة جداً (الحد 3MB)");
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  buf.forEach((b) => (bin += String.fromCharCode(b)));
  const res = await uploadMenuImage({
    data: { fileName: file.name, contentType: file.type, dataBase64: btoa(bin) },
  });
  return res.url;
}

export type StoreDraft = {
  name: string;
  tagline: string;
  description: string;
  category: string;
  phone: string;
  address: string;
  maps_url: string;
  lat: string;
  lng: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  banner_url: string;
  hours: string;
};

export const emptyDraft: StoreDraft = {
  name: "",
  tagline: "",
  description: "",
  category: STORE_CATEGORIES[0]!,
  phone: "",
  address: "",
  maps_url: "",
  lat: "",
  lng: "",
  primary_color: "#facc15",
  secondary_color: "#f97316",
  logo_url: "",
  banner_url: "",
  hours: "",
};

export function draftToRow(d: StoreDraft) {
  const lat = parseFloat(d.lat);
  const lng = parseFloat(d.lng);
  return {
    name: d.name.trim().slice(0, 80),
    tagline: d.tagline.trim().slice(0, 140) || null,
    description: d.description.trim().slice(0, 1000) || null,
    category: d.category,
    phone: d.phone.trim().slice(0, 30) || null,
    address: d.address.trim().slice(0, 200) || null,
    maps_url: d.maps_url.trim().slice(0, 500) || null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    primary_color: d.primary_color,
    secondary_color: d.secondary_color,
    logo_url: d.logo_url || null,
    banner_url: d.banner_url || null,
    opening_hours: d.hours.trim() ? { text: d.hours.trim().slice(0, 200) } : null,
  };
}

export function rowToDraft(r: Record<string, unknown>): StoreDraft {
  const s = (k: string) => (r[k] == null ? "" : String(r[k]));
  const hours = r.opening_hours as { text?: string } | null;
  return {
    ...emptyDraft,
    name: s("name"),
    tagline: s("tagline"),
    description: s("description"),
    category: s("category") || emptyDraft.category,
    phone: s("phone"),
    address: s("address"),
    maps_url: s("maps_url"),
    lat: s("lat"),
    lng: s("lng"),
    primary_color: s("primary_color") || emptyDraft.primary_color,
    secondary_color: s("secondary_color") || emptyDraft.secondary_color,
    logo_url: s("logo_url"),
    banner_url: s("banner_url"),
    hours: hours?.text ?? "",
  };
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm font-semibold">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ImagePick({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-1 text-sm font-semibold">
      <span>{label}</span>
      <label className="flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-background">
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(null);
            try {
              onChange(await uploadImage(f));
            } catch (x) {
              setErr(x instanceof Error ? x.message : "فشل الرفع");
            }
            setBusy(false);
          }}
        />
      </label>
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}

export function StoreProfileForm({ value, onChange }: { value: StoreDraft; onChange: (d: StoreDraft) => void }) {
  const set = (k: keyof StoreDraft) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم المتجر *">
          <input className={inputCls} value={value.name} onChange={(e) => set("name")(e.target.value)} />
        </Field>
        <Field label="التصنيف">
          <select className={inputCls} value={value.category} onChange={(e) => set("category")(e.target.value)}>
            {STORE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="شعار قصير">
          <input className={inputCls} value={value.tagline} onChange={(e) => set("tagline")(e.target.value)} />
        </Field>
        <Field label="الهاتف *">
          <input className={inputCls} dir="ltr" value={value.phone} onChange={(e) => set("phone")(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="وصف المتجر">
            <textarea rows={3} className={inputCls} value={value.description} onChange={(e) => set("description")(e.target.value)} />
          </Field>
        </div>
        <Field label="العنوان *">
          <input className={inputCls} value={value.address} onChange={(e) => set("address")(e.target.value)} />
        </Field>
        <Field label="ساعات العمل">
          <input className={inputCls} placeholder="يومياً 11:00 - 23:00" value={value.hours} onChange={(e) => set("hours")(e.target.value)} />
        </Field>
        <Field label="رابط قوقل مابس">
          <input className={inputCls} dir="ltr" value={value.maps_url} onChange={(e) => set("maps_url")(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="خط العرض">
            <input className={inputCls} dir="ltr" value={value.lat} onChange={(e) => set("lat")(e.target.value)} />
          </Field>
          <Field label="خط الطول">
            <input className={inputCls} dir="ltr" value={value.lng} onChange={(e) => set("lng")(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            className="text-xs font-bold text-primary underline"
            onClick={() =>
              navigator.geolocation?.getCurrentPosition((p) =>
                onChange({ ...value, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }),
              )
            }
          >
            استخدم موقعي الحالي كموقع المتجر
          </button>
        </div>
        <Field label="اللون الأساسي">
          <input type="color" className="h-10 w-full cursor-pointer rounded-lg" value={value.primary_color} onChange={(e) => set("primary_color")(e.target.value)} />
        </Field>
        <Field label="اللون الثانوي">
          <input type="color" className="h-10 w-full cursor-pointer rounded-lg" value={value.secondary_color} onChange={(e) => set("secondary_color")(e.target.value)} />
        </Field>
        <ImagePick label="الشعار (لوقو)" value={value.logo_url} onChange={set("logo_url")} />
        <ImagePick label="صورة الغلاف" value={value.banner_url} onChange={set("banner_url")} />
      </div>
      <div>
        <p className="mb-2 text-sm font-bold">معاينة مباشرة</p>
        <StorePreview d={value} />
      </div>
    </div>
  );
}

export function StorePreview({ d }: { d: StoreDraft }) {
  return (
    <div style={storeTheme(d.primary_color, d.secondary_color)} className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="h-28" style={{ background: d.primary_color }}>
        {d.banner_url && <img src={d.banner_url} alt="" className="size-full object-cover" />}
      </div>
      <div className="p-4">
        <div className="-mt-12 size-16 overflow-hidden rounded-xl border-4 border-card bg-background">
          {d.logo_url && <img src={d.logo_url} alt="" className="size-full object-cover" />}
        </div>
        <h3 className="mt-2 text-lg font-black">{d.name || "اسم متجرك"}</h3>
        <p className="text-sm text-muted-foreground">{d.tagline || "شعار قصير"}</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">اطلب الآن</span>
          <span className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">المنيو</span>
        </div>
      </div>
    </div>
  );
}

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  popular: boolean;
  available: boolean;
  sort_order: number;
};

const blank = (): Item => ({
  id: "",
  name: "",
  description: "",
  price: 0,
  category: "",
  image_url: null,
  popular: false,
  available: true,
  sort_order: 0,
});

export function StoreMenuEditor({ storeId }: { storeId: string }) {
  const [rows, setRows] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,name,description,price,category,image_url,popular,available,sort_order")
      .eq("store_id", storeId)
      .order("category")
      .order("sort_order");
    if (error) setErr(error.message);
    setRows((data ?? []) as Item[]);
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!editing || !editing.name.trim() || !editing.category.trim()) {
      setErr("الاسم والصنف مطلوبان");
      return;
    }
    setBusy(true);
    setErr(null);
    const fields = {
      name: editing.name.trim(),
      description: editing.description || null,
      price: Number(editing.price) || 0,
      category: editing.category.trim(),
      image_url: editing.image_url,
      popular: editing.popular,
      available: editing.available,
      sort_order: Number(editing.sort_order) || 0,
    };
    const { error } = editing.id
      ? await supabase.from("menu_items").update(fields).eq("id", editing.id)
      : await supabase.from("menu_items").insert({ ...fields, id: `s-${crypto.randomUUID()}`, store_id: storeId });
    if (error) setErr(error.message);
    else {
      setEditing(null);
      await load();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) setErr(error.message);
    await load();
  }

  const cats = Array.from(new Set(rows.map((r) => r.category)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} منتج</p>
        <button
          onClick={() => setEditing({ ...blank(), category: cats[0] ?? "" })}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          <Plus className="size-4" /> إضافة منتج
        </button>
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}

      {editing && (
        <div className="grid gap-3 rounded-2xl border border-primary/40 bg-card p-4 sm:grid-cols-2">
          <Field label="الاسم *">
            <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </Field>
          <Field label="الصنف * (مثلاً: بيتزا)">
            <input list="cats" className={inputCls} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <datalist id="cats">
              {cats.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="السعر (دج)">
            <input type="number" className={inputCls} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
          </Field>
          <Field label="الترتيب">
            <input type="number" className={inputCls} value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="الوصف">
              <input className={inputCls} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </Field>
          </div>
          <ImagePick label="صورة المنتج" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} />
          <div className="flex flex-col justify-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editing.popular} onChange={(e) => setEditing({ ...editing, popular: e.target.checked })} /> الأكثر طلباً
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editing.available} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} /> متوفر
            </label>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} onClick={() => void save()} className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
              حفظ
            </button>
            <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-5 py-2 text-sm font-bold">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {cats.map((c) => (
        <div key={c}>
          <h4 className="mb-2 font-extrabold">{c}</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows
              .filter((r) => r.category === c)
              .map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {r.image_url && <img src={r.image_url} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${r.available ? "" : "line-through opacity-60"}`}>{r.name}</p>
                    <p className="text-xs text-primary">{formatPrice(Number(r.price))}</p>
                  </div>
                  <button aria-label="تعديل" onClick={() => setEditing(r)} className="p-2 text-muted-foreground hover:text-foreground">
                    <Pencil className="size-4" />
                  </button>
                  <button aria-label="حذف" onClick={() => void remove(r.id)} className="p-2 text-red-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
