"use client";

import { useState } from "react";
import { Field } from "@/components/admin/Field";
import { LangTabs } from "@/components/admin/LangTabs";
import { Panel } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { SiteSettings } from "@/types/admin";

// সুইচ বোতাম ফর্মের অংশ নয়, তাই মানটা লুকানো input এ যায়
function ToggleField({ name, initial, label }: { name: string; initial: boolean; label: string }) {
  const [checked, setChecked] = useState(initial);
  return (
    <>
      <Toggle checked={checked} onChange={setChecked} label={label} />
      <input type="hidden" name={name} value={String(checked)} />
    </>
  );
}

export function HomePanel({ initial }: { initial: SiteSettings }) {
  const { t } = useAdminI18n();
  return (
    <Panel title={t.admin.settings.homeTitle}>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <LangTabs
            en={
              <>
                <Field
                  label={t.admin.settings.heroEyebrowEn}
                  name="heroEyebrowEn"
                  defaultValue={initial.heroEyebrowEn}
                />
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
                  label={t.admin.settings.heroEyebrowBn}
                  name="heroEyebrow"
                  defaultValue={initial.heroEyebrow}
                />
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
        <div className="md:col-span-2 flex flex-col gap-3 rounded-lg border border-line-soft p-4">
          <span className="text-sm font-semibold">{t.admin.settings.homeSectionsTitle}</span>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t.admin.settings.showDrops}</span>
            <ToggleField name="showDrops" initial={initial.showDrops} label={t.admin.settings.showDrops} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t.admin.settings.showSpotlight}</span>
            <ToggleField name="showSpotlight" initial={initial.showSpotlight} label={t.admin.settings.showSpotlight} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t.admin.settings.showCategoryRows}</span>
            <ToggleField name="showCategoryRows" initial={initial.showCategoryRows} label={t.admin.settings.showCategoryRows} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t.admin.settings.showBrands}</span>
            <ToggleField name="showBrands" initial={initial.showBrands} label={t.admin.settings.showBrands} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t.admin.settings.showSellers}</span>
            <ToggleField name="showSellers" initial={initial.showSellers} label={t.admin.settings.showSellers} />
          </div>
          <Field
            label={t.admin.settings.dropsInterval}
            type="number"
            name="dropsInterval"
            min={1}
            defaultValue={String(initial.dropsInterval)}
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
  );
}
