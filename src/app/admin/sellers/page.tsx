"use client";

import { useState } from "react";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { FilterSelect, ListFooter, SearchBox, StatusFilter } from "@/components/admin/ListSearch";
import { Toggle } from "@/components/admin/Toggle";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { useListSearch } from "@/hooks/useListSearch";
import type { Messages } from "@/i18n/bn";
import { showToast } from "@/lib/toast";
import { deleteSeller, listAllSellers, saveSeller } from "@/services/admin/sellers";
import type { Seller, SellerDelivery, SellerKind } from "@/types/catalog";

const EMPTY: Seller = { id: "", name: "", kind: "shop", website: null, phone: null, whatsapp: null, facebook: null, area: null, verified: false, active: true };

const orNull = (value: FormDataEntryValue | null) => String(value ?? "").trim() || null;
const amount = (value: FormDataEntryValue | null) => {
  const n = Number(String(value ?? "").trim());
  return String(value ?? "").trim() && Number.isInteger(n) && n >= 0 ? n : null;
};
const DELIVERY_KEYS = ["dhaka", "outside", "minDays", "maxDays", "cod", "returnDays"] as const;
const sameDelivery = (a: SellerDelivery | null | undefined, b: SellerDelivery | null) => DELIVERY_KEYS.every((key) => (a?.[key] ?? null) === (b?.[key] ?? null));

function readDelivery(form: FormData): SellerDelivery | null {
  const cod = form.get("cod");
  const delivery: SellerDelivery = {
    dhaka: amount(form.get("dhaka")),
    outside: amount(form.get("outside")),
    minDays: amount(form.get("minDays")),
    maxDays: amount(form.get("maxDays")),
    cod: cod === "yes" ? true : cod === "no" ? false : null,
    returnDays: amount(form.get("returnDays")),
  };
  return DELIVERY_KEYS.some((key) => delivery[key] != null) ? delivery : null;
}

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
    const delivery = readDelivery(form);
    const deliveryChanged = !sameDelivery(seller.delivery, delivery);
    if (!next.website && !next.phone) {
      showToast(t.admin.sellers.needWebsiteOrPhone);
      return;
    }
    setBusy(true);
    try {
      await saveSeller(deliveryChanged ? { ...next, delivery } : next, deliveryChanged);
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
      <Field label="WhatsApp" name="whatsapp" type="tel" defaultValue={seller.whatsapp ?? ""} hint={t.admin.sellers.phoneHintOptional} />
      <Field label={t.admin.sellers.facebook} name="facebook" type="url" defaultValue={seller.facebook ?? ""} />
      <Field label={t.admin.sellers.area} name="area" defaultValue={seller.area ?? ""} placeholder={t.admin.sellers.areaPlaceholder} />
      <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold">
        <input type="checkbox" name="verified" defaultChecked={seller.verified} className="size-5 accent-[var(--color-brand)]" />
        {t.admin.sellers.verified}
      </label>
      <fieldset className="grid gap-4 border-t border-line-soft pt-4 md:col-span-2 md:grid-cols-3">
        <legend className="pt-4 text-sm font-semibold">{t.admin.sellers.delivery}</legend>
        <p className="text-[13px] text-dim md:col-span-3">{t.admin.sellers.deliveryHint}</p>
        <Field label={t.admin.sellers.deliveryDhaka} name="dhaka" type="number" min={0} defaultValue={seller.delivery?.dhaka ?? ""} />
        <Field label={t.admin.sellers.deliveryOutside} name="outside" type="number" min={0} defaultValue={seller.delivery?.outside ?? ""} />
        <Select label={t.admin.sellers.cod} name="cod" defaultValue={seller.delivery?.cod == null ? "" : seller.delivery.cod ? "yes" : "no"}>
          <option value="">{t.admin.sellers.codUnknown}</option>
          <option value="yes">{t.admin.sellers.codYes}</option>
          <option value="no">{t.admin.sellers.codNo}</option>
        </Select>
        <Field label={t.admin.sellers.deliveryMinDays} name="minDays" type="number" min={0} defaultValue={seller.delivery?.minDays ?? ""} />
        <Field label={t.admin.sellers.deliveryMaxDays} name="maxDays" type="number" min={0} defaultValue={seller.delivery?.maxDays ?? ""} />
        <Field label={t.admin.sellers.returnDays} name="returnDays" type="number" min={0} defaultValue={seller.delivery?.returnDays ?? ""} />
      </fieldset>
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
  const [kindFilter, setKindFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const list = useListSearch(
    data ?? [],
    (s) => [s.name, s.area, s.phone, s.whatsapp, s.website, s.facebook, t.sellerKind[s.kind as keyof Messages["sellerKind"]]],
    (s) => (!kindFilter || s.kind === kindFilter) && (!verifiedFilter || String(s.verified) === verifiedFilter) && (!activeFilter || String(s.active) === activeFilter),
  );

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
          <div className="flex flex-wrap gap-3 border-b border-line-soft p-4">
            <SearchBox value={list.query} onChange={list.search} placeholder={t.admin.sellers.search} />
            <FilterSelect
              label={t.admin.sellers.colKind}
              value={kindFilter}
              onChange={list.filterBy(setKindFilter)}
              options={[{ value: "", label: t.admin.sellers.allKinds }, ...(Object.entries(t.sellerKind) as [SellerKind, string][]).map(([value, label]) => ({ value, label }))]}
            />
            <FilterSelect
              label={t.admin.sellers.colVerified}
              value={verifiedFilter}
              onChange={list.filterBy(setVerifiedFilter)}
              options={[
                { value: "", label: t.admin.sellers.anyVerified },
                { value: "true", label: t.admin.sellers.onlyVerified },
                { value: "false", label: t.admin.sellers.onlyUnverified },
              ]}
            />
            <StatusFilter label={t.admin.sellers.colActive} value={activeFilter} onChange={list.filterBy(setActiveFilter)} />
          </div>
          <div className="overflow-x-auto">
            <table className="card-table w-full text-left text-[15px] xl:min-w-[760px]">
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
              <tbody className="divide-line-soft xl:divide-y">
                {list.items.map((seller) => (
                  <tr key={seller.id}>
                    <td className="px-5 py-3">
                      <p className="font-semibold">{seller.name}</p>
                      {seller.area && <p className="text-[13px] text-dim">{seller.area}</p>}
                    </td>
                    <td data-label={t.admin.sellers.colKind} className="px-3 py-3 text-dim max-xl:text-[13px]">{t.sellerKind[seller.kind as keyof Messages["sellerKind"]]}</td>
                    <td data-label={t.admin.sellers.colContact} className="px-3 py-3 text-[13px]">{seller.website ? new URL(seller.website).hostname : seller.phone}</td>
                    <td data-label={t.admin.sellers.colVerified} className="px-3 py-3">
                      <Toggle
                        label={`${seller.name} ${t.admin.sellers.colVerified}`}
                        checked={seller.verified}
                        disabled={busy}
                        onChange={(verified) => update(seller, { verified }, verified ? t.admin.sellers.verifiedOn : t.admin.sellers.verifiedOff)}
                      />
                    </td>
                    <td data-label={t.admin.sellers.colActive} className="px-3 py-3">
                      <Toggle
                        label={`${seller.name} ${t.admin.sellers.colActive}`}
                        checked={seller.active}
                        disabled={busy}
                        onChange={(active) => update(seller, { active }, active ? t.admin.sellers.activeOn : t.admin.sellers.activeOff)}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2 max-xl:*:flex-1">
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
          <ListFooter noMatch={list.noMatch} page={list.page} pages={list.pages} onPage={list.setPage} />
        </Panel>
      )}
    </>
  );
}
