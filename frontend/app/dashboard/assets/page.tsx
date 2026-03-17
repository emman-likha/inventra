"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAssets, deleteAssets } from "@/lib/api";
import { AddAssetModal } from "@/components/dashboard/AddAssetModal";
import { ImportAssetModal } from "@/components/dashboard/ImportAssetModal";
import { EditAssetModal } from "@/components/dashboard/EditAssetModal";
import { Dropdown } from "@/components/ui/Dropdown";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

const ASSET_COLUMNS = [
  { key: "name", label: "Name", locked: true },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "assigned_to", label: "Assigned To" },
  { key: "value", label: "Value" },
  { key: "created_at", label: "Date Added" },
];
const DEFAULT_ASSET_COLS = new Set(ASSET_COLUMNS.map((c) => c.key));

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string | null;
  status: string;
  value: number | null;
  assigned_to: string | null;
  assigned_member: { id: string; first_name: string; last_name: string } | null;
  created_at: string;
  created_by: string;
}

type SortField = "name" | "category" | "location" | "status" | "assigned_to" | "value" | "created_at";
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

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MyAssetsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [visibleCols, setVisibleCols] = useColumnVisibility("cols:assets", DEFAULT_ASSET_COLS);

  const { data: assets = [], isLoading, isError } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteAssets(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setSelectedIds(new Set());
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(assets.map((a) => a.category));
    return ["all", ...Array.from(cats).sort()];
  }, [assets]);

  const filtered = useMemo(() => {
    let result = [...assets];

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter);
    }
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
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortField === "assigned_to") {
        aVal = a.assigned_member ? `${a.assigned_member.first_name} ${a.assigned_member.last_name}` : "";
        bVal = b.assigned_member ? `${b.assigned_member.first_name} ${b.assigned_member.last_name}` : "";
      } else {
        aVal = (a[sortField as keyof Asset] as string | number) ?? "";
        bVal = (b[sortField as keyof Asset] as string | number) ?? "";
      }
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

  const allSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const someSelected = filtered.some((a) => selectedIds.has(a.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-end gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <label className="block text-xs font-medium text-foreground/40 mb-1.5 ml-1 select-none">Search Assets</label>
          <div className="relative">
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
              placeholder="Name, category, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
            />
          </div>
        </div>

        <Dropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
          className="w-full sm:w-[160px]"
        />

        <Dropdown
          label="Category"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categories}
          placeholder="All Categories"
          className="w-full sm:w-[180px]"
        />

        <div className="flex flex-col">
          <label className="block text-xs font-medium text-foreground/40 mb-1.5 ml-1 select-none">&nbsp;</label>
          <ColumnToggle columns={ASSET_COLUMNS} visible={visibleCols} onChange={setVisibleCols} />
        </div>
      </motion.div>

      {/* Results count + Delete Selected */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
        <p className="text-xs text-foreground/40">
          {filtered.length} {filtered.length === 1 ? "asset" : "assets"} found
          {selectedIds.size > 0 && (
            <span className="ml-2 text-foreground/60 font-medium">
              ({selectedIds.size} selected)
            </span>
          )}
        </p>
        {selectedIds.size > 0 && (
          <button
            onClick={() => deleteMutation.mutate([...selectedIds])}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Delete Selected ({selectedIds.size})
          </button>
        )}
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
            <div className="w-16 h-16 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center mb-5">
              <svg
                className="text-foreground/20"
                width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground/50">No assets found</p>
            <p className="text-xs text-foreground/30 mt-1 mb-6">Get started by adding your first asset or importing from a file.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Asset
              </button>
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-2 bg-foreground/[0.03] border border-foreground/[0.08] text-foreground/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/[0.06] transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import Assets
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-foreground/[0.08] rounded-2xl overflow-x-hidden overflow-y-auto max-h-[520px] scrollbar-hidden">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-foreground/[0.08]">
                  <th className="w-[44px] pl-4 pr-1 py-3.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-foreground/20 text-foreground accent-foreground cursor-pointer"
                    />
                  </th>
                  {([
                    ["name", "Name"],
                    ["category", "Category"],
                    ["location", "Location"],
                    ["status", "Status"],
                    ["assigned_to", "Assigned To"],
                    ["value", "Value"],
                    ["created_at", "Date Added"],
                  ] as [SortField, string][]).filter(([field]) => visibleCols.has(field)).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="text-left pl-5 pr-2 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider cursor-pointer hover:text-foreground/70 transition-colors select-none whitespace-nowrap"
                    >
                      {label}
                      <SortIcon field={field} />
                    </th>
                  ))}
                  <th className="w-[52px] px-2 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider text-center select-none border-l border-foreground/[0.08]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.03] transition-colors"
                  >
                    <td className="pl-4 pr-1 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(asset.id)}
                        onChange={() => toggleSelect(asset.id)}
                        className="w-4 h-4 rounded border-foreground/20 text-foreground accent-foreground cursor-pointer"
                      />
                    </td>
                    {visibleCols.has("name") && (
                      <td className="pl-5 pr-2 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                        {asset.name}
                      </td>
                    )}
                    {visibleCols.has("category") && (
                      <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                        {asset.category}
                      </td>
                    )}
                    {visibleCols.has("location") && (
                      <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                        {asset.location || "—"}
                      </td>
                    )}
                    {visibleCols.has("status") && (
                      <td className="pl-5 pr-2 py-3.5 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[asset.status] ?? ""}`}
                        >
                          {STATUS_LABELS[asset.status] ?? asset.status}
                        </span>
                      </td>
                    )}
                    {visibleCols.has("assigned_to") && (
                      <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                        {asset.assigned_member
                          ? `${asset.assigned_member.first_name} ${asset.assigned_member.last_name}`
                          : "—"}
                      </td>
                    )}
                    {visibleCols.has("value") && (
                      <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                        {formatCurrency(asset.value)}
                      </td>
                    )}
                    {visibleCols.has("created_at") && (
                      <td className="pl-5 pr-2 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                        {new Date(asset.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    )}
                    <td className="px-2 py-3.5 text-center border-l border-foreground/[0.08]">
                      <ActionMenu
                        items={[
                          {
                            label: "Edit",
                            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
                            onClick: () => setEditAsset(asset),
                          },
                          {
                            label: "Delete",
                            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
                            onClick: () => deleteMutation.mutate([asset.id]),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Action buttons below table */}
      {!isLoading && !isError && assets.length > 0 && (
        <motion.div variants={fadeUp} className="flex gap-3 mt-4">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Asset
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-foreground/[0.03] border border-foreground/[0.08] text-foreground/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/[0.06] transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Assets
          </button>
        </motion.div>
      )}

      <AddAssetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <ImportAssetModal open={importModalOpen} onClose={() => setImportModalOpen(false)} />
      <EditAssetModal open={!!editAsset} onClose={() => setEditAsset(null)} asset={editAsset} />
    </motion.div>
  );
}
