import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ProductEditor } from "./ProductEditor";

export default function EditProductPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ProductEditor />
    </Suspense>
  );
}
