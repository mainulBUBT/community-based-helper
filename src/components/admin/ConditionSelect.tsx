"use client";

import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { categoryConditions, conditionLabel } from "@/utils/categories";
import { Select } from "./Field";

// পণ্যের ক্যাটাগরিতে যে ধরনগুলো হয় শুধু সেগুলো (জুতায় আসল/কপি, ফোনে ওয়ারেন্টি)
export function ConditionSelect({ category }: { category: string | undefined }) {
  const { t } = useAdminI18n();
  const { categories } = useAdminCategories();
  const info = categories.find((c) => c.slug === category);
  const options = categoryConditions(info);
  return (
    <Select key={category} label={t.admin.products.condition} name="condition" defaultValue={options[0]}>
      {options.map((condition) => (
        <option key={condition} value={condition}>
          {conditionLabel(t, condition, info?.warranty !== false)}
        </option>
      ))}
    </Select>
  );
}
