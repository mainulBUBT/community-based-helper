"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type FormEvent } from "react";
import { Field } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton } from "@/components/admin/Panel";
import { PublishButton } from "@/components/admin/PublishButton";
import { Toggle } from "@/components/admin/Toggle";
import { Chip } from "@/components/ui/Chip";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { loadSiteSettings, saveSiteSettings } from "@/services/admin/settings";
import { BANNER_PAGES, type BannerPage, type SiteSettings } from "@/types/admin";
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

function InlineBannerForm({ settings, onSaved }: { settings: SiteSettings; onSaved: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const text = t.admin.banners;
  const [enabled, setEnabled] = useState(settings.bannerEnabled);
  const [image, setImage] = useState(settings.bannerImage ?? "");
  const [mobile, setMobile] = useState(settings.bannerImageMobile ?? "");
  const [pages, setPages] = useState<BannerPage[]>(settings.bannerPages);
  const preview = safeUrl(image, { relative: true });
  const mobilePreview = safeUrl(mobile, { relative: true });
  const toggle = (page: BannerPage) => setPages(pages.includes(page) ? pages.filter((p) => p !== page) : [...pages, page]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const link = safeUrl(form.get("link"), { relative: true });
    if (!preview || !link || (mobile.trim() && !mobilePreview)) {
      showToast(text.invalidUrl);
      return;
    }
    if (enabled && pages.length === 0) {
      showToast(text.noPage);
      return;
    }
    const next = {
      ...settings,
      bannerEnabled: enabled,
      bannerImage: preview,
      bannerImageMobile: mobilePreview,
      bannerLink: link,
      bannerAlt: String(form.get("alt")).trim() || null,
      bannerPages: BANNER_PAGES.filter((p) => pages.includes(p)),
    };
    if (await run(() => saveSiteSettings(next, text.title), t.admin.common.saved)) onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-sm font-semibold">{text.inlineEnabled}</span>
          <span className="text-xs text-dim">{text.inlineEnabledHint}</span>
        </span>
        <Toggle label={text.inlineEnabled} checked={enabled} onChange={setEnabled} disabled={busy} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{text.pages}</span>
        <div className="flex flex-wrap gap-2">
          {BANNER_PAGES.map((page) => (
            <Chip key={page} selected={pages.includes(page)} onClick={() => toggle(page)}>
              {text.page[page]}
            </Chip>
          ))}
        </div>
        <span className="text-xs text-dim">{text.pagesHint}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={text.imageDesktop} value={image} onChange={(e) => setImage(e.target.value)} required hint={text.imageDesktopHint} />
        <Field label={text.imageMobile} value={mobile} onChange={(e) => setMobile(e.target.value)} hint={text.imageMobileHint} />
        <Field label={text.link} name="link" defaultValue={settings.bannerLink ?? ""} required hint={text.linkHint} />
        <Field label={text.alt} name="alt" defaultValue={settings.bannerAlt ?? ""} hint={text.altHint} />
      </div>
      {preview && <img src={preview} alt="" className="w-full rounded-lg border border-line-soft" />}
      {mobilePreview && <img src={mobilePreview} alt="" className="w-full max-w-sm rounded-lg border border-line-soft" />}
      <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
        {t.admin.common.save}
      </button>
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
      <div className="flex flex-col gap-5">
        <Panel title={t.admin.banners.popup}>
          <PopupForm settings={data} onSaved={reload} />
        </Panel>
        <Panel title={t.admin.banners.inline}>
          <InlineBannerForm settings={data} onSaved={reload} />
        </Panel>
      </div>
    </>
  );
}
