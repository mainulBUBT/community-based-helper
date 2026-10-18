import {
  CreditCard,
  Cross,
  Droplets,
  Flame,
  Fuel,
  MapPin,
  Microscope,
  PawPrint,
  Pill,
  Shield,
  Siren,
  Tag,
  Toilet,
  Utensils,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import data from "@/data/categories.json";

export interface Category {
  id: string;
  name: string;
  short: string;
  isMarket: boolean;
  icon: LucideIcon;
}

const ICONS: Record<string, LucideIcon> = {
  pharma: Pill,
  hosp: Cross,
  diag: Microscope,
  fuel: Fuel,
  atm: CreditCard,
  amb: Siren,
  blood: Droplets,
  fire: Flame,
  thana: Shield,
  vet: PawPrint,
  food: Utensils,
  mech: Wrench,
  cheap: Tag,
  wholesale: Warehouse,
  toilet: Toilet,
};

export const CATEGORIES: Category[] = data.map((c) => ({ ...c, icon: ICONS[c.id] ?? MapPin }));

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string | null | undefined): Category | undefined {
  return id ? byId.get(id) : undefined;
}
