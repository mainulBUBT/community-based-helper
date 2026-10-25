"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Panel, secondaryButton } from "@/components/admin/Panel";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { loadCatalog } from "@/services/catalog-live";
import type { RegionNote } from "@/types/admin";

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

export function RegionNotesPanel({ initial }: { initial: RegionNote[] }) {
  const { t } = useAdminI18n();
  const [notes, setNotes] = useState(initial);
  const { data: regions } = useAsync(loadRegions, []);
  const update = (i: number, patch: Partial<RegionNote>) =>
    setNotes(notes.map((n, j) => (j === i ? { ...n, ...patch } : n)));

  return (
    <Panel title={t.admin.settings.regionNotesTitle}>
      <div className="flex flex-col gap-3 p-5">
        <input type="hidden" name="regionNotes" value={JSON.stringify(notes)} />
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
              onClick={() => setNotes(notes.filter((_, j) => j !== i))}
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
            setNotes([...notes, { region: "", note: "", noteEn: "" }])
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
    </Panel>
  );
}
