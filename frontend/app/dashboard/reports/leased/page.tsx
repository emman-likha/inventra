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
  assigned_to: string | null;
  assigned_member: { id: string; first_name: string; last_name: string } | null;
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

export default function LeasedAssetReportPage() {
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  // Leased assets = currently assigned to someone (checked out)
  const leased = useMemo(() => assets.filter((a) => a.assigned_to), [assets]);

  const totalValue = useMemo(() => leased.reduce((s, a) => s + (a.value ?? 0), 0), [leased]);

  if (isLoading) {
    return (
      <ReportLayout title="Leased Asset Reports" description="Assets currently in use.">
        <SkeletonPage header={false} search={false} statCards={3} cols={5} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Leased Asset Reports" description="Assets currently assigned to members and their usage status.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ReportStatCard label="Leased Assets" value={leased.length} sub={`of ${assets.length} total`} />
        <ReportStatCard label="Total Value" value={`$${totalValue.toLocaleString()}`} />
        <ReportStatCard label="Unique Members" value={new Set(leased.map((a) => a.assigned_to)).size} />
      </div>

      {/* Table */}
      {leased.length === 0 ? (
        <div className="flex items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <p className="text-sm text-foreground/40">No leased assets found.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-hidden">
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Assigned To</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Location</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {leased.map((a) => (
                <tr key={a.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">{a.name}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">{a.category}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                    {a.assigned_member ? `${a.assigned_member.first_name} ${a.assigned_member.last_name}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground/45 whitespace-nowrap">{a.location || "—"}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[a.status] ?? ""}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
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
