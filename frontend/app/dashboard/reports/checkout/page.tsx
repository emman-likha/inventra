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
  value: number | null;
  assigned_to: string | null;
  assigned_member: { id: string; first_name: string; last_name: string } | null;
  created_at: string;
}

export default function CheckOutReportPage() {
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const checkedOut = useMemo(() => assets.filter((a) => a.status === "checked_out"), [assets]);

  const totalValue = useMemo(
    () => checkedOut.reduce((sum, a) => sum + (a.value ?? 0), 0),
    [checkedOut]
  );

  const uniqueMembers = useMemo(
    () => new Set(checkedOut.map((a) => a.assigned_to).filter(Boolean)).size,
    [checkedOut]
  );

  if (isLoading) {
    return (
      <ReportLayout title="Check-Out Reports" description="Currently checked-out assets.">
        <SkeletonPage header={false} search={false} statCards={3} cols={5} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Check-Out Reports" description="Assets currently checked out — who has them and their details.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ReportStatCard label="Checked Out" value={checkedOut.length} sub={`of ${assets.length} total assets`} />
        <ReportStatCard label="Total Value Out" value={`$${totalValue.toLocaleString()}`} sub="Combined asset value" />
        <ReportStatCard label="Assigned Members" value={uniqueMembers} sub="Currently holding assets" />
      </div>

      {/* Table */}
      {checkedOut.length === 0 ? (
        <div className="flex items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <p className="text-sm text-foreground/40">No assets are currently checked out.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Assigned To</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Location</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody>
              {checkedOut.map((a) => (
                <tr key={a.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">{a.name}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">{a.category}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                    {a.assigned_member
                      ? `${a.assigned_member.first_name} ${a.assigned_member.last_name}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground/45 whitespace-nowrap">{a.location || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">{a.value != null ? `$${a.value.toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportLayout>
  );
}
