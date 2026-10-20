"use client";

import { useState, type FormEvent } from "react";
import { Field, TextArea } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton } from "@/components/admin/Panel";
import { BrandMark } from "@/components/layout/BrandMark";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SITE_URL } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useI18n";
import { showToast } from "@/lib/toast";
import { loadSiteSettings, saveSiteSettings } from "@/services/admin/settings";
import type { SiteSettings } from "@/types/admin";

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const { t, num } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState(initial.logoUrl ?? "");
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim() || null;
    setBusy(true);
    try {
      await saveSiteSettings(
        {
          name: value("name") ?? initial.name,
          nameEn: value("nameEn") ?? initial.nameEn,
          tagline: value("tagline") ?? "",
          phone: value("phone"),
          email: value("email"),
          facebook: value("facebook"),
          logoUrl: value("logoUrl"),
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          cloudflareAnalyticsToken: value("cloudflareAnalyticsToken"),
          heroTitle: value("heroTitle") ?? initial.heroTitle,
          heroTitleEn: value("heroTitleEn") ?? initial.heroTitleEn,
          quickSearches: String(data.get("quickSearches") ?? "")
            .split(",")
            .map((q) => q.trim())
            .filter(Boolean),
          announcement: value("announcement"),
          announcementEn: value("announcementEn"),
          announcementLink: value("announcementLink"),
        },
        t.admin.settings.auditSection,
      );
      showToast(t.admin.settings.savedToast);
    } catch {
      showToast(t.admin.common.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Panel title={t.admin.settings.businessTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label={t.admin.settings.name} name="name" defaultValue={initial.name} required />
          <Field label={t.admin.settings.nameEn} name="nameEn" defaultValue={initial.nameEn} />
          <Field label={t.admin.settings.tagline} name="tagline" defaultValue={initial.tagline} />
          <Field label={t.admin.settings.phone} name="phone" type="tel" defaultValue={initial.phone ?? ""} />
          <Field label={t.admin.settings.email} name="email" type="email" defaultValue={initial.email ?? ""} />
          <Field label={t.admin.settings.facebook} name="facebook" type="url" defaultValue={initial.facebook ?? ""} />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label={t.admin.settings.logoUrl} name="logoUrl" type="url" value={logo} onChange={(e) => setLogo(e.target.value)} hint={t.admin.settings.logoHint} />
            </div>
            <span className="mb-6 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? <img src={logo} alt={t.admin.settings.logoAlt} className="size-full object-cover" /> : <BrandMark size={44} />}
            </span>
          </div>
        </div>
      </Panel>

      <Panel title={t.admin.settings.homeTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label={t.admin.settings.heroTitleBn} name="heroTitle" defaultValue={initial.heroTitle} />
          <Field label={t.admin.settings.heroTitleEn} name="heroTitleEn" defaultValue={initial.heroTitleEn} />
          <div className="md:col-span-2">
            <Field label={t.admin.settings.quickSearches} name="quickSearches" defaultValue={initial.quickSearches.join(", ")} hint={t.admin.settings.quickSearchesHint} />
          </div>
          <Field label={t.admin.settings.announcementBn} name="announcement" defaultValue={initial.announcement ?? ""} hint={t.admin.settings.announcementHint} />
          <Field label={t.admin.settings.announcementEn} name="announcementEn" defaultValue={initial.announcementEn ?? ""} />
          <Field label={t.admin.settings.announcementLink} name="announcementLink" type="url" defaultValue={initial.announcementLink ?? ""} placeholder="https://" />
        </div>
      </Panel>

      <Panel title={t.admin.settings.seoTitle}>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Field
              label={t.admin.settings.seoHeadline}
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={70}
              hint={t.admin.settings.charCount(num(seoTitle.length), 70)}
              required
            />
            <TextArea
              label={t.admin.settings.seoDescription}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={160}
              hint={t.admin.settings.charCount(num(seoDescription.length), 160)}
              required
            />
            <Field label={t.admin.settings.siteUrl} value={SITE_URL} readOnly hint={t.admin.settings.siteUrlHint} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">{t.admin.settings.googlePreview}</span>
            <div className="flex flex-col gap-1 rounded-xl border border-line-soft bg-page p-4">
              <span className="text-[13px] text-dim">{SITE_URL.replace(/^https?:\/\//, "")}</span>
              <span className="text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{seoTitle}</span>
              <span className="text-sm text-dim">{seoDescription}</span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={t.admin.settings.analyticsTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field
            label={t.admin.settings.analyticsToken}
            name="cloudflareAnalyticsToken"
            defaultValue={initial.cloudflareAnalyticsToken ?? ""}
            hint={t.admin.settings.analyticsHint}
          />
        </div>
      </Panel>

      <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
        {t.admin.common.save}
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const { t } = useAdminI18n();
  const { data } = useAsync(loadSiteSettings, []);
  return (
    <>
      <PageTitle title={t.admin.settings.title} />
      {data ? <SettingsForm initial={data} /> : <ListSkeleton />}
    </>
  );
}
