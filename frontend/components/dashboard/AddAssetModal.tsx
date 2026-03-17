"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAsset, fetchAllMembers, type Member } from "@/lib/api";

const inputClass =
  "w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors";

const labelClass = "block text-foreground/50 text-xs font-medium mb-1.5";

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddAssetModal({ open, onClose }: AddAssetModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("available");
  const [value, setValue] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState("");

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["all-members"],
    queryFn: fetchAllMembers,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await createAsset({
        name: name.trim(),
        category: category.trim(),
        location: location.trim() || null,
        status: assignedTo ? "checked_out" : status,
        value: value.trim() ? parseFloat(value) : null,
        assigned_to: assignedTo || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      resetForm();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function resetForm() {
    setName("");
    setCategory("");
    setLocation("");
    setStatus("available");
    setValue("");
    setAssignedTo("");
    setError("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }
    if (value.trim() && isNaN(parseFloat(value))) {
      setError("Value must be a valid number.");
      return;
    }

    mutation.mutate();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-background border border-foreground/[0.08] rounded-2xl w-full max-w-lg p-6 pointer-events-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Add Asset
                </h2>
                <button
                  onClick={handleClose}
                  className="text-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  {error}
                </p>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. MacBook Pro 16&quot;"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {/* Category + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Category *</label>
                    <input
                      type="text"
                      placeholder="e.g. Laptops"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={assignedTo ? "checked_out" : status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={!!assignedTo}
                      className={`${inputClass} ${assignedTo ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {assignedTo ? (
                        <option value="checked_out">Checked Out</option>
                      ) : (
                        STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))
                      )}
                    </select>
                    {assignedTo && (
                      <p className="text-[10px] text-foreground/30 mt-1">Auto-set while assigned</p>
                    )}
                  </div>
                </div>

                {/* Location + Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Office A, Floor 3"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Value (USD)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2499.99"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className={labelClass}>Assign To</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => {
                      const memberId = e.target.value;
                      setAssignedTo(memberId);
                      if (memberId) {
                        const member = members.find((m) => m.id === memberId);
                        if (member?.site_location) {
                          setLocation(member.site_location);
                        }
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}{m.position ? ` — ${m.position}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 border border-foreground/[0.08] text-foreground/60 text-sm font-medium py-2.5 rounded-xl hover:bg-foreground/[0.03] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex-1 bg-foreground text-background text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {mutation.isPending ? "Adding..." : "Add Asset"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
