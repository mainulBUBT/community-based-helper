"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, TextArea } from "@/components/admin/Field";
import { LangSwitch, LangTabs, type Lang } from "@/components/admin/LangTabs";
import {
  PageTitle,
  Panel,
  primaryButton,
  secondaryButton,
} from "@/components/admin/Panel";
import { BrandMark } from "@/components/layout/BrandMark";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SITE_URL } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useI18n";
import { showToast } from "@/lib/toast";
import { loadSiteSettings, saveSiteSettings } from "@/services/admin/settings";
import { loadCatalog } from "@/services/catalog";
import type { RegionNote, SiteSettings } from "@/types/admin";

async function loadRegions() {
  const { offers } = await loadCatalog();
  return [
    ...new Set(
      offers.map((o) => o.region).filter((r): r is string => Boolean(r)),
    ),
  ].sort();
}

const cell =
  "h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand";

function RegionNotesEditor({
  notes,
  onChange,
}: {
  notes: RegionNote[];
  onChange: (notes: RegionNote[]) => void;
}) {
  const { t } = useAdminI18n();
  const { data: regions } = useAsync(loadRegions, []);
  const update = (i: number, patch: Partial<RegionNote>) =>
    onChange(notes.map((n, j) => (j === i ? { ...n, ...patch } : n)));

  return (
    <div className="flex flex-col gap-3 p-5">
      <p className="text-sm text-dim">{t.admin.settings.regionNotesHint}</p>
      {notes.length > 0 && (
        <div className="hidden grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-3 text-[13px] font-semibold text-dim md:grid">
          <span>{t.admin.settings.regionName}</span>
          <span>{t.admin.settings.regionNoteBn}</span>
          <span>{t.admin.settings.regionNoteEn}</span>
        </div>
      )}
      {notes.map((n, i) => (
        <div
          key={i}
          className="grid gap-2 rounded-lg border border-line-soft p-3 md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem] md:items-center md:gap-3 md:border-0 md:p-0"
        >
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-dim md:contents">
            <span className="md:hidden">{t.admin.settings.regionName}</span>
            <input
              value={n.region}
              list="known-regions"
              placeholder="USA"
              onChange={(e) => update(i, { region: e.target.value })}
              className={`${cell} font-semibold text-ink`}
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-dim md:contents">
            <span className="md:hidden">{t.admin.settings.regionNoteBn}</span>
            <input
              value={n.note}
              onChange={(e) => update(i, { note: e.target.value })}
              className={`${cell} font-normal text-ink`}
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-dim md:contents">
            <span className="md:hidden">{t.admin.settings.regionNoteEn}</span>
            <input
              value={n.noteEn}
              onChange={(e) => update(i, { noteEn: e.target.value })}
              className={`${cell} font-normal text-ink`}
            />
          </label>
          <button
            type="button"
            aria-label={t.admin.settings.removeRegion(n.region)}
            onClick={() => onChange(notes.filter((_, j) => j !== i))}
            className="flex size-10 items-center justify-center justify-self-end rounded-lg border border-line text-dim hover:border-danger hover:text-danger"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
      {notes.length === 0 && (
        <p className="text-sm text-dim">{t.admin.settings.noRegions}</p>
      )}
      <button
        type="button"
        onClick={() =>
          onChange([...notes, { region: "", note: "", noteEn: "" }])
        }
        className={`${secondaryButton} flex items-center gap-2 self-start`}
      >
        <Plus size={16} aria-hidden="true" />
        {t.admin.settings.addRegion}
      </button>
      <datalist id="known-regions">
        {(regions ?? []).map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </div>
  );
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const { t, num } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState(initial.logoUrl ?? "");
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [seoTitleEn, setSeoTitleEn] = useState(initial.seoTitleEn);
  const [seoLang, setSeoLang] = useState<Lang>("en");
  const [regionNotes, setRegionNotes] = useState<RegionNote[]>(
    initial.regionNotes,
  );
  const [seoDescriptionEn, setSeoDescriptionEn] = useState(
    initial.seoDescriptionEn,
  );

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
          taglineEn: value("taglineEn") ?? "",
          phone: value("phone"),
          email: value("email"),
          facebook: value("facebook"),
          logoUrl: value("logoUrl"),
          seoTitle: seoTitle.trim() || initial.seoTitle,
          seoDescription: seoDescription.trim() || initial.seoDescription,
          seoTitleEn: seoTitleEn.trim(),
          seoDescriptionEn: seoDescriptionEn.trim(),
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
          aboutWho: value("aboutWho") ?? "",
          aboutWhoEn: value("aboutWhoEn") ?? "",
          aboutWhat: value("aboutWhat") ?? "",
          aboutWhatEn: value("aboutWhatEn") ?? "",
          regionNotes: regionNotes
            .map((n) => ({
              region: n.region.trim(),
              note: n.note.trim(),
              noteEn: n.noteEn.trim(),
            }))
            .filter((n) => n.region && (n.note || n.noteEn)),
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
          <div className="md:col-span-2">
            <LangTabs
              en={
                <>
                  <Field
                    label={t.admin.settings.nameEn}
                    name="nameEn"
                    defaultValue={initial.nameEn}
                  />
                  <Field
                    label={t.admin.settings.taglineEn}
                    name="taglineEn"
                    defaultValue={initial.taglineEn}
                  />
                </>
              }
              bn={
                <>
                  <Field
                    label={t.admin.settings.name}
                    name="name"
                    defaultValue={initial.name}
                  />
                  <Field
                    label={t.admin.settings.tagline}
                    name="tagline"
                    defaultValue={initial.tagline}
                  />
                </>
              }
            />
          </div>
          <Field
            label={t.admin.settings.phone}
            name="phone"
            type="tel"
            defaultValue={initial.phone ?? ""}
          />
          <Field
            label={t.admin.settings.email}
            name="email"
            type="email"
            defaultValue={initial.email ?? ""}
          />
          <Field
            label={t.admin.settings.facebook}
            name="facebook"
            type="url"
            defaultValue={initial.facebook ?? ""}
          />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field
                label={t.admin.settings.logoUrl}
                name="logoUrl"
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                hint={t.admin.settings.logoHint}
              />
            </div>
            <span className="mb-6 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? (
                <img
                  src={logo}
                  alt={t.admin.settings.logoAlt}
                  className="size-full object-cover"
                />
              ) : (
                <BrandMark size={44} />
              )}
            </span>
          </div>
        </div>
      </Panel>

      <Panel title={t.admin.settings.homeTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <LangTabs
              en={
                <>
                  <Field
                    label={t.admin.settings.heroTitleEn}
                    name="heroTitleEn"
                    defaultValue={initial.heroTitleEn}
                  />
                  <Field
                    label={t.admin.settings.announcementEn}
                    name="announcementEn"
                    defaultValue={initial.announcementEn ?? ""}
                    hint={t.admin.settings.announcementHint}
                  />
                </>
              }
              bn={
                <>
                  <Field
                    label={t.admin.settings.heroTitleBn}
                    name="heroTitle"
                    defaultValue={initial.heroTitle}
                  />
                  <Field
                    label={t.admin.settings.announcementBn}
                    name="announcement"
                    defaultValue={initial.announcement ?? ""}
                    hint={t.admin.settings.announcementHint}
                  />
                </>
              }
            />
          </div>
          <div className="md:col-span-2">
            <Field
              label={t.admin.settings.quickSearches}
              name="quickSearches"
              defaultValue={initial.quickSearches.join(", ")}
              hint={t.admin.settings.quickSearchesHint}
            />
          </div>
          <Field
            label={t.admin.settings.announcementLink}
            name="announcementLink"
            type="url"
            defaultValue={initial.announcementLink ?? ""}
            placeholder="https://"
          />
        </div>
      </Panel>

      <Panel title={t.admin.settings.aboutTitle}>
        <div className="flex flex-col gap-4 p-5">
          <LangTabs
            className="grid gap-4 lg:grid-cols-2"
            en={
              <>
                <TextArea
                  label={t.admin.settings.aboutWhoEn}
                  name="aboutWhoEn"
                  defaultValue={initial.aboutWhoEn}
                  rows={3}
                />
                <TextArea
                  label={t.admin.settings.aboutWhatEn}
                  name="aboutWhatEn"
                  defaultValue={initial.aboutWhatEn}
                  rows={3}
                />
              </>
            }
            bn={
              <>
                <TextArea
                  label={t.admin.settings.aboutWho}
                  name="aboutWho"
                  defaultValue={initial.aboutWho}
                  rows={3}
                />
                <TextArea
                  label={t.admin.settings.aboutWhat}
                  name="aboutWhat"
                  defaultValue={initial.aboutWhat}
                  rows={3}
                />
              </>
            }
          />
          <p className="text-sm text-dim">
            {t.admin.settings.aboutContactHint}
          </p>
        </div>
      </Panel>

      <Panel title={t.admin.settings.regionNotesTitle}>
        <RegionNotesEditor notes={regionNotes} onChange={setRegionNotes} />
      </Panel>

      <Panel title={t.admin.settings.seoTitle}>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <LangSwitch value={seoLang} onChange={setSeoLang} />
            <div
              className={seoLang === "bn" ? "flex flex-col gap-4" : "hidden"}
            >
              <Field
                label={t.admin.settings.seoHeadline}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={70}
                hint={t.admin.settings.charCount(num(seoTitle.length), 70)}
              />
              <TextArea
                label={t.admin.settings.seoDescription}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={160}
                hint={t.admin.settings.charCount(
                  num(seoDescription.length),
                  160,
                )}
              />
            </div>
            <div
              className={seoLang === "en" ? "flex flex-col gap-4" : "hidden"}
            >
              <Field
                label={t.admin.settings.seoHeadlineEn}
                value={seoTitleEn}
                onChange={(e) => setSeoTitleEn(e.target.value)}
                maxLength={70}
                hint={t.admin.settings.charCount(num(seoTitleEn.length), 70)}
              />
              <TextArea
                label={t.admin.settings.seoDescriptionEn}
                value={seoDescriptionEn}
                onChange={(e) => setSeoDescriptionEn(e.target.value)}
                maxLength={160}
                hint={t.admin.settings.charCount(
                  num(seoDescriptionEn.length),
                  160,
                )}
              />
            </div>
            <Field
              label={t.admin.settings.siteUrl}
              value={SITE_URL}
              readOnly
              hint={t.admin.settings.siteUrlHint}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">
              {t.admin.settings.googlePreview}
            </span>
            <div className="flex flex-col gap-1 rounded-xl border border-line-soft bg-page p-4">
              <span className="text-[13px] text-dim">
                {SITE_URL.replace(/^https?:\/\//, "")}
              </span>
              <span className="text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
                {seoLang === "en" ? seoTitleEn : seoTitle}
              </span>
              <span className="text-sm text-dim">
                {seoLang === "en" ? seoDescriptionEn : seoDescription}
              </span>
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

      <button
        type="submit"
        disabled={busy}
        className={`${primaryButton} self-start`}
      >
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
