"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import { SkeletonPage } from "@/components/ui/Skeleton";

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string | null;
  inventory_location: string | null;
  status: string;
  value: number | null;
  assigned_to: string | null;
  created_at: string;
}

type SortField = "name" | "category" | "location" | "value" | "created_at";
type SortDir = "asc" | "desc";

export default function DisposedAssetsPage() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const disposed = useMemo(() => {
    let result = assets.filter((a) => a.status === "retired");

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      const aVal: string | number = (a[sortField as keyof Asset] as string | number) ?? "";
      const bVal: string | number = (b[sortField as keyof Asset] as string | number) ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [assets, search, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="ml-1 text-foreground/20">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function formatCurrency(val: number | null) {
    if (val == null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Disposed Assets
        </h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Assets that have been retired and disposed of.
        </p>
      </div>

      {/* Search + count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-foreground/40">
          {disposed.length} {disposed.length === 1 ? "asset" : "assets"}
        </p>
        <div className="relative w-64">
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
            placeholder="Search disposed assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div>
        {isLoading ? (
          <SkeletonPage header={false} search={false} cols={5} />
        ) : disposed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center mb-4">
              <svg className="text-foreground/20" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground/50">No disposed assets</p>
            <p className="text-xs text-foreground/30 mt-1">Assets will appear here once they are disposed via the Asset Manager.</p>
          </div>
        ) : (
          <div className="border border-foreground/[0.08] rounded-2xl overflow-x-hidden overflow-y-auto max-h-[520px] scrollbar-hidden">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-foreground/[0.08]">
                  {([
                    ["name", "Name"],
                    ["category", "Category"],
                    ["location", "Last Location"],
                    ["value", "Value"],
                    ["created_at", "Date Added"],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="text-left pl-5 pr-2 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider cursor-pointer hover:text-foreground/70 transition-colors select-none whitespace-nowrap"
                    >
                      {label}
                      <SortIcon field={field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disposed.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors"
                  >
                    <td className="pl-5 pr-2 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                      {asset.name}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                      {asset.category}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/45 whitespace-nowrap">
                      {asset.location || asset.inventory_location || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                      {formatCurrency(asset.value)}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                      {new Date(asset.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
