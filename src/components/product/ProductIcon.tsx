/* eslint-disable @next/next/no-img-element */
import { Laptop, Smartphone, Tablet, Watch } from "lucide-react";
import type { Product } from "@/types/catalog";

const ICONS = { phone: Smartphone, laptop: Laptop, tablet: Tablet, watch: Watch };

function iconKind(product: Product): keyof typeof ICONS {
  if (product.category === "watch") return "watch";
  if (/macbook|laptop/i.test(product.name)) return "laptop";
  if (/ipad|tab/i.test(product.name)) return "tablet";
  return "phone";
}

const BOXES = {
  xs: "size-9 rounded-sm",
  sm: "size-12 rounded-sm",
  md: "size-16 rounded-md",
  lg: "size-20 rounded-md",
};

const PADS = {
  xs: "p-1",
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

const ICON_SIZE = { xs: 18, sm: 22, md: 28, lg: 40 };

export function ProductIcon({ product, size = "md", plain = false }: { product: Product; size?: keyof typeof BOXES; plain?: boolean }) {
  const src = product.images?.[0];
  if (src) {
    return <img src={src} alt={`${product.brand} ${product.name}`} loading="lazy" className={`shrink-0 object-contain ${plain ? "" : "rounded-sm bg-surface ring-1 ring-line"} ${BOXES[size]} ${PADS[size]}`} />;
  }
  const Icon = ICONS[iconKind(product)];
  return (
    <span className={`flex shrink-0 items-center justify-center text-faint ${plain ? "" : "rounded-sm bg-surface ring-1 ring-line"} ${BOXES[size]}`}>
      <Icon size={ICON_SIZE[size]} strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}
