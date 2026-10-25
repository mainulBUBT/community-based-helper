"use client";

import { TextArea } from "@/components/admin/Field";
import { LangTabs } from "@/components/admin/LangTabs";
import { Panel } from "@/components/admin/Panel";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { SiteSettings } from "@/types/admin";

export function AboutPanel({ initial }: { initial: SiteSettings }) {
  const { t } = useAdminI18n();
  return (
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
  );
}
