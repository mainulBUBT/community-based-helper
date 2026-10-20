"use client";

import { useState } from "react";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SELLER_KIND_LABEL } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { deleteSeller, listAllSellers, saveSeller } from "@/services/admin/sellers";
import type { Seller, SellerKind } from "@/types/catalog";

const EMPTY: Seller = { id: "", name: "", kind: "shop", website: null, phone: null, whatsapp: null, facebook: null, area: null, verified: false, active: true };

const orNull = (value: FormDataEntryValue | null) => String(value ?? "").trim() || null;

function SellerForm({ seller, onClose }: { seller: Seller; onClose: (saved: boolean) => void }) {
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
      showToast("ওয়েবসাইট না থাকলে ফোন নম্বর লাগবে");
      return;
    }
    setBusy(true);
    try {
      await saveSeller(next);
      showToast("সেভ হলো");
      onClose(true);
    } catch {
      showToast("সেভ করা গেল না");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label="নাম" name="name" defaultValue={seller.name} required />
      <Select label="ধরন" value={kind} onChange={(e) => setKind(e.target.value as SellerKind)}>
        {Object.entries(SELLER_KIND_LABEL).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      {kind === "website" && <Field label="ওয়েবসাইট" name="website" type="url" defaultValue={seller.website ?? ""} placeholder="https://" />}
      <Field label="ফোন" name="phone" type="tel" defaultValue={seller.phone ?? ""} hint={kind === "website" ? "না দিলেও চলবে" : "সাইটে দেখানো হবে"} />
      <Field label="WhatsApp" name="whatsapp" type="tel" defaultValue={seller.whatsapp ?? ""} />
      <Field label="ফেসবুক পেজ বা গ্রুপ" name="facebook" type="url" defaultValue={seller.facebook ?? ""} />
      <Field label="এলাকা বা মার্কেট" name="area" defaultValue={seller.area ?? ""} placeholder="যেমন বসুন্ধরা সিটি" />
      <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold">
        <input type="checkbox" name="verified" defaultChecked={seller.verified} className="size-5 accent-[#1f2f55]" />
        যাচাই করা বিক্রেতা
      </label>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          সেভ করুন
        </button>
        <button type="button" onClick={() => onClose(false)} className={secondaryButton}>
          বাতিল
        </button>
      </div>
    </form>
  );
}

export default function SellersAdminPage() {
  const { data, loading, reload } = useAsync(listAllSellers, []);
  const [editing, setEditing] = useState<Seller | null>(null);

  async function update(seller: Seller, patch: Partial<Seller>, message: string) {
    await saveSeller({ ...seller, ...patch });
    showToast(message);
    reload();
  }

  return (
    <>
      <PageTitle
        title="বিক্রেতা"
        subtitle="ওয়েবসাইট নেই এমন দোকান বা গ্রুপের ফোন নম্বর সাইটে দেখানো হয়।"
        action={
          <button type="button" onClick={() => setEditing(EMPTY)} className={primaryButton}>
            নতুন বিক্রেতা
          </button>
        }
      />
      {editing && (
        <div className="mb-6">
          <Panel title={editing.id ? `${editing.name} সম্পাদনা` : "নতুন বিক্রেতা"}>
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
                  <th className="px-5 py-3 font-semibold">নাম</th>
                  <th className="px-3 py-3 font-semibold">ধরন</th>
                  <th className="px-3 py-3 font-semibold">যোগাযোগ</th>
                  <th className="px-3 py-3 font-semibold">যাচাই করা</th>
                  <th className="px-3 py-3 font-semibold">চালু</th>
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
                    <td className="px-3 py-3 text-dim">{SELLER_KIND_LABEL[seller.kind]}</td>
                    <td className="px-3 py-3 text-[13px]">{seller.website ? new URL(seller.website).hostname : seller.phone}</td>
                    <td className="px-3 py-3">
                      <Toggle
                        label={`${seller.name} যাচাই করা`}
                        checked={seller.verified}
                        onChange={(verified) => update(seller, { verified }, verified ? "যাচাই করা হলো" : "যাচাই সরানো হলো")}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Toggle label={`${seller.name} চালু`} checked={seller.active} onChange={(active) => update(seller, { active }, active ? "চালু হলো" : "বন্ধ হলো")} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing(seller)} className={secondaryButton}>
                          সম্পাদনা
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`${seller.name} আর তার সব দাম মুছে ফেলবেন?`)) return;
                            await deleteSeller(seller);
                            showToast("মুছে ফেলা হলো");
                            reload();
                          }}
                          className="h-10 rounded-xl border border-line px-3 text-sm font-semibold text-danger hover:border-danger"
                        >
                          মুছুন
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
