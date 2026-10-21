import { LoaderCircle } from "lucide-react";

export function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return <LoaderCircle size={size} className="animate-spin" role={label ? "status" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}
