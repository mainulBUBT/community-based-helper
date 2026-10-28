"use client";

import { PageTitle, Panel } from "@/components/admin/Panel";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { loadUsage } from "@/services/admin/usage";

const MB = 1024 * 1024;
const DAY = 86_400_000;

interface Meter {
  key: string;
  name: string;
  hint: string;
  used: number | null;
  limit: number;
  label: (value: number) => string;
  note?: string;
}

function tone(share: number) {
  if (share >= 0.9) return { bar: "bg-sale", text: "text-sale" };
  if (share >= 0.7) return { bar: "bg-gold", text: "text-gold-text" };
  return { bar: "bg-ok", text: "text-ok" };
}

function MeterRow({ meter, pending }: { meter: Meter; pending: string }) {
  const { t, num } = useAdminI18n();
  const share = meter.used === null ? 0 : Math.min(1, meter.used / meter.limit);
  const color = tone(share);
  return (
    <li className="flex flex-col gap-2 px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold">{meter.name}</span>
        {meter.used === null ? (
          <span className="text-sm text-faint">{pending}</span>
        ) : (
          <span className="text-sm text-dim">
            <span className={`font-bold ${color.text}`}>{num(Math.round(share * 100))}%</span> · {t.admin.limits.of(meter.label(meter.used), meter.label(meter.limit))}
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${Math.max(share * 100, meter.used ? 1 : 0)}%` }} />
      </div>
      <p className="text-[13px] text-dim">
        {meter.hint}
        {meter.note && <span className="text-faint"> · {meter.note}</span>}
      </p>
    </li>
  );
}

export default function LimitsPage() {
  const { t, num, ago } = useAdminI18n();
  const l = t.admin.limits;
  const { data, error, loading, reload } = useAsync(loadUsage, []);

  const body = () => {
    if (loading) return <ListSkeleton />;
    if (error || !data) return <ErrorNotice onRetry={reload} />;
    const { deploy } = data;
    const count = (v: number) => num(v.toLocaleString("en-IN"));
    const mb = (v: number) => `${num((v / MB).toFixed(v < 10 * MB ? 1 : 0))} MB`;
    const days = (v: number) => l.days(num(v));
    const since = (iso: string | null | undefined) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : null);
    const built = deploy.at ? l.updated(ago(deploy.at)) : undefined;

    const meters: Meter[] = [
      { key: "files", ...l.files, used: deploy.files ?? null, limit: 20_000, label: count, note: built },
      { key: "largest", ...l.largest, used: deploy.largest ?? null, limit: 25 * MB, label: mb, note: built },
      { key: "deploys", ...l.deploys, used: data.deploysThisMonth, limit: 500, label: count },
      { key: "db", ...l.db, used: data.dbBytes, limit: 500 * MB, label: mb },
      { key: "views", ...l.views, used: data.viewsToday, limit: 10_000, label: count },
      { key: "alerts", ...l.alerts, used: data.alerts, limit: 50_000, label: count },
      { key: "commit", ...l.commit, used: since(deploy.lastCommit), limit: 60, label: days, note: deploy.lastCommit ? ago(deploy.lastCommit) : undefined },
      { key: "pause", ...l.pause, used: since(data.lastJobRun), limit: 7, label: days, note: data.lastJobRun ? ago(data.lastJobRun) : undefined },
    ];
    const elsewhere = [l.egress, l.edge, l.functions, l.domain];

    return (
      <div className="flex flex-col gap-6">
        <Panel title={l.measured}>
          <ul className="divide-y divide-line-soft">
            {meters.map((meter) => (
              <MeterRow key={meter.key} meter={meter} pending={l.noDeploy} />
            ))}
          </ul>
        </Panel>
        <Panel title={l.dashboard}>
          <ul className="divide-y divide-line-soft text-sm">
            {elsewhere.map((item) => (
              <li key={item.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
                <span className="font-semibold">{item.name}</span>
                <span className="text-dim">
                  {item.limit} · <span className="text-faint">{item.where}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  };

  return (
    <>
      <PageTitle title={l.title} subtitle={l.subtitle} />
      {body()}
    </>
  );
}
