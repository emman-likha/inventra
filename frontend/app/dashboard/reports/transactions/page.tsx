"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssetActions, AssetAction } from "@/lib/api";
import { ReportLayout, ReportStatCard } from "@/components/dashboard/ReportLayout";
import { SkeletonPage } from "@/components/ui/Skeleton";

const ACTION_LABELS: Record<string, string> = {
  check_out: "Check Out",
  check_in: "Check In",
  move: "Move",
  maintenance: "Maintenance",
  dispose: "Dispose",
  reserve: "Reserve",
};

export default function TransactionReportPage() {
  const [filter, setFilter] = useState("all");

  const { data: actions = [], isLoading } = useQuery<AssetAction[]>({
    queryKey: ["asset-actions"],
    queryFn: fetchAssetActions,
  });

  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    actions.forEach((a) => {
      counts[a.action] = (counts[a.action] || 0) + 1;
    });
    return counts;
  }, [actions]);

  const filtered = useMemo(() => {
    if (filter === "all") return actions;
    return actions.filter((a) => a.action === filter);
  }, [actions, filter]);

  if (isLoading) {
    return (
      <ReportLayout title="Transaction Reports" description="Full record of asset transactions.">
        <SkeletonPage header={false} search={false} statCards={4} cols={6} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Transaction Reports" description="Complete record of all asset transactions and movements.">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ReportStatCard label="Total Transactions" value={actions.length} />
        <ReportStatCard label="Check Outs" value={actionCounts["check_out"] ?? 0} />
        <ReportStatCard label="Check Ins" value={actionCounts["check_in"] ?? 0} />
        <ReportStatCard label="Moves" value={actionCounts["move"] ?? 0} />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "check_out", "check_in", "move", "maintenance", "dispose", "reserve"].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === key
                ? "bg-foreground text-background"
                : "bg-foreground/[0.05] text-foreground/50 hover:text-foreground/70"
            }`}
          >
            {key === "all" ? "All" : ACTION_LABELS[key] ?? key}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <p className="text-sm text-foreground/40">No transactions found.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-hidden">
          <table className="w-full min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Action</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">From</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">To</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((act) => (
                <tr key={act.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                    {new Date(act.action_date || act.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">{act.asset?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-foreground/[0.06] text-foreground/60">
                      {ACTION_LABELS[act.action] ?? act.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                    {act.member ? `${act.member.first_name} ${act.member.last_name}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground/45 whitespace-nowrap">{act.from_location || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/45 whitespace-nowrap">{act.to_location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportLayout>
  );
}
