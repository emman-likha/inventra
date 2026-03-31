"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssetActions, AssetAction } from "@/lib/api";
import { ReportLayout, ReportStatCard } from "@/components/dashboard/ReportLayout";
import { SkeletonPage } from "@/components/ui/Skeleton";

export default function ReservationReportPage() {
  const { data: actions = [], isLoading } = useQuery<AssetAction[]>({
    queryKey: ["asset-actions"],
    queryFn: fetchAssetActions,
  });

  const reservations = useMemo(() => actions.filter((a) => a.action === "reserve"), [actions]);

  const pending = useMemo(
    () => reservations.filter((a) => a.action_date && new Date(a.action_date) > new Date()),
    [reservations]
  );

  if (isLoading) {
    return (
      <ReportLayout title="Reservation Reports" description="Reserved assets and bookings.">
        <SkeletonPage header={false} search={false} statCards={3} cols={5} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Reservation Reports" description="Reserved assets and their booking details.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ReportStatCard label="Total Reservations" value={reservations.length} />
        <ReportStatCard label="Pending" value={pending.length} sub="Upcoming reservations" />
        <ReportStatCard label="Completed" value={reservations.length - pending.length} />
      </div>

      {/* Table */}
      {reservations.length === 0 ? (
        <div className="flex items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <p className="text-sm text-foreground/40">No reservations found.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-hidden">
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Reserved For</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Department</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((act) => {
                const isPending = act.action_date && new Date(act.action_date) > new Date();
                return (
                  <tr key={act.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                      {new Date(act.action_date || act.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">{act.asset?.name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                      {act.member ? `${act.member.first_name} ${act.member.last_name}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">{act.department?.name || "—"}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {isPending ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">Pending</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">Completed</span>
                      )}
                    </td>
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
