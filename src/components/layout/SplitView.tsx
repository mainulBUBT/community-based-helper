import type { ReactNode } from "react";

interface SplitViewProps {
  header: ReactNode;
  map: ReactNode;
  children: ReactNode;
}

export function SplitView({ header, map, children }: SplitViewProps) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[minmax(380px,440px)_1fr] lg:grid-rows-[auto_1fr]">
      <div className="lg:col-start-1 lg:border-r lg:border-line-soft">{header}</div>
      <div className="px-4 lg:sticky lg:top-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-dvh lg:self-start lg:px-0">
        <div className="h-56 overflow-hidden rounded-2xl lg:h-full lg:rounded-none">{map}</div>
      </div>
      <div className="pt-2 lg:col-start-1 lg:border-r lg:border-line-soft">{children}</div>
    </div>
  );
}
