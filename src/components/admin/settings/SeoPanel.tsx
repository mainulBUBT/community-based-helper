"use client";

import { useState } from "react";
import { Field, TextArea } from "@/components/admin/Field";
import { LangSwitch, type Lang } from "@/components/admin/LangTabs";
import { Panel } from "@/components/admin/Panel";
import { SITE_URL } from "@/config/site";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { SiteSettings } from "@/types/admin";

export function SeoPanel({ initial }: { initial: SiteSettings }) {
  const { t, num } = useAdminI18n();
  const [seoLang, setSeoLang] = useState<Lang>("en");
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [seoTitleEn, setSeoTitleEn] = useState(initial.seoTitleEn);
  const [seoDescriptionEn, setSeoDescriptionEn] = useState(initial.seoDescriptionEn);
  return (
    <Panel title={t.admin.settings.seoTitle}>
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <LangSwitch value={seoLang} onChange={setSeoLang} />
          <div
            className={seoLang === "bn" ? "flex flex-col gap-4" : "hidden"}
          >
            <Field
              label={t.admin.settings.seoHeadline}
              name="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={70}
              hint={t.admin.settings.charCount(num(seoTitle.length), 70)}
            />
            <TextArea
              label={t.admin.settings.seoDescription}
              name="seoDescription"
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
              name="seoTitleEn"
              value={seoTitleEn}
              onChange={(e) => setSeoTitleEn(e.target.value)}
              maxLength={70}
              hint={t.admin.settings.charCount(num(seoTitleEn.length), 70)}
            />
            <TextArea
              label={t.admin.settings.seoDescriptionEn}
              name="seoDescriptionEn"
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
  );
}
