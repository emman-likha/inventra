"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAssetActions, cancelAssetAction, AssetAction } from "@/lib/api";
import { SkeletonPage } from "@/components/ui/Skeleton";

const ACTION_LABELS: Record<string, string> = {
  check_out: "Check Out",
  check_in: "Check In",
  move: "Move",
  maintenance: "Maintenance",
  dispose: "Dispose",
  reserve: "Reserve",
};

const WORK_SETUP_LABELS: Record<string, string> = {
  on_site: "On Site",
  remote: "Remote",
  hybrid: "Hybrid",
};


export default function MovementHistoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: actions = [], isLoading } = useQuery<AssetAction[]>({
    queryKey: ["asset-actions"],
    queryFn: fetchAssetActions,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelAssetAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-actions"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  function isPending(act: AssetAction) {
    if (!act.action_date) return false;
    const scheduled = new Date(act.action_date);
    return scheduled > new Date();
  }

  const filteredActions = useMemo(() => {
    if (!search.trim()) return actions;
    const q = search.toLowerCase();
    return actions.filter(
      (a) =>
        a.asset?.name?.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.department?.name?.toLowerCase().includes(q) ||
        a.member?.first_name?.toLowerCase().includes(q) ||
        a.member?.last_name?.toLowerCase().includes(q) ||
        a.from_location?.toLowerCase().includes(q) ||
        a.to_location?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q) ||
        (isPending(a) && "pending".includes(q)) ||
        (!isPending(a) && "completed".includes(q))
    );
  }, [actions, search]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Movement History</h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Complete log of all asset actions and movements.
        </p>
      </div>

      {/* Search + count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-foreground/40">
          {filteredActions.length} {filteredActions.length === 1 ? "record" : "records"}
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
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div>
        {isLoading ? (
          <SkeletonPage header={false} search={false} cols={10} />
        ) : filteredActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center mb-4">
              <svg className="text-foreground/20" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground/50">No activity yet</p>
            <p className="text-xs text-foreground/30 mt-1">Asset actions will appear here once performed.</p>
          </div>
        ) : (
          <div className="border border-foreground/[0.08] rounded-2xl overflow-x-hidden overflow-y-auto max-h-[520px] scrollbar-hidden">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-foreground/[0.08]">
                  {["Asset", "Action", "Status", "Department", "Member", "From", "To", "Work Setup", "Notes", "Date", ""].map((h) => (
                    <th
                      key={h || "_action"}
                      className={`text-left pl-5 pr-2 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider whitespace-nowrap select-none ${h === "" ? "w-[80px]" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredActions.map((act) => (
                  <tr
                    key={act.id}
                    className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors"
                  >
                    <td className="pl-5 pr-2 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                      {act.asset?.name ?? "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-foreground/[0.06] text-foreground/60">
                        {ACTION_LABELS[act.action] ?? act.action}
                      </span>
                    </td>
                    <td className="pl-5 pr-2 py-3.5 whitespace-nowrap">
                      {isPending(act) ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
                          Pending
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                      {act.department?.name || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                      {act.member
                        ? `${act.member.first_name} ${act.member.last_name}`
                        : "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/45 whitespace-nowrap">
                      {act.from_location || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/45 whitespace-nowrap">
                      {act.to_location || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/45 whitespace-nowrap">
                      {act.work_setup ? WORK_SETUP_LABELS[act.work_setup] ?? act.work_setup : "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/40 max-w-[200px] truncate">
                      {act.notes || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-xs text-foreground/40 whitespace-nowrap">
                      {(() => {
                        const d = new Date(act.action_date || act.created_at);
                        return (
                          <>
                            {d.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            <span className="text-foreground/25">
                              {d.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        );
                      })()}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 whitespace-nowrap">
                      {isPending(act) && (
                        <button
                          onClick={() => cancelMutation.mutate(act.id)}
                          disabled={cancelMutation.isPending}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
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
