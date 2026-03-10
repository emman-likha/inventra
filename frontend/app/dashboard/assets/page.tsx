"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type SortField = "name" | "category" | "location" | "status" | "value" | "created_at";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS = ["all", "available", "checked_out", "maintenance", "retired"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "All Status",
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

async function fetchAssets() {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MyAssetsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: assets = [], isLoading, isError } = useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const categories = useMemo(() => {
    const cats = new Set(assets.map((a: { category: string }) => a.category));
    return ["all", ...Array.from(cats).sort()];
  }, [assets]);

  const filtered = useMemo(() => {
    let result = [...assets];

    if (statusFilter !== "all") {
      result = result.filter((a: { status: string }) => a.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((a: { category: string }) => a.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a: { name: string; category: string; location?: string }) =>
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }
    result.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [assets, statusFilter, categoryFilter, search, sortField, sortDir]);

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
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          My Assets
        </h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Browse and manage all registered assets.
        </p>
      </motion.div>

      {/* Controls: Search + Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, category, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/20 transition-colors cursor-pointer appearance-none min-w-[150px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/20 transition-colors cursor-pointer appearance-none min-w-[150px]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Results count */}
      <motion.div variants={fadeUp} className="mb-4">
        <p className="text-xs text-foreground/40">
          {filtered.length} {filtered.length === 1 ? "asset" : "assets"} found
        </p>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-foreground/40">Loading assets...</p>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-red-500/70">Failed to load assets. Please try again.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="text-foreground/15 mb-4"
              width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <p className="text-sm text-foreground/40">No assets found</p>
            <p className="text-xs text-foreground/25 mt-1">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-foreground/[0.08]">
                    {([
                      ["name", "Name"],
                      ["category", "Category"],
                      ["location", "Location"],
                      ["status", "Status"],
                      ["value", "Value"],
                      ["created_at", "Date Added"],
                    ] as [SortField, string][]).map(([field, label]) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className={`text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider cursor-pointer hover:text-foreground/70 transition-colors select-none whitespace-nowrap ${
                          field === "location" ? "hidden md:table-cell" : ""
                        } ${field === "created_at" ? "hidden lg:table-cell" : ""}`}
                      >
                        {label}
                        <SortIcon field={field} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset: Record<string, unknown>) => (
                    <tr
                      key={asset.id as string}
                      className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.03] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                        {asset.name as string}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                        {asset.category as string}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground/55 hidden md:table-cell whitespace-nowrap">
                        {(asset.location as string) || "—"}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            STATUS_STYLES[asset.status as string] ?? ""
                          }`}
                        >
                          {STATUS_LABELS[asset.status as string] ?? (asset.status as string)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                        {formatCurrency(asset.value as number | null)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-foreground/40 hidden lg:table-cell whitespace-nowrap">
                        {new Date(asset.created_at as string).toLocaleDateString("en-US", {
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
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
