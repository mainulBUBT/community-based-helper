"use client";

import { useState } from "react";
import { Field } from "@/components/admin/Field";
import { LangTabs } from "@/components/admin/LangTabs";
import { Panel } from "@/components/admin/Panel";
import { BrandMark } from "@/components/layout/BrandMark";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { SiteSettings } from "@/types/admin";

export function BusinessPanel({ initial }: { initial: SiteSettings }) {
  const { t } = useAdminI18n();
  const [logo, setLogo] = useState(initial.logoUrl ?? "");
  return (
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
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
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
  );
}
