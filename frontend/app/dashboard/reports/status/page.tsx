"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import { ReportLayout, ReportStatCard } from "@/components/dashboard/ReportLayout";
import { SkeletonPage } from "@/components/ui/Skeleton";

interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string | null;
  inventory_location: string | null;
  value: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  checked_out: "Checked Out",
  maintenance: "Maintenance",
  retired: "Retired",
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-600",
  checked_out: "bg-blue-500/10 text-blue-600",
  maintenance: "bg-amber-500/10 text-amber-600",
  retired: "bg-foreground/[0.06] text-foreground/50",
};

export default function StatusReportPage() {
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const statusGroups = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    assets.forEach((a) => {
      if (!groups[a.status]) groups[a.status] = [];
      groups[a.status].push(a);
    });
    return groups;
  }, [assets]);

  const total = assets.length;

  if (isLoading) {
    return (
      <ReportLayout title="Status Reports" description="Summary of asset statuses.">
        <SkeletonPage header={false} search={false} statCards={4} cols={4} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Status Reports" description="Summary of asset statuses across your inventory.">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(["available", "checked_out", "maintenance", "retired"] as const).map((status) => {
          const count = statusGroups[status]?.length ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <ReportStatCard
              key={status}
              label={STATUS_LABELS[status]}
              value={count}
              sub={`${pct}% of total`}
            />
          );
        })}
      </div>

      {/* Breakdown by status */}
      {(["available", "checked_out", "maintenance", "retired"] as const).map((status) => {
        const group = statusGroups[status] ?? [];
        if (group.length === 0) return null;
        return (
          <div key={status} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-xs text-foreground/40">{group.length} assets</span>
            </div>
            <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/[0.08]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden md:table-cell">Location</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden lg:table-cell">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((a) => (
                    <tr key={a.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{a.name}</td>
                      <td className="px-5 py-3 text-sm text-foreground/55 hidden sm:table-cell">{a.category}</td>
                      <td className="px-5 py-3 text-sm text-foreground/45 hidden md:table-cell">{a.location || a.inventory_location || "—"}</td>
                      <td className="px-5 py-3 text-sm text-foreground/55 hidden lg:table-cell">{a.value != null ? `$${a.value.toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </ReportLayout>
  );
}
