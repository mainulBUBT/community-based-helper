import { sampleSellers } from "@/data/sample";
import { supabase } from "@/lib/supabase";
import type { Seller } from "@/types/catalog";
import { loadCatalog } from "../catalog-live";
import { fromSeller, toSeller } from "../mappers";
import { logAction } from "./audit";

export async function listAllSellers(): Promise<Seller[]> {
  if (!supabase) return [...sampleSellers];
  const { data, error } = await supabase.from("sellers").select("*").order("created_at");
  if (error) throw error;
  return data.map(toSeller);
}

export async function saveSeller(seller: Seller) {
  const isNew = !seller.id;
  let id = seller.id;
  if (!supabase) {
    if (isNew) {
      id = `s${Date.now()}`;
      sampleSellers.push({ ...seller, id });
    } else {
      const i = sampleSellers.findIndex((s) => s.id === seller.id);
      if (i >= 0) sampleSellers.splice(i, 1, seller);
    }
  } else {
    const row = fromSeller(seller);
    if (isNew) {
      const { data, error } = await supabase.from("sellers").insert(row).select("id").single();
      if (error) throw error;
      id = String(data.id);
    } else {
      const { error } = await supabase.from("sellers").update(row).eq("id", seller.id);
      if (error) throw error;
    }
  }
  await loadCatalog(true);
  await logAction(isNew ? "seller.create" : "seller.update", { name: seller.name, verified: seller.verified });
  return id;
}

export async function deleteSeller(seller: Seller) {
  if (!supabase) {
    const i = sampleSellers.findIndex((s) => s.id === seller.id);
    if (i >= 0) sampleSellers.splice(i, 1);
  } else {
    const { error } = await supabase.from("sellers").delete().eq("id", seller.id);
    if (error) throw error;
  }
  await loadCatalog(true);
  await logAction("seller.delete", { name: seller.name });
}
