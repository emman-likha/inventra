"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchDepartment, fetchMembers, deleteMembers, type Member } from "@/lib/api";
import { AddMemberModal } from "@/components/dashboard/AddMemberModal";
import { ImportMemberModal } from "@/components/dashboard/ImportMemberModal";
import { ActionMenu } from "@/components/ui/ActionMenu";

interface Department {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

type SortField = "first_name" | "last_name" | "employee_id" | "position" | "email" | "site_location";
type SortDir = "asc" | "desc";

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [search, setSearch] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [importMemberOpen, setImportMemberOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("first_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: department, isLoading, isError } = useQuery<Department>({
    queryKey: ["department", id],
    queryFn: () => fetchDepartment(id),
    enabled: !!id,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["members", id],
    queryFn: () => fetchMembers(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteMembers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      queryClient.invalidateQueries({ queryKey: ["department", id] });
      setSelectedIds(new Set());
    },
  });

  const filtered = useMemo(() => {
    let result = [...members];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        m.employee_id?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.site_location?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [members, search, sortField, sortDir]);

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

  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));
  const someSelected = filtered.some((m) => selectedIds.has(m.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((m) => m.id)));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-foreground/40">Loading department...</p>
      </div>
    );
  }

  if (isError || !department) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-sm text-red-500/70 mb-4">Department not found.</p>
        <button
          onClick={() => router.push("/dashboard/departments")}
          className="text-sm text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
        >
          Back to departments
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back button + header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <button
          onClick={() => router.push("/dashboard/departments")}
          className="flex items-center gap-2 text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer mb-4 group"
        >
          <svg
            className="group-hover:-translate-x-0.5 transition-transform"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="text-sm">Departments</span>
        </button>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {department.name}
        </h1>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5">
          <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-2">
            Total Members
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {members.length}
          </p>
        </div>
        <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5">
          <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-2">
            Created
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {new Date(department.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5">
          <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-2">
            Last Updated
          </p>
          <p className="text-2xl font-bold text-foreground tracking-tight">
            {new Date(department.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </motion.div>

      {/* Members section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Members</h2>
            <span className="text-[11px] font-bold bg-foreground/[0.08] text-foreground/60 px-2.5 py-1 rounded-full">
              {members.length}
            </span>
            {selectedIds.size > 0 && (
              <span className="text-xs text-foreground/60 font-medium">
                ({selectedIds.size} selected)
              </span>
            )}
          </div>
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
        </div>

        {/* Search members */}
        {members.length > 0 && (
          <div className="relative mb-4">
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
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
            />
          </div>
        )}

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-foreground/[0.02] border border-foreground/[0.06] rounded-2xl">
            <svg className="text-foreground/15 mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <p className="text-sm font-medium text-foreground/50">No members in this department yet.</p>
            <p className="text-xs text-foreground/30 mt-1 mb-6">Get started by adding a member or importing from a file.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAddMemberOpen(true)}
                className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Member
              </button>
              <button
                onClick={() => setImportMemberOpen(true)}
                className="flex items-center gap-2 bg-foreground/[0.03] border border-foreground/[0.08] text-foreground/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/[0.06] transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import Members
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-foreground/40">No members match your search.</p>
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
                    ["first_name", "First Name"],
                    ["last_name", "Last Name"],
                    ["employee_id", "Employee ID"],
                    ["position", "Position"],
                    ["email", "Email"],
                    ["site_location", "Site Location"],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className={`text-left pl-5 pr-2 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider cursor-pointer hover:text-foreground/70 transition-colors select-none whitespace-nowrap ${
                        field === "employee_id" ? "hidden lg:table-cell" : ""
                      } ${field === "email" ? "hidden xl:table-cell" : ""
                      } ${field === "site_location" ? "hidden md:table-cell" : ""}`}
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
                {filtered.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.03] transition-colors"
                  >
                    <td className="pl-4 pr-1 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => toggleSelect(member.id)}
                        className="w-4 h-4 rounded border-foreground/20 text-foreground accent-foreground cursor-pointer"
                      />
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm font-medium text-foreground whitespace-nowrap">
                      {member.first_name}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                      {member.last_name}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 hidden lg:table-cell whitespace-nowrap">
                      {member.employee_id || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 whitespace-nowrap">
                      {member.position || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 hidden xl:table-cell whitespace-nowrap">
                      {member.email || "—"}
                    </td>
                    <td className="pl-5 pr-2 py-3.5 text-sm text-foreground/55 hidden md:table-cell whitespace-nowrap">
                      {member.site_location || "—"}
                    </td>
                    <td className="px-2 py-3.5 text-center border-l border-foreground/[0.08]">
                      <ActionMenu
                        items={[
                          {
                            label: "Edit",
                            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
                            onClick: () => console.log("Edit member", member.id),
                          },
                          {
                            label: "Remove",
                            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
                            onClick: () => console.log("Remove member", member.id),
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

        {/* Member count footer + action buttons */}
        {members.length > 0 && (
          <>
            {filtered.length > 0 && (
              <p className="text-xs text-foreground/30 mt-3">
                Showing {filtered.length} of {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setAddMemberOpen(true)}
                className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Member
              </button>
              <button
                onClick={() => setImportMemberOpen(true)}
                className="flex items-center gap-2 bg-foreground/[0.03] border border-foreground/[0.08] text-foreground/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/[0.06] transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import Members
              </button>
            </div>
          </>
        )}
      </motion.div>

      <AddMemberModal open={addMemberOpen} onClose={() => setAddMemberOpen(false)} departmentId={id} />
      <ImportMemberModal open={importMemberOpen} onClose={() => setImportMemberOpen(false)} departmentId={id} />
    </motion.div>
  );
}
