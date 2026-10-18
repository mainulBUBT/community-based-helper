"use client";

import { LocateFixed, MapPin, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { SearchBox } from "@/components/ui/SearchBox";
import { useAreaSearch, type OnlineSearch } from "@/hooks/useAreaSearch";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { AreaHit } from "@/types/area";
import { toBnDigits } from "@/utils/bangla";
import { AreaOption } from "./AreaOption";

function statusText(term: string, localCount: number, online: OnlineSearch | null) {
  if (!term) return "এলাকার নাম লিখুন — বাংলা বা ইংরেজিতে";
  if (localCount) return `${toBnDigits(localCount)}টি এলাকা মিলেছে`;
  if (!online) return "তালিকায় মেলেনি — অনলাইনে খুঁজে দেখুন";
  if (online.status === "loading") return "OpenStreetMap-এ খোঁজা হচ্ছে…";
  if (online.status === "error") return "খোঁজা যায়নি — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন";
  return online.hits.length ? `${toBnDigits(online.hits.length)}টি জায়গা পাওয়া গেছে` : "কিছু পাওয়া যায়নি — অন্য নামে খুঁজে দেখুন";
}

function moveFocus(event: KeyboardEvent<HTMLFormElement>, input: HTMLInputElement | null) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const items = [input, ...event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-option]")];
  const index = items.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
}

export function AreaPicker({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [query, setQuery] = useState("");
  const { term, local, online, hits, searchOnline } = useAreaSearch(query);
  const { showMyLocation, chooseLocation } = useUserLocation();

  useEffect(() => {
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  }, []);

  const close = () => dialogRef.current?.close();
  const pick = (hit: AreaHit) => {
    chooseLocation(hit);
    close();
  };
  const pickGps = () => {
    showMyLocation();
    close();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (local[0]) pick(local[0]);
    else searchOnline();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="m-auto mt-16 max-h-[calc(100dvh-6rem)] w-[calc(100%-2rem)] max-w-md flex-col rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/50 open:flex lg:mt-24"
    >
      <form onSubmit={submit} onKeyDown={(event) => moveFocus(event, inputRef.current)} className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="font-display text-xl">
            অবস্থান বেছে নিন
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="বন্ধ করুন"
            className="flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <SearchBox
          ref={inputRef}
          value={query}
          onChange={setQuery}
          label="এলাকার নাম"
          placeholder="এলাকা খুঁজুন — যেমন মিরপুর ১০"
          enterKeyHint="search"
          autoComplete="off"
        />
        <p role="status" className="text-sm text-dim">
          {statusText(term, local.length, online)}
        </p>
        <ul className="-mx-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <li>
            <AreaOption icon={LocateFixed} label="আমার বর্তমান অবস্থান (GPS)" accent onClick={pickGps} />
          </li>
          {hits.map((hit) => (
            <li key={hit.key}>
              <AreaOption icon={MapPin} label={hit.label} detail={hit.detail} onClick={() => pick(hit)} />
            </li>
          ))}
        </ul>
        {term && !local.length && online?.status !== "done" && (
          <button
            type="submit"
            disabled={online?.status === "loading"}
            className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            অনলাইনে খুঁজুন
          </button>
        )}
        {online && (
          <p className="text-xs text-faint">
            খোঁজ: <a href="https://nominatim.org/" target="_blank" rel="noreferrer" className="underline">Nominatim</a> · ডেটা ©{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
        )}
      </form>
    </dialog>
  );
}
