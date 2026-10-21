import { Gamepad2, Headphones, Laptop, Monitor, Package, Smartphone, Tablet, Tv, Watch, type LucideIcon, type LucideProps } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  watch: Watch,
  headphones: Headphones,
  tv: Tv,
  monitor: Monitor,
  gaming: Gamepad2,
};

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Package;
  return <Icon aria-hidden="true" {...props} />;
}
