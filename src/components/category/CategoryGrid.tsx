import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { CATEGORIES } from "@/config/categories";
import { categoryPath } from "@/utils/links";

export function CategoryGrid() {
  return (
    <ul className="grid grid-cols-4 gap-1 px-2 sm:grid-cols-5">
      {CATEGORIES.map((c) => (
        <li key={c.id}>
          <Link
            href={categoryPath(c.id)}
            transitionTypes={["nav-forward"]}
            className="flex h-full flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center text-xs font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink active:scale-95"
          >
            <CategoryIcon categoryId={c.id} size={44} />
            {c.short}
          </Link>
        </li>
      ))}
    </ul>
  );
}
