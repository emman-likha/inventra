"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInventory } from "@/lib/api";

const inputClass =
  "w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors";

const labelClass = "block text-foreground/50 text-xs font-medium mb-1.5";

interface AddInventoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddInventoryModal({ open, onClose }: AddInventoryModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await createInventory({
        name: name.trim(),
        category: category.trim() || null,
        quantity: quantity.trim() ? parseInt(quantity) : 0,
        min_quantity: minQuantity.trim() ? parseInt(minQuantity) : 0,
        unit: unit.trim() || "pcs",
        cost_per_unit: costPerUnit.trim() ? parseFloat(costPerUnit) : null,
        location: location.trim() || null,
        description: description.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
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
    setQuantity("");
    setMinQuantity("");
    setUnit("pcs");
    setCostPerUnit("");
    setLocation("");
    setDescription("");
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
    if (quantity.trim() && isNaN(parseInt(quantity))) {
      setError("Quantity must be a valid number.");
      return;
    }
    if (minQuantity.trim() && isNaN(parseInt(minQuantity))) {
      setError("Min quantity must be a valid number.");
      return;
    }
    if (costPerUnit.trim() && isNaN(parseFloat(costPerUnit))) {
      setError("Cost per unit must be a valid number.");
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
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-background border border-foreground/[0.08] rounded-2xl w-full max-w-lg p-6 pointer-events-auto shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  Add Inventory Item
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
                    placeholder="e.g. DDR4 RAM 16GB"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Spare Parts"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Warehouse A"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Min Quantity</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Unit</label>
                    <input
                      type="text"
                      placeholder="pcs"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Cost per Unit (USD)</label>
                  <input
                    type="text"
                    placeholder="e.g. 45.99"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    placeholder="Optional notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </div>

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
                    {mutation.isPending ? "Adding..." : "Add Item"}
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
