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
  value: number | null;
  created_at: string;
}

function calcDepreciation(originalValue: number, createdAt: string, usefulLifeYears = 5) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  const annualDep = originalValue / usefulLifeYears;
  const totalDep = Math.min(annualDep * ageYears, originalValue);
  const currentValue = Math.max(originalValue - totalDep, 0);
  return { ageYears, totalDep, currentValue, annualDep };
}

export default function DepreciationReportPage() {
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const assetsWithValue = useMemo(() => assets.filter((a) => a.value && a.value > 0), [assets]);

  const totals = useMemo(() => {
    let originalTotal = 0;
    let currentTotal = 0;
    let totalDep = 0;
    assetsWithValue.forEach((a) => {
      const d = calcDepreciation(a.value!, a.created_at);
      originalTotal += a.value!;
      currentTotal += d.currentValue;
      totalDep += d.totalDep;
    });
    return { originalTotal, currentTotal, totalDep };
  }, [assetsWithValue]);

  if (isLoading) {
    return (
      <ReportLayout title="Depreciation Reports" description="Asset depreciation calculations.">
        <SkeletonPage header={false} search={false} statCards={3} cols={6} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="Depreciation Reports" description="Calculates straight-line depreciation over a 5-year useful life.">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ReportStatCard label="Original Value" value={`$${totals.originalTotal.toLocaleString()}`} sub={`${assetsWithValue.length} assets with value`} />
        <ReportStatCard label="Current Value" value={`$${Math.round(totals.currentTotal).toLocaleString()}`} />
        <ReportStatCard label="Total Depreciation" value={`$${Math.round(totals.totalDep).toLocaleString()}`} />
      </div>

      {/* Table */}
      {assetsWithValue.length === 0 ? (
        <div className="flex items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <p className="text-sm text-foreground/40">No assets with recorded value.</p>
        </div>
      ) : (
        <div className="border border-foreground/[0.08] rounded-2xl overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-hidden">
          <table className="w-full min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Asset</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Original</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Age</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Depreciated</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Current Value</th>
              </tr>
            </thead>
            <tbody>
              {assetsWithValue.map((a) => {
                const d = calcDepreciation(a.value!, a.created_at);
                return (
                  <tr key={a.id} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">{a.name}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">{a.category}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">${a.value!.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/45 whitespace-nowrap">
                      {d.ageYears < 1 ? `${Math.round(d.ageYears * 12)}mo` : `${d.ageYears.toFixed(1)}yr`}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-red-500/70 whitespace-nowrap">-${Math.round(d.totalDep).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">${Math.round(d.currentValue).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-foreground/30 mt-4">
        Depreciation calculated using straight-line method with a 5-year useful life and zero salvage value.
      </p>
    </ReportLayout>
  );
}
