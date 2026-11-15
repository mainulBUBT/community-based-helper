import { compareMeta } from "../../_compare-meta";

export const onRequestGet = (ctx: Parameters<typeof compareMeta>[0]) => compareMeta(ctx, "en");
