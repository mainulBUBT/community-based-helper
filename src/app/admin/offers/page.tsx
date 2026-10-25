"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { deletePromo, listAllPromos, savePromo } from "@/services/admin/offers";
import { listAllSellers } from "@/services/admin/sellers";
import type { Promo, Seller } from "@/types/catalog";

const iconButton = "flex size-10 items-center justify-center rounded-xl border border-line text-dim hover:border-brand hover:text-brand";

async function loadData() {
  const [promos, sellers] = await Promise.all([listAllPromos(), listAllSellers()]);
  return { promos, sellers };
}

function PromoForm({ promo, sellers, onClose }: { promo: Promo; sellers: Seller[]; onClose: (saved: boolean) => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim() || null;
    const saved = await run(
      () =>
        savePromo({
          ...promo,
          sellerId: String(form.get("seller")),
          kind: String(form.get("kind")),
          text: value("text") ?? "",
          scope: value("scope"),
          endsOn: value("endsOn"),
          active: form.get("active") === "on",
        }),
      t.admin.offers.saved,
    );
    if (saved) onClose(true);
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <Field label={t.admin.offers.text} name="text" defaultValue={promo.text} required placeholder={t.admin.offers.textPlaceholder} />
      </div>
      <Select label={t.admin.offers.seller} name="seller" defaultValue={promo.sellerId || sellers[0]?.id}>
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select label={t.admin.offers.kind} name="kind" defaultValue={promo.kind || t.admin.offers.kinds[0]}>
        {t.admin.offers.kinds.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </Select>
      <Field label={t.admin.offers.scope} name="scope" defaultValue={promo.scope ?? ""} placeholder={t.admin.offers.scopePlaceholder} />
      <Field label={t.admin.offers.endsOn} name="endsOn" type="date" defaultValue={promo.endsOn ?? ""} />
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked={promo.active} className="size-5 accent-[var(--color-brand)]" />
        {t.admin.offers.showNow}
      </label>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          {t.admin.common.save}
        </button>
        <button type="button" onClick={() => onClose(false)} className={secondaryButton}>
          {t.admin.common.cancel}
        </button>
      </div>
    </form>
  );
}

const EMPTY: Promo = { id: "", sellerId: "", kind: "", text: "", scope: null, endsOn: null, active: true };

export default function OffersAdminPage() {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const { data, loading, reload } = useAsync(loadData, []);
  const [editing, setEditing] = useState<Promo | null>(null);
  if (loading || !data) return <ListSkeleton />;
  const names = new Map(data.sellers.map((s) => [s.id, s.name]));

  return (
    <>
      <PageTitle
        title={t.admin.offers.title}
        subtitle={t.admin.offers.subtitle}
        action={
          <button type="button" onClick={() => setEditing(EMPTY)} className={primaryButton}>
            {t.admin.offers.new}
          </button>
        }
      />
      {editing && (
        <div className="mb-6">
          <Panel title={editing.id ? t.admin.offers.editTitle : t.admin.offers.newTitle}>
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
                  {[names.get(promo.sellerId), promo.scope, promo.endsOn ? t.admin.offers.until(promo.endsOn) : t.admin.offers.noEndDate].filter(Boolean).join(", ")}
                </p>
                <span>
                  <Badge>{promo.kind}</Badge>
                </span>
              </div>
              <Toggle
                label={`${promo.text} ${t.admin.offers.title}`}
                checked={promo.active}
                disabled={busy}
                onChange={async (active) => {
                  if (await run(() => savePromo({ ...promo, active }), active ? t.admin.offers.activeOn : t.admin.offers.activeOff)) reload();
                }}
              />
              <button type="button" aria-label={t.admin.common.edit} onClick={() => setEditing(promo)} className={iconButton}>
                <Pencil size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={t.admin.common.delete}
                className={iconButton}
                onClick={async () => {
                  if (!confirm(t.admin.offers.confirmDelete)) return;
                  if (await run(() => deletePromo(promo), t.admin.common.deleted)) reload();
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
