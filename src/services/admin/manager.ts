import { sampleManager, sampleManagerReply } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { ManagerMessage, ManagerStatus } from "@/types/admin";

const url = process.env.NEXT_PUBLIC_MANAGER_URL?.replace(/\/+$/, "");

// লাইভে Worker এর ঠিকানা না থাকলে ম্যানেজার এখনো বসানো হয়নি; ডেমোতে নমুনা
export const managerDeployed = Boolean(url) || !supabase;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase!.auth.getSession();
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${data.session?.access_token ?? ""}`, "content-type": "application/json" },
  });
  if (!res.ok) throw new Error(`Manager HTTP ${res.status}`);
  return res.json();
}

export async function loadManager(): Promise<ManagerStatus> {
  if (!supabase || !url) return { ...sampleManager, history: [...sampleManager.history] };
  return call("/status");
}

export async function askManager(message: string): Promise<ManagerMessage[]> {
  if (!supabase || !url) {
    const at = new Date().toISOString();
    const id = sampleManager.history.length;
    const added: ManagerMessage[] = [
      { id: id + 1, role: "user", text: message, steps: [], at },
      { id: id + 2, role: "manager", text: sampleManagerReply, steps: [], at },
    ];
    sampleManager.history.push(...added);
    return added;
  }
  return (await call<{ messages: ManagerMessage[] }>("/chat", { method: "POST", body: JSON.stringify({ message }) })).messages;
}
