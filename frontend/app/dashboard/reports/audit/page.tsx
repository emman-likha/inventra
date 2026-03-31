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

export default function AuditReportPage() {
  const [search, setSearch] = useState("");

  const { data: actions = [], isLoading } = useQuery<AssetAction[]>({
    queryKey: ["asset-actions"],
    queryFn: fetchAssetActions,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return actions;
    const q = search.toLowerCase();
    return actions.filter(
      (a) =>
        a.asset?.name?.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.member?.first_name?.toLowerCase().includes(q) ||
        a.member?.last_name?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
    );
  }, [actions, search]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return actions.filter((a) => new Date(a.created_at).toDateString() === today).length;
  }, [actions]);

  if (isLoading) {
    return (
      <ReportLayout title="Audit Reports" description="System accountability trail.">
        <SkeletonPage header={false} search={false} statCards={3} cols={6} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Audit Reports" description="Tracks all changes and actions for accountability and compliance.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ReportStatCard label="Total Actions" value={actions.length} />
        <ReportStatCard label="Today" value={todayCount} sub="Actions today" />
        <ReportStatCard label="Unique Assets" value={new Set(actions.map((a) => a.asset_id)).size} sub="Assets with activity" />
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search audit trail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <p className="text-sm text-foreground/40">No audit records found.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-hidden">
          <table className="w-full min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Action</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">By / For</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((act) => (
                <tr key={act.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                    {new Date(act.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                    <span className="text-foreground/25">
                      {new Date(act.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
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
                  <td className="px-5 py-3.5 text-xs text-foreground/40 max-w-[200px] truncate">
                    {[act.from_location && `From: ${act.from_location}`, act.to_location && `To: ${act.to_location}`, act.notes].filter(Boolean).join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportLayout>
  );
}
