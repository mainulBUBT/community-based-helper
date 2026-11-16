import { BrandMark } from "./BrandMark";

export function AppSplash({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="fixed inset-0 z-[80] hidden animate-splash-out flex-col items-center justify-center gap-3 bg-splash standalone:flex">
      <BrandMark size={120} />
      <span className="animate-splash-name text-3xl font-bold tracking-tight text-white">{name}</span>
    </div>
  );
}
