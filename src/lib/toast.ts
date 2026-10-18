import { createStore } from "./create-store";

export const toastStore = createStore("");

let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string) {
  toastStore.set(message);
  clearTimeout(timer);
  timer = setTimeout(() => toastStore.set(""), 2600);
}
