"use client";

import { Copy, X } from "lucide-react";
import { PlaceRow } from "@/components/place/PlaceRow";
import { ActionButton } from "@/components/ui/ActionButton";
import { AsyncContent, Notice } from "@/components/ui/Notice";
import { useClock } from "@/hooks/useClock";
import { usePlaces } from "@/hooks/usePlaces";
import { useSaved } from "@/hooks/useSaved";
import { copyText } from "@/lib/clipboard";
import type { Place } from "@/types/place";
import { toBnDigits } from "@/utils/bangla";
import { placeSummary } from "@/utils/place";
import { ancestorsOf } from "@/utils/place-tree";

export function SavedView() {
  const { places, tree, loading, error } = usePlaces();
  const { ids, toggle } = useSaved();
  const clock = useClock();
  const saved = ids.map((id) => places.find((p) => p.id === id)).filter((p): p is Place => Boolean(p));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2 pb-6">
      <header className="flex flex-col gap-1 px-4 pb-2 pt-5">
        <h1 className="font-display text-[28px] leading-tight">সেভ করা</h1>
        <p className="text-sm text-dim">
          {toBnDigits(saved.length)}টি জায়গা · এই ব্রাউজারেই রাখা আছে
        </p>
      </header>
      <AsyncContent loading={loading} error={error}>
        {saved.length ? (
          <>
            <ul>
              {saved.map((place) => (
                <PlaceRow
                  key={place.id}
                  place={place}
                  clock={clock}
                  parentName={place.parentId ? tree.byId.get(place.parentId)?.name : undefined}
                  action={
                    <button
                      type="button"
                      onClick={() => toggle(place.id)}
                      aria-label={`${place.name} — সেভ থেকে সরান`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-dim hover:bg-surface-2 hover:text-ink"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  }
                />
              ))}
            </ul>
            <div className="flex px-4 pt-2">
              <ActionButton
                icon={Copy}
                label="পুরো তালিকা কপি করুন"
                onClick={() => copyText(saved.map((p) => placeSummary(p, ancestorsOf(tree, p))).join("\n\n"), "পুরো তালিকা কপি হয়েছে")}
              />
            </div>
          </>
        ) : (
          <Notice>এখনো কিছু সেভ করা হয়নি। কোনো জায়গার পাতায় “সেভ” চাপলে এখানে আসবে।</Notice>
        )}
      </AsyncContent>
    </div>
  );
}
