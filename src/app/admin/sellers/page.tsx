"use client";

import { useState } from "react";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useI18n";
import type { Messages } from "@/i18n/bn";
import { showToast } from "@/lib/toast";
import { deleteSeller, listAllSellers, saveSeller } from "@/services/admin/sellers";
import type { Seller, SellerKind } from "@/types/catalog";

const EMPTY: Seller = { id: "", name: "", kind: "shop", website: null, phone: null, whatsapp: null, facebook: null, area: null, verified: false, active: true };

const orNull = (value: FormDataEntryValue | null) => String(value ?? "").trim() || null;

function SellerForm({ seller, onClose }: { seller: Seller; onClose: (saved: boolean) => void }) {
  const { t } = useAdminI18n();
  const [kind, setKind] = useState<SellerKind>(seller.kind);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Seller = {
      ...seller,
      name: String(form.get("name")).trim(),
      kind,
      website: kind === "website" ? orNull(form.get("website")) : null,
      phone: orNull(form.get("phone")),
      whatsapp: orNull(form.get("whatsapp")),
      facebook: orNull(form.get("facebook")),
      area: orNull(form.get("area")),
      verified: form.get("verified") === "on",
    };
    if (!next.website && !next.phone) {
      showToast(t.admin.sellers.needWebsiteOrPhone);
      return;
    }
    setBusy(true);
    try {
      await saveSeller(next);
      showToast(t.admin.common.saved);
      onClose(true);
    } catch {
      showToast(t.admin.common.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label={t.admin.sellers.name} name="name" defaultValue={seller.name} required />
      <Select label={t.admin.sellers.kind} value={kind} onChange={(e) => setKind(e.target.value as SellerKind)}>
        {(Object.entries(t.sellerKind) as [SellerKind, string][]).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      {kind === "website" && <Field label={t.admin.sellers.website} name="website" type="url" defaultValue={seller.website ?? ""} placeholder="https://" />}
      <Field
        label={t.admin.sellers.phone}
        name="phone"
        type="tel"
        defaultValue={seller.phone ?? ""}
        hint={kind === "website" ? t.admin.sellers.phoneHintOptional : t.admin.sellers.phoneHintRequired}
      />
      <Field label="WhatsApp" name="whatsapp" type="tel" defaultValue={seller.whatsapp ?? ""} />
      <Field label={t.admin.sellers.facebook} name="facebook" type="url" defaultValue={seller.facebook ?? ""} />
      <Field label={t.admin.sellers.area} name="area" defaultValue={seller.area ?? ""} placeholder={t.admin.sellers.areaPlaceholder} />
      <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold">
        <input type="checkbox" name="verified" defaultChecked={seller.verified} className="size-5 accent-[var(--color-brand)]" />
        {t.admin.sellers.verified}
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

export default function SellersAdminPage() {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const { data, loading, reload } = useAsync(listAllSellers, []);
  const [editing, setEditing] = useState<Seller | null>(null);

  async function update(seller: Seller, patch: Partial<Seller>, message: string) {
    if (await run(() => saveSeller({ ...seller, ...patch }), message)) reload();
  }

  return (
    <>
      <PageTitle
        title={t.admin.sellers.title}
        subtitle={t.admin.sellers.subtitle}
        action={
          <button type="button" onClick={() => setEditing(EMPTY)} className={primaryButton}>
            {t.admin.sellers.new}
          </button>
        }
      />
      {editing && (
        <div className="mb-6">
          <Panel title={editing.id ? t.admin.sellers.editTitle(editing.name) : t.admin.sellers.newTitle}>
            <SellerForm
              key={editing.id || "new"}
              seller={editing}
              onClose={(saved) => {
                setEditing(null);
                if (saved) reload();
              }}
            />
          </Panel>
        </div>
      )}
      {loading || !data ? (
        <ListSkeleton />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[15px]">
              <thead className="text-[13px] text-dim">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t.admin.sellers.colName}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.sellers.colKind}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.sellers.colContact}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.sellers.colVerified}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.sellers.colActive}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {data.map((seller) => (
                  <tr key={seller.id}>
                    <td className="px-5 py-3">
                      <p className="font-semibold">{seller.name}</p>
                      {seller.area && <p className="text-[13px] text-dim">{seller.area}</p>}
                    </td>
                    <td className="px-3 py-3 text-dim">{t.sellerKind[seller.kind as keyof Messages["sellerKind"]]}</td>
                    <td className="px-3 py-3 text-[13px]">{seller.website ? new URL(seller.website).hostname : seller.phone}</td>
                    <td className="px-3 py-3">
                      <Toggle
                        label={`${seller.name} ${t.admin.sellers.colVerified}`}
                        checked={seller.verified}
                        disabled={busy}
                        onChange={(verified) => update(seller, { verified }, verified ? t.admin.sellers.verifiedOn : t.admin.sellers.verifiedOff)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Toggle
                        label={`${seller.name} ${t.admin.sellers.colActive}`}
                        checked={seller.active}
                        disabled={busy}
                        onChange={(active) => update(seller, { active }, active ? t.admin.sellers.activeOn : t.admin.sellers.activeOff)}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(seller)} className={secondaryButton}>
                          {t.admin.common.edit}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(t.admin.sellers.confirmDelete(seller.name))) return;
                            if (await run(() => deleteSeller(seller), t.admin.common.deleted)) reload();
                          }}
                          className="h-10 rounded-xl border border-line px-3 text-sm font-semibold text-danger hover:border-danger"
                        >
                          {t.admin.common.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
