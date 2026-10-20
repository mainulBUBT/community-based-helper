"use client";

import { useState, type FormEvent } from "react";
import { Field, TextArea } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton } from "@/components/admin/Panel";
import { BrandMark } from "@/components/layout/BrandMark";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SITE_URL } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { loadSiteSettings, saveSiteSettings } from "@/services/admin/settings";
import type { SiteSettings } from "@/types/admin";
import { toBnDigits } from "@/utils/format";

function SettingsForm({ initial }: { initial: SiteSettings }) {
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
        "ব্যবসা, হোম পেজ ও SEO",
      );
      showToast("সেভ হলো। সাইট পরেরবার বানানোর সময় সবখানে বদলাবে");
    } catch {
      showToast("সেভ করা গেল না");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Panel title="ব্যবসার তথ্য">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="সাইটের নাম" name="name" defaultValue={initial.name} required />
          <Field label="এক লাইনের পরিচয়" name="tagline" defaultValue={initial.tagline} />
          <Field label="যোগাযোগের ফোন" name="phone" type="tel" defaultValue={initial.phone ?? ""} />
          <Field label="ইমেইল" name="email" type="email" defaultValue={initial.email ?? ""} />
          <Field label="ফেসবুক পেজ" name="facebook" type="url" defaultValue={initial.facebook ?? ""} />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="লোগোর লিংক" name="logoUrl" type="url" value={logo} onChange={(e) => setLogo(e.target.value)} hint="খালি রাখলে এখনকার লোগো থাকবে" />
            </div>
            <span className="mb-6 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo ? <img src={logo} alt="লোগো" className="size-full object-cover" /> : <BrandMark size={44} />}
            </span>
          </div>
        </div>
      </Panel>

      <Panel title="হোম পেজ">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="বড় শিরোনাম (বাংলা)" name="heroTitle" defaultValue={initial.heroTitle} />
          <Field label="বড় শিরোনাম (English)" name="heroTitleEn" defaultValue={initial.heroTitleEn} />
          <div className="md:col-span-2">
            <Field label="দ্রুত খোঁজার বোতাম" name="quickSearches" defaultValue={initial.quickSearches.join(", ")} hint="কমা দিয়ে আলাদা করুন, যেমন Galaxy A17, iPhone 17" />
          </div>
          <Field label="উপরের নোটিশ (বাংলা)" name="announcement" defaultValue={initial.announcement ?? ""} hint="খালি রাখলে নোটিশ দেখাবে না" />
          <Field label="উপরের নোটিশ (English)" name="announcementEn" defaultValue={initial.announcementEn ?? ""} />
          <Field label="নোটিশে চাপলে কোথায় যাবে" name="announcementLink" type="url" defaultValue={initial.announcementLink ?? ""} placeholder="https://" />
        </div>
      </Panel>

      <Panel title="SEO">
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Field label="হোম পেজের শিরোনাম" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} hint={`${toBnDigits(seoTitle.length)}/৭০ অক্ষর`} required />
            <TextArea label="হোম পেজের বর্ণনা" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={160} hint={`${toBnDigits(seoDescription.length)}/১৬০ অক্ষর`} required />
            <Field label="সাইটের ঠিকানা" value={SITE_URL} readOnly hint="ডোমেইন কিনলে NEXT_PUBLIC_SITE_URL বদলে দিন, sitemap আর সব লিংক নতুন ঠিকানায় চলে যাবে।" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Google এ যেমন দেখাবে</span>
            <div className="flex flex-col gap-1 rounded-xl border border-line-soft bg-page p-4">
              <span className="text-[13px] text-dim">{SITE_URL.replace(/^https?:\/\//, "")}</span>
              <span className="text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{seoTitle}</span>
              <span className="text-sm text-dim">{seoDescription}</span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="ভিজিটর গোনা">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field
            label="Cloudflare Web Analytics token"
            name="cloudflareAnalyticsToken"
            defaultValue={initial.cloudflareAnalyticsToken ?? ""}
            hint="দিলে Cloudflare এর ফ্রি অ্যানালিটিক্সও চালু হবে। নিজেদের ভিজিটর হিসাব এটা ছাড়াই চলে।"
          />
        </div>
      </Panel>

      <button type="submit" disabled={busy} className={`${primaryButton} self-start`}>
        সেভ করুন
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const { data } = useAsync(loadSiteSettings, []);
  return (
    <>
      <PageTitle title="সেটিংস" />
      {data ? <SettingsForm initial={data} /> : <ListSkeleton />}
    </>
  );
}
