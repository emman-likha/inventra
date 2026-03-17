"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchInventories, deleteInventories, type Inventory } from "@/lib/api";
import { AddInventoryModal } from "@/components/dashboard/AddInventoryModal";
import { ImportInventoryModal } from "@/components/dashboard/ImportInventoryModal";
import { EditInventoryModal } from "@/components/dashboard/EditInventoryModal";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { ColumnToggle } from "@/components/ui/ColumnToggle";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";

const INV_COLUMNS = [
  { key: "name", label: "Name", locked: true },
  { key: "category", label: "Category" },
  { key: "quantity", label: "Quantity" },
  { key: "cost_per_unit", label: "Unit Cost" },
  { key: "location", label: "Location" },
  { key: "created_at", label: "Date Added" },
];
const DEFAULT_INV_COLS = new Set(INV_COLUMNS.map((c) => c.key));

type SortField = "name" | "category" | "quantity" | "cost_per_unit" | "location" | "created_at";
type SortDir = "asc" | "desc";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editInventory, setEditInventory] = useState<Inventory | null>(null);
  const [visibleCols, setVisibleCols] = useColumnVisibility("cols:inventory", DEFAULT_INV_COLS);

  const { data: inventories = [], isLoading, isError } = useQuery<Inventory[]>({
    queryKey: ["inventories"],
    queryFn: fetchInventories,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteInventories(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      setSelectedIds(new Set());
    },
  });

  const filtered = useMemo(() => {
    let result = [...inventories];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.name.toLowerCase().includes(q) ||
          inv.category?.toLowerCase().includes(q) ||
          inv.location?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortField === "quantity" || sortField === "cost_per_unit") {
        const aVal = (a[sortField] as number) ?? 0;
        const bVal = (b[sortField] as number) ?? 0;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [inventories, search, sortField, sortDir]);

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

  const allSelected = filtered.length > 0 && filtered.every((inv) => selectedIds.has(inv.id));
  const someSelected = filtered.some((inv) => selectedIds.has(inv.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((inv) => inv.id)));
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

  const lowStockCount = inventories.filter((inv) => inv.quantity <= inv.min_quantity && inv.min_quantity > 0).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Inventory
        </h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Track consumables, spare parts, and stock items.
        </p>
      </motion.div>

      {/* Low stock warning */}
      {lowStockCount > 0 && (
        <motion.div variants={fadeUp} className="mb-6 flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <svg className="text-amber-600 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-xs font-medium text-amber-700">
            {lowStockCount} {lowStockCount === 1 ? "item is" : "items are"} at or below minimum stock level
          </p>
        </motion.div>
      )}

      {/* Controls: Search */}
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
        <ColumnToggle columns={INV_COLUMNS} visible={visibleCols} onChange={setVisibleCols} />
      </motion.div>

      {/* Results count + Delete Selected */}
      <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
        <p className="text-xs text-foreground/40">
          {filtered.length} {filtered.length === 1 ? "item" : "items"}
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
            <p className="text-sm text-foreground/40">Loading inventory...</p>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-red-500/70">Failed to load inventory.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center mb-5">
              <svg
                className="text-foreground/20"
                width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground/50">No inventory items found</p>
            <p className="text-xs text-foreground/30 mt-1 mb-6">Get started by adding stock items or importing from a file.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Item
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
                Import Items
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
                    ["quantity", "Quantity"],
                    ["cost_per_unit", "Unit Cost"],
                    ["location", "Location"],
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
                {filtered.map((inv) => {
                  const isLowStock = inv.quantity <= inv.min_quantity && inv.min_quantity > 0;
                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.03] transition-colors"
                    >
                      <td className="pl-4 pr-1 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv.id)}
                          onChange={() => toggleSelect(inv.id)}
                          className="w-4 h-4 rounded border-foreground/20 text-foreground accent-foreground cursor-pointer"
                        />
                      </td>
                      {visibleCols.has("name") && (
                        <td className="pl-5 pr-2 py-3.5">
                          <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            {inv.name}
                          </p>
                          {inv.description && (
                            <p className="text-xs text-foreground/40 mt-0.5 truncate max-w-[260px]">
                              {inv.description}
                            </p>
                          )}
                        </td>
                      )}
                      {visibleCols.has("category") && (
                        <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                          {inv.category || "—"}
                        </td>
                      )}
                      {visibleCols.has("quantity") && (
                        <td className="pl-5 pr-2 py-3.5 whitespace-nowrap">
                          <span className={`text-sm font-medium ${isLowStock ? "text-amber-600" : "text-foreground/70"}`}>
                            {inv.quantity}
                          </span>
                          <span className="text-xs text-foreground/40 ml-1">{inv.unit}</span>
                          {isLowStock && (
                            <span className="ml-2 text-[10px] font-semibold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">
                              LOW
                            </span>
                          )}
                        </td>
                      )}
                      {visibleCols.has("cost_per_unit") && (
                        <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                          {formatCurrency(inv.cost_per_unit)}
                        </td>
                      )}
                      {visibleCols.has("location") && (
                        <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                          {inv.location || "—"}
                        </td>
                      )}
                      {visibleCols.has("created_at") && (
                        <td className="pl-5 pr-2 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                          {new Date(inv.created_at).toLocaleDateString("en-US", {
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
                              onClick: () => setEditInventory(inv),
                            },
                            {
                              label: "Delete",
                              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
                              onClick: () => deleteMutation.mutate([inv.id]),
                              danger: true,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Action buttons below table */}
      {!isLoading && !isError && inventories.length > 0 && (
        <motion.div variants={fadeUp} className="flex gap-3 mt-4">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Item
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
            Import Items
          </button>
        </motion.div>
      )}

      <AddInventoryModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <ImportInventoryModal open={importModalOpen} onClose={() => setImportModalOpen(false)} />
      <EditInventoryModal open={!!editInventory} onClose={() => setEditInventory(null)} inventory={editInventory} />
    </motion.div>
  );
}
