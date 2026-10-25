"use client";

import { useState, type FormEvent } from "react";
import { Field, Select } from "@/components/admin/Field";
import { IconPicker } from "@/components/admin/IconPicker";
import { LangTabs } from "@/components/admin/LangTabs";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { CategoryIcon } from "@/components/product/CategoryIcon";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { showToast } from "@/lib/toast";
import { countChildren, countProducts, deleteCategory, listAllCategories, saveCategory } from "@/services/admin/categories";
import { AXES, type Axis, type CategoryInfo } from "@/types/catalog";

async function loadData() {
  const categories = await listAllCategories();
  const products = await Promise.all(categories.map((c) => countProducts(c.slug)));
  const children = await Promise.all(categories.map((c) => countChildren(c.slug)));
  return categories.map((category, i) => ({ category, products: products[i], children: children[i] }));
}

function CategoryForm({
  category,
  isNew,
  topLevel,
  onClose,
}: {
  category: CategoryInfo;
  isNew: boolean;
  topLevel: CategoryInfo[];
  onClose: (saved: boolean) => void;
}) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const [axes, setAxes] = useState<Axis[]>(category.axes);
  const [parent, setParent] = useState<string>(category.parent ?? "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const slug = isNew ? String(form.get("slug")).trim().toLowerCase() : category.slug;
    if (!/^[a-z0-9-]+$/.test(slug)) {
      showToast(t.admin.categories.slugInvalid);
      return;
    }
    const next: CategoryInfo = {
      slug,
      name: String(form.get("name")).trim(),
      nameEn: String(form.get("nameEn")).trim(),
      icon: String(form.get("icon")),
      axes: AXES.filter((axis) => axes.includes(axis)),
      parent: parent || null,
      position: Number(form.get("position")) || 0,
      active: category.active,
    };
    if (await run(() => saveCategory(next, isNew), t.admin.common.saved)) onClose(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-3">
      <Field label={t.admin.categories.slug} name="slug" defaultValue={category.slug} required disabled={!isNew} hint={t.admin.categories.slugHint} placeholder="headphones" />
      <Select label={t.admin.categories.parent} value={parent} onChange={(e) => setParent(e.target.value)}>
        <option value="">{t.admin.categories.parentNone}</option>
        {topLevel
          .filter((c) => c.slug !== category.slug)
          .map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nameEn}
            </option>
          ))}
      </Select>
      <Field label={t.admin.categories.position} name="position" type="number" defaultValue={category.position} />
      <div className="md:col-span-3">
        <LangTabs
          className="flex flex-col gap-4"
          en={
            <Field label={t.admin.categories.nameEn} name="nameEn" defaultValue={category.nameEn} required />
          }
          bn={
            <Field label={t.admin.categories.name} name="name" defaultValue={category.name} required />
          }
        />
      </div>
      <div className="md:col-span-3">
        <IconPicker name="icon" defaultValue={category.icon} />
      </div>
      <fieldset className="flex flex-col gap-2 md:col-span-3">
        <legend className="mb-1.5 text-sm font-semibold">{t.admin.categories.axes}</legend>
        <div className="flex flex-wrap gap-2">
          {AXES.map((axis) => {
            const on = axes.includes(axis);
            return (
              <label key={axis} className={`flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${on ? "border-brand bg-brand-soft font-semibold" : "border-line"}`}>
                <input type="checkbox" checked={on} onChange={() => setAxes(on ? axes.filter((a) => a !== axis) : [...axes, axis])} className="size-4 accent-[var(--color-brand)]" />
                {t.axis[axis]}
              </label>
            );
          })}
        </div>
        <span className="text-xs text-dim">{t.admin.categories.axesHint}</span>
      </fieldset>
      <div className="flex gap-2 md:col-span-3">
        <button type="submit" disabled={busy} className={primaryButton}>
          {t.admin.common.save}
        </button>
        <button type="button" onClick={() => onClose(false)} className={secondaryButton}>
          {t.admin.common.cancel}
        </button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const { t, lang, num } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const { data, error, loading, reload } = useAsync(loadData, []);
  const [editing, setEditing] = useState<{ category: CategoryInfo; isNew: boolean } | null>(null);

  if (loading) return <ListSkeleton />;
  if (error || !data) return <ErrorNotice onRetry={reload} />;

  const close = (saved: boolean) => {
    setEditing(null);
    if (saved) reload();
  };
  const topLevel = data.filter(({ category }) => !category.parent).map(({ category }) => category);
  const parentOf = (slug: string | null | undefined) => (slug ? (data.find(({ category }) => category.slug === slug)?.category.nameEn ?? slug) : "");
  const blank: CategoryInfo = { slug: "", name: "", nameEn: "", icon: "package", axes: [], parent: null, position: data.length + 1, active: true };

  return (
    <>
      <PageTitle
        title={t.admin.categories.title}
        subtitle={t.admin.categories.subtitle}
        action={
          <button type="button" onClick={() => setEditing({ category: blank, isNew: true })} className={primaryButton}>
            {t.admin.categories.new}
          </button>
        }
      />
      <div className="flex flex-col gap-6">
        {editing && (
          <Panel title={editing.isNew ? t.admin.categories.new : t.admin.categories.editTitle(editing.category.nameEn)}>
            <CategoryForm key={editing.category.slug || "new"} category={editing.category} isNew={editing.isNew} topLevel={topLevel} onClose={close} />
          </Panel>
        )}
        <Panel title={t.admin.categories.all(num(data.length))}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead className="text-[13px] text-dim">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t.admin.products.colCategory}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.categories.parent}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.categories.axes}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.categories.products}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.categories.active}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.categories.warranty}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {data.map(({ category, products, children }) => (
                  <tr key={category.slug}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <CategoryIcon name={category.icon} size={18} />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-semibold">{lang === "en" ? category.nameEn : category.name}</span>
                          <span className="text-xs text-dim">{category.slug}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-dim">{parentOf(category.parent) || "—"}</td>
                    <td className="px-3 py-3 text-[13px] text-dim">{category.axes.map((axis) => t.axis[axis]).join(", ") || "—"}</td>
                    <td className="px-3 py-3">{num(products)}</td>
                    <td className="px-3 py-3">
                      <Toggle
                        label={t.admin.categories.active}
                        checked={category.active}
                        disabled={busy}
                        onChange={async (active) => {
                          if (await run(() => saveCategory({ ...category, active }, false))) reload();
                        }}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Toggle
                        label={t.admin.categories.warranty}
                        checked={category.warranty !== false}
                        disabled={busy}
                        onChange={async (warranty) => {
                          if (await run(() => saveCategory({ ...category, warranty }, false))) reload();
                        }}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditing({ category, isNew: false })} className={secondaryButton}>
                          {t.admin.common.edit}
                        </button>
                        <button
                          type="button"
                          disabled={busy || products > 0 || children > 0}
                          title={products > 0 ? t.admin.categories.hasProducts : children > 0 ? t.admin.categories.hasChildren : undefined}
                          onClick={async () => {
                            if (!confirm(t.admin.categories.confirmDelete(category.nameEn))) return;
                            if (await run(() => deleteCategory(category), t.admin.common.deleted)) reload();
                          }}
                          className="h-10 rounded-xl border border-line px-3 text-sm font-semibold text-danger disabled:opacity-40"
                        >
                          {t.admin.common.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
