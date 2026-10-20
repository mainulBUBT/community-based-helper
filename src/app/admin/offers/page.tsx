"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { deletePromo, listAllPromos, savePromo } from "@/services/admin/offers";
import { listAllSellers } from "@/services/admin/sellers";
import type { Promo, Seller } from "@/types/catalog";

const KINDS = ["কার্ড", "bKash", "Nagad", "কিস্তি", "কুপন", "উপহার", "অন্যান্য"];
const iconButton = "flex size-10 items-center justify-center rounded-xl border border-line text-dim hover:border-brand hover:text-brand";

async function loadData() {
  const [promos, sellers] = await Promise.all([listAllPromos(), listAllSellers()]);
  return { promos, sellers };
}

function PromoForm({ promo, sellers, onClose }: { promo: Promo; sellers: Seller[]; onClose: (saved: boolean) => void }) {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim() || null;
    await savePromo({
      ...promo,
      sellerId: String(form.get("seller")),
      kind: String(form.get("kind")),
      text: value("text") ?? "",
      scope: value("scope"),
      endsOn: value("endsOn"),
      active: form.get("active") === "on",
    });
    showToast("অফার সেভ হলো");
    onClose(true);
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <Field label="অফারের লেখা" name="text" defaultValue={promo.text} required placeholder="যেমন City Bank কার্ডে ১০% টাকা ফেরত" />
      </div>
      <Select label="বিক্রেতা" name="seller" defaultValue={promo.sellerId || sellers[0]?.id}>
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select label="ধরন" name="kind" defaultValue={promo.kind || KINDS[0]}>
        {KINDS.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </Select>
      <Field label="কোথায় খাটে" name="scope" defaultValue={promo.scope ?? ""} placeholder="যেমন সব মোবাইলে" />
      <Field label="শেষ তারিখ" name="endsOn" type="date" defaultValue={promo.endsOn ?? ""} />
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked={promo.active} className="size-5 accent-[#1f2f55]" />
        এখনই সাইটে দেখান
      </label>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" className={primaryButton}>
          সেভ করুন
        </button>
        <button type="button" onClick={() => onClose(false)} className={secondaryButton}>
          বাতিল
        </button>
      </div>
    </form>
  );
}

const EMPTY: Promo = { id: "", sellerId: "", kind: "", text: "", scope: null, endsOn: null, active: true };

export default function OffersAdminPage() {
  const { data, loading, reload } = useAsync(loadData, []);
  const [editing, setEditing] = useState<Promo | null>(null);
  if (loading || !data) return <ListSkeleton />;
  const names = new Map(data.sellers.map((s) => [s.id, s.name]));

  return (
    <>
      <PageTitle
        title="অফার"
        subtitle="চালু অফারগুলো পণ্যের পেজে দামের নিচে আর বিক্রেতার পেজে দেখায়।"
        action={
          <button type="button" onClick={() => setEditing(EMPTY)} className={primaryButton}>
            নতুন অফার
          </button>
        }
      />
      {editing && (
        <div className="mb-6">
          <Panel title={editing.id ? "অফার সম্পাদনা" : "নতুন অফার"}>
            <PromoForm
              key={editing.id || "new"}
              promo={editing}
              sellers={data.sellers}
              onClose={(saved) => {
                setEditing(null);
                if (saved) reload();
              }}
            />
          </Panel>
        </div>
      )}
      <Panel>
        <ul className="divide-y divide-line-soft">
          {data.promos.map((promo) => (
            <li key={promo.id} className="flex items-center gap-3 px-5 py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="font-semibold">{promo.text}</p>
                <p className="text-[13px] text-dim">
                  {[names.get(promo.sellerId), promo.scope, promo.endsOn ? `${promo.endsOn} পর্যন্ত` : "শেষ তারিখ লেখা নেই"].filter(Boolean).join(", ")}
                </p>
                <span>
                  <Badge>{promo.kind}</Badge>
                </span>
              </div>
              <Toggle
                label={`${promo.text} চালু`}
                checked={promo.active}
                onChange={async (active) => {
                  await savePromo({ ...promo, active });
                  showToast(active ? "অফার চালু হলো" : "অফার বন্ধ হলো");
                  reload();
                }}
              />
              <button type="button" aria-label="সম্পাদনা" onClick={() => setEditing(promo)} className={iconButton}>
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="মুছুন"
                className={iconButton}
                onClick={async () => {
                  if (!confirm("অফারটা মুছে ফেলবেন?")) return;
                  await deletePromo(promo);
                  showToast("মুছে ফেলা হলো");
                  reload();
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
