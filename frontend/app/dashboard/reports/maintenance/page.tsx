"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssetActions, fetchAssets, AssetAction } from "@/lib/api";
import { ReportLayout, ReportStatCard } from "@/components/dashboard/ReportLayout";
import { SkeletonPage } from "@/components/ui/Skeleton";

interface Asset {
  id: string;
  name: string;
  status: string;
}

export default function MaintenanceReportPage() {
  const { data: actions = [], isLoading: actionsLoading } = useQuery<AssetAction[]>({
    queryKey: ["asset-actions"],
    queryFn: fetchAssetActions,
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const maintenanceActions = useMemo(
    () => actions.filter((a) => a.action === "maintenance"),
    [actions]
  );

  const currentlyInMaintenance = useMemo(
    () => assets.filter((a) => a.status === "maintenance").length,
    [assets]
  );

  const isLoading = actionsLoading || assetsLoading;

  if (isLoading) {
    return (
      <ReportLayout title="Maintenance Reports" description="Maintenance history and schedules.">
        <SkeletonPage header={false} search={false} statCards={3} cols={5} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Maintenance Reports" description="Maintenance history, schedules, and related asset actions.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ReportStatCard label="Total Maintenance Actions" value={maintenanceActions.length} />
        <ReportStatCard label="Currently In Maintenance" value={currentlyInMaintenance} />
        <ReportStatCard label="Unique Assets Serviced" value={new Set(maintenanceActions.map((a) => a.asset_id)).size} />
      </div>

      {/* Table */}
      {maintenanceActions.length === 0 ? (
        <div className="flex items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <p className="text-sm text-foreground/40">No maintenance records found.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-hidden">
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceActions.map((act) => {
                const isPending = act.action_date && new Date(act.action_date) > new Date();
                return (
                  <tr key={act.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                      {new Date(act.action_date || act.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">{act.asset?.name ?? "—"}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {isPending ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">Scheduled</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">Completed</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground/40 max-w-[250px] truncate">{act.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ReportLayout>
  );
}
