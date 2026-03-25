"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets, fetchDepartments } from "@/lib/api";

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

interface Department {
  id: string;
  name: string;
  member_count: number;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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

export default function DashboardPage() {
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const { data: departments = [], isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const stats = useMemo(() => {
    const total = assets.length;
    const checkedOut = assets.filter((a) => a.status === "checked_out").length;
    const categories = new Set(assets.map((a) => a.category)).size;
    const maintenance = assets.filter((a) => a.status === "maintenance").length;
    return { total, checkedOut, categories, maintenance };
  }, [assets]);

  const recentAssets = useMemo(() => assets.slice(0, 5), [assets]);
  const isLoading = assetsLoading || deptsLoading;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Your asset management at a glance.
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Assets", value: isLoading ? "—" : String(stats.total), sub: `${departments.length} departments` },
          { label: "Checked Out", value: isLoading ? "—" : String(stats.checkedOut), sub: stats.total > 0 ? `${Math.round((stats.checkedOut / stats.total) * 100)}% of total` : "0% of total" },
          { label: "Categories", value: isLoading ? "—" : String(stats.categories), sub: "Unique types" },
          { label: "Maintenance", value: isLoading ? "—" : String(stats.maintenance), sub: "Needs attention" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5 hover:bg-foreground/[0.06] transition-colors group"
          >
            <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-3">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-tight group-hover:translate-x-0.5 transition-transform">
              {stat.value}
            </p>
            <p className="text-foreground/40 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Recent assets table */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Assets</h2>
        </div>

        {assetsLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-foreground/40">Loading assets...</p>
          </div>
        ) : recentAssets.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-foreground/40">No assets yet.</p>
          </div>
        ) : (
          <div className="border border-foreground/[0.08] rounded-2xl overflow-x-hidden overflow-y-auto max-h-[520px] scrollbar-hidden">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-foreground/[0.08]">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.03] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{asset.name}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55 hidden sm:table-cell">{asset.category}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground/55 hidden md:table-cell">{asset.assigned_to ? (asset.location || "—") : (asset.inventory_location || "—")}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[asset.status] ?? ""}`}>
                        {STATUS_LABELS[asset.status] ?? asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
