"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type FormEvent } from "react";
import { Field } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton } from "@/components/admin/Panel";
import { PublishButton } from "@/components/admin/PublishButton";
import { Toggle } from "@/components/admin/Toggle";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { loadSiteSettings, saveSiteSettings } from "@/services/admin/settings";
import type { SiteSettings } from "@/types/admin";
import { safeUrl } from "@/utils/url";

function PopupForm({ settings, onSaved }: { settings: SiteSettings; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const text = t.admin.banners;
  const [enabled, setEnabled] = useState(settings.popupEnabled);
  const [image, setImage] = useState(settings.popupImage ?? "");
  const preview = safeUrl(image, { relative: true });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const link = safeUrl(form.get("link"), { relative: true });
    if (!preview || !link) {
      showToast(text.invalidUrl);
      return;
    }
    const next = { ...settings, popupEnabled: enabled, popupImage: preview, popupLink: link, popupAlt: String(form.get("alt")).trim() || null };
    if (await run(() => saveSiteSettings(next, text.title), t.admin.common.saved)) onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 p-5 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{text.enabled}</span>
            <span className="text-xs text-dim">{text.enabledHint}</span>
          </span>
          <Toggle label={text.enabled} checked={enabled} onChange={setEnabled} disabled={busy} />
        </div>
        <Field label={text.image} value={image} onChange={(e) => setImage(e.target.value)} required hint={text.imageHint} />
        <Field label={text.link} name="link" defaultValue={settings.popupLink ?? ""} required hint={text.linkHint} />
        <Field label={text.alt} name="alt" defaultValue={settings.popupAlt ?? ""} hint={text.altHint} />
        <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
          {t.admin.common.save}
        </button>
      </div>
      {preview && <img src={preview} alt="" className="mx-auto w-full max-w-xs rounded-2xl border border-line-soft" />}
    </form>
  );
}

export default function BannersPage() {
  const { t } = useAdminI18n();
  const { data, error, loading, reload } = useAsync(loadSiteSettings, []);

  if (loading) return <ListSkeleton />;
  if (error || !data) return <ErrorNotice onRetry={reload} />;

  return (
    <>
      <PageTitle title={t.admin.banners.title} subtitle={t.admin.banners.subtitle} action={<PublishButton />} />
      <Panel title={t.admin.banners.popup}>
        <PopupForm settings={data} onSaved={reload} />
      </Panel>
    </>
  );
}
