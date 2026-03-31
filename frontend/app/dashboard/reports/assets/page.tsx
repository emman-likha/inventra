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

export default function AssetReportPage() {
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const totalValue = useMemo(() => assets.reduce((s, a) => s + (a.value ?? 0), 0), [assets]);

  const byCategory = useMemo(() => {
    const groups: Record<string, { count: number; value: number }> = {};
    assets.forEach((a) => {
      if (!groups[a.category]) groups[a.category] = { count: 0, value: 0 };
      groups[a.category].count++;
      groups[a.category].value += a.value ?? 0;
    });
    return Object.entries(groups).sort((a, b) => b[1].count - a[1].count);
  }, [assets]);

  const byLocation = useMemo(() => {
    const groups: Record<string, number> = {};
    assets.forEach((a) => {
      const loc = a.location || a.inventory_location || "Unassigned";
      groups[loc] = (groups[loc] || 0) + 1;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  if (isLoading) {
    return (
      <ReportLayout title="Asset Reports" description="Breakdown of assets.">
        <SkeletonPage header={false} search={false} statCards={3} cols={4} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Asset Reports" description="Breakdown of assets by category, location, and value.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ReportStatCard label="Total Assets" value={assets.length} />
        <ReportStatCard label="Total Value" value={`$${totalValue.toLocaleString()}`} />
        <ReportStatCard label="Categories" value={byCategory.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">By Category</h3>
          <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/[0.08]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Count</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map(([cat, data]) => (
                  <tr key={cat} className="border-b border-foreground/[0.06] last:border-0">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{cat}</td>
                    <td className="px-5 py-3 text-sm text-foreground/55">{data.count}</td>
                    <td className="px-5 py-3 text-sm text-foreground/55">${data.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Location */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">By Location</h3>
          <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-foreground/[0.08]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Assets</th>
                </tr>
              </thead>
              <tbody>
                {byLocation.map(([loc, count]) => (
                  <tr key={loc} className="border-b border-foreground/[0.06] last:border-0">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{loc}</td>
                    <td className="px-5 py-3 text-sm text-foreground/55">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
}
