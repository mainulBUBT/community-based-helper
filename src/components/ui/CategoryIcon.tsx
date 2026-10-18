import { MapPin } from "lucide-react";
import { createElement } from "react";
import { getCategory } from "@/config/categories";

const TONES = {
  open: "bg-brand/15 text-brand",
  closed: "bg-surface-2 text-dim",
  plain: "bg-surface-2 text-ink-2",
};

interface CategoryIconProps {
  categoryId: string;
  tone?: keyof typeof TONES;
  size?: number;
}

export function CategoryIcon({ categoryId, tone = "plain", size = 40 }: CategoryIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}
      style={{ width: size, height: size }}
    >
      {createElement(getCategory(categoryId)?.icon ?? MapPin, { size: Math.round(size * 0.48) })}
    </span>
  );
}
