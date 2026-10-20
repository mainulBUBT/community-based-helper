import { createStore } from "./create-store";

export const toastStore = createStore<{ id: number; text: string } | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(text: string) {
  toastStore.set({ id: Date.now(), text });
  clearTimeout(timer);
  timer = setTimeout(() => toastStore.set(null), 2600);
}
