"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDepartments, createDepartment, fetchDepartmentMembers } from "@/lib/api";

interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const inputClass =
  "w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors";

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [addError, setAddError] = useState("");
  const [search, setSearch] = useState("");

  const { data: departments = [], isLoading, isError } = useQuery({
    queryKey: ["departments"],
    queryFn: () => fetchDepartments() as Promise<Department[]>,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await createDepartment({
        name: newName.trim(),
        description: newDesc.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setNewName("");
      setNewDesc("");
      setAddError("");
      setAddOpen(false);
    },
    onError: (err: Error) => setAddError(err.message),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (!newName.trim()) { setAddError("Name is required."); return; }
    addMutation.mutate();
  }

  const filtered = search.trim()
    ? departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : departments;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Departments
        </h1>
        <p className="text-foreground/50 mt-1 text-sm">
          View departments and their members.
        </p>
      </motion.div>

      {/* Controls */}
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
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Department
        </button>
      </motion.div>

      {/* Results count */}
      <motion.div variants={fadeUp} className="mb-4">
        <p className="text-xs text-foreground/40">
          {filtered.length} {filtered.length === 1 ? "department" : "departments"}
        </p>
      </motion.div>

      {/* Department list */}
      <motion.div variants={fadeUp}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-foreground/40">Loading departments...</p>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-red-500/70">Failed to load departments.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center mb-5">
              <svg className="text-foreground/20" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground/50">No departments found</p>
            <p className="text-xs text-foreground/30 mt-1">Create your first department to organize your team.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((dept) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                expanded={expandedId === dept.id}
                onToggle={() => setExpandedId(expandedId === dept.id ? null : dept.id)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Department Modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50"
              onClick={() => { setAddOpen(false); setAddError(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-background border border-foreground/[0.08] rounded-2xl w-full max-w-md p-6 pointer-events-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Add Department</h2>
                  <button
                    onClick={() => { setAddOpen(false); setAddError(""); }}
                    className="text-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer p-1"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {addError && (
                  <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                    {addError}
                  </p>
                )}

                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-foreground/50 text-xs font-medium mb-1.5">Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/50 text-xs font-medium mb-1.5">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Software development team"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => { setAddOpen(false); setAddError(""); }}
                      className="flex-1 border border-foreground/[0.08] text-foreground/60 text-sm font-medium py-2.5 rounded-xl hover:bg-foreground/[0.03] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addMutation.isPending}
                      className="flex-1 bg-foreground text-background text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      {addMutation.isPending ? "Adding..." : "Add Department"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Department Card with expandable members ──────────────── */

function DepartmentCard({
  department,
  expanded,
  onToggle,
}: {
  department: Department;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["department-members", department.id],
    queryFn: () => fetchDepartmentMembers(department.id) as Promise<Profile[]>,
    enabled: expanded,
  });

  return (
    <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl overflow-hidden transition-colors hover:bg-foreground/[0.04]">
      {/* Header — click to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center shrink-0">
            <svg className="text-foreground/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{department.name}</p>
            {department.description && (
              <p className="text-xs text-foreground/40 mt-0.5">{department.description}</p>
            )}
          </div>
        </div>
        <svg
          className={`text-foreground/30 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Members list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-foreground/[0.06] px-5 py-4">
              {isLoading ? (
                <p className="text-xs text-foreground/30 py-2">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-xs text-foreground/30 py-2">No members in this department.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-foreground/[0.06] flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-foreground/40">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {member.first_name} {member.last_name}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-foreground/35 bg-foreground/[0.04] px-2 py-0.5 rounded-md capitalize">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
