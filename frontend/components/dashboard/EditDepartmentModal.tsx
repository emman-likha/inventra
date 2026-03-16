"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDepartment } from "@/lib/api";

const inputClass =
  "w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors";

const labelClass = "block text-foreground/50 text-xs font-medium mb-1.5";

interface Department {
  id: string;
  name: string;
}

interface EditDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  department: Department | null;
}

export function EditDepartmentModal({ open, onClose, department }: EditDepartmentModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (department && open) {
      setName(department.name);
      setError("");
    }
  }, [department, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!department) return;
      await updateDepartment(department.id, { name: name.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    mutation.mutate();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-50"
            onClick={onClose}
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
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Edit Department
                </h2>
                <button
                  onClick={onClose}
                  className="text-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {error && (
                <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 border border-foreground/[0.08] text-foreground/60 text-sm font-medium py-2.5 rounded-xl hover:bg-foreground/[0.03] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex-1 bg-foreground text-background text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {mutation.isPending ? "Saving..." : "Save Changes"}
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
