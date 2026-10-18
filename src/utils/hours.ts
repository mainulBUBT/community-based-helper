import { APP } from "@/config/app";
import type { HoursSlot, Place } from "@/types/place";
import { toBnDigits, WEEKDAYS } from "./bangla";

export interface Clock {
  weekday: number;
  minutes: number;
}

export interface OpenState {
  isOpen: boolean;
  label: string;
}

const DAY = 1440;
const WEEK = 7 * DAY;
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const clockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: APP.timeZone,
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

export function clockAt(date = new Date()): Clock {
  const parts = Object.fromEntries(clockFormat.formatToParts(date).map((p) => [p.type, p.value]));
  return { weekday: EN_WEEKDAYS.indexOf(parts.weekday), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function formatTime(minutes: number): string {
  const m = ((minutes % DAY) + DAY) % DAY;
  const hour = Math.floor(m / 60);
  const minute = m % 60;
  const period = hour < 4 ? "রাত" : hour < 6 ? "ভোর" : hour < 12 ? "সকাল" : hour < 16 ? "দুপুর" : hour < 18 ? "বিকেল" : hour < 19 ? "সন্ধ্যা" : "রাত";
  const h12 = hour % 12 || 12;
  return `${period} ${toBnDigits(h12)}${minute ? `:${toBnDigits(String(minute).padStart(2, "0"))}` : ""}টা`;
}

function toWeekRange(slot: HoursSlot) {
  const start = slot.weekday * DAY + slot.opens;
  const length = (slot.closes - slot.opens + DAY) % DAY || DAY;
  return { start, end: start + length };
}

export function openState(place: Pick<Place, "open24h" | "hours">, clock: Clock): OpenState {
  if (place.open24h) return { isOpen: true, label: "২৪ ঘণ্টা খোলা" };
  if (!place.hours.length) return { isOpen: false, label: "খোলার সময় জানা নেই" };

  const now = clock.weekday * DAY + clock.minutes;
  const ranges = place.hours.map(toWeekRange);
  const current = ranges.find((r) => (now >= r.start && now < r.end) || (now + WEEK >= r.start && now + WEEK < r.end));
  if (current) return { isOpen: true, label: `এখন খোলা · ${formatTime(current.end)} পর্যন্ত` };

  const wait = (r: { start: number }) => (r.start - now + WEEK) % WEEK;
  const next = ranges.reduce((a, b) => (wait(b) < wait(a) ? b : a));
  const daysAhead = Math.floor((clock.minutes + wait(next)) / DAY);
  const day = daysAhead === 0 ? "" : daysAhead === 1 ? "আগামীকাল " : `${WEEKDAYS[Math.floor(next.start / DAY)]} `;
  return { isOpen: false, label: `এখন বন্ধ · ${day}${formatTime(next.start)}য় খুলবে` };
}

export function hoursLabel(place: Pick<Place, "open24h" | "hours">): string {
  if (place.open24h) return "২৪ ঘণ্টা খোলা";
  if (!place.hours.length) return "জানা নেই";

  const groups = new Map<string, number[]>();
  for (const slot of [...place.hours].sort((a, b) => a.weekday - b.weekday)) {
    const range = `${formatTime(slot.opens)} – ${formatTime(slot.closes)}`;
    groups.set(range, [...(groups.get(range) ?? []), slot.weekday]);
  }
  const openDays = new Set(place.hours.map((s) => s.weekday));
  const closedDays = WEEKDAYS.filter((_, day) => !openDays.has(day));
  const closedText = closedDays.length ? ` · ${closedDays.join(", ")} বন্ধ` : "";

  if (groups.size === 1) {
    const [range] = groups.keys();
    return closedDays.length ? `${range}${closedText}` : `প্রতিদিন ${range}`;
  }
  const perDay = [...groups].map(([range, days]) => `${days.map((d) => WEEKDAYS[d]).join(", ")}: ${range}`);
  return perDay.join(" · ") + closedText;
}

