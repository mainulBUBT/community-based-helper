"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Field } from "@/components/admin/Field";
import { Tabs } from "@/components/admin/Tabs";
import { PageTitle, Panel, primaryButton } from "@/components/admin/Panel";
import { AboutPanel } from "@/components/admin/settings/AboutPanel";
import { BusinessPanel } from "@/components/admin/settings/BusinessPanel";
import { HomePanel } from "@/components/admin/settings/HomePanel";
import { RegionNotesPanel } from "@/components/admin/settings/RegionNotesPanel";
import { SeoPanel } from "@/components/admin/settings/SeoPanel";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { showToast } from "@/lib/toast";
import { loadSiteSettings, saveSiteSettings } from "@/services/admin/settings";
import type { RegionNote, SiteSettings } from "@/types/admin";
import { canonicalRegion } from "@/utils/region";

const TABS = ["business", "home", "about", "regions", "seo", "analytics"] as const;
type Tab = (typeof TABS)[number];

// সব ট্যাব একসাথে মাউন্ট থাকে (শুধু লুকানো), তাই ট্যাব বদলালে লেখা হারায় না আর এক সেভেই সব যায়
function TabPanel({ id, active, children }: { id: Tab; active: Tab; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`settings-${id}`} data-tab={id} hidden={id !== active}>
      {children}
    </div>
  );
}

// প্রতিটা প্যানেল নিজের state রাখে; সেভের সময় সব মান ফর্ম থেকেই পড়া হয়
function SettingsForm({ initial }: { initial: SiteSettings }) {
  const { t } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("business");
  const labels: Record<Tab, string> = {
    business: t.admin.settings.businessTitle,
    home: t.admin.settings.homeTitle,
    about: t.admin.settings.aboutTitle,
    regions: t.admin.settings.regionNotesTitle,
    seo: t.admin.settings.seoTitle,
    analytics: t.admin.settings.analyticsTitle,
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim() || null;
    const flag = (name: "showDrops" | "showSpotlight" | "showCategoryRows" | "showBrands" | "showSellers") => (data.has(name) ? data.get(name) === "true" : initial[name]);
    const regionNotes = JSON.parse(String(data.get("regionNotes") ?? "[]")) as RegionNote[];
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
          seoTitle: value("seoTitle") ?? initial.seoTitle,
          seoDescription: value("seoDescription") ?? initial.seoDescription,
          seoTitleEn: value("seoTitleEn") ?? "",
          seoDescriptionEn: value("seoDescriptionEn") ?? "",
          cloudflareAnalyticsToken: value("cloudflareAnalyticsToken"),
          heroTitle: value("heroTitle") ?? initial.heroTitle,
          heroTitleEn: value("heroTitleEn") ?? initial.heroTitleEn,
          heroEyebrow: value("heroEyebrow") ?? "",
          heroEyebrowEn: value("heroEyebrowEn") ?? "",
          quickSearches: String(data.get("quickSearches") ?? "")
            .split(",")
            .map((q) => q.trim())
            .filter(Boolean),
          showDrops: flag("showDrops"),
          showSpotlight: flag("showSpotlight"),
          showCategoryRows: flag("showCategoryRows"),
          showBrands: flag("showBrands"),
          showSellers: flag("showSellers"),
          dropsInterval: Number(value("dropsInterval")) || initial.dropsInterval,
          announcement: value("announcement"),
          announcementEn: value("announcementEn"),
          announcementLink: value("announcementLink"),
          aboutWho: value("aboutWho") ?? "",
          aboutWhoEn: value("aboutWhoEn") ?? "",
          aboutWhat: value("aboutWhat") ?? "",
          aboutWhatEn: value("aboutWhatEn") ?? "",
          regionNotes: regionNotes
            .map((n) => ({ region: canonicalRegion(n.region) ?? "", note: n.note.trim(), noteEn: n.noteEn.trim() }))
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
    <form
      onSubmit={onSubmit}
      // লুকানো ট্যাবের কোনো ঘর ভুল হলে সেই ট্যাব খুলে ব্রাউজারের বার্তা দেখানো, নইলে সেভ চুপচাপ আটকে থাকত
      onInvalidCapture={(event) => {
        const form = event.currentTarget;
        const owner = (event.target as HTMLElement).closest("[data-tab]")?.getAttribute("data-tab") as Tab | null;
        if (owner && owner !== tab) {
          setTab(owner);
          setTimeout(() => form.reportValidity());
        }
      }}
      className="flex flex-col gap-6"
    >
      <Tabs tabs={TABS.map((id) => ({ id, label: labels[id] }))} active={tab} onChange={setTab} label={t.admin.settings.title} idPrefix="settings" />

      <TabPanel id="business" active={tab}>
        <BusinessPanel initial={initial} />
      </TabPanel>
      <TabPanel id="home" active={tab}>
        <HomePanel initial={initial} />
      </TabPanel>
      <TabPanel id="about" active={tab}>
        <AboutPanel initial={initial} />
      </TabPanel>
      <TabPanel id="regions" active={tab}>
        <RegionNotesPanel initial={initial.regionNotes} />
      </TabPanel>
      <TabPanel id="seo" active={tab}>
        <SeoPanel initial={initial} />
      </TabPanel>

      <TabPanel id="analytics" active={tab}>
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
      </TabPanel>

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
