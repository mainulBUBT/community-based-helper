import data from "@/data/purposes.json";

export interface Purpose {
  id: string;
  name: string;
}

export const PURPOSES: Purpose[] = data;

const rankById = new Map(PURPOSES.map((p, i) => [p.id, i]));
const byId = new Map(PURPOSES.map((p) => [p.id, p]));

export const getPurpose = (id: string) => byId.get(id);

export const purposeRank = (id: string) => rankById.get(id) ?? PURPOSES.length;
