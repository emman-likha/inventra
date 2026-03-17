"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Column {
  key: string;
  label: string;
  locked?: boolean;
}

interface ColumnToggleProps {
  columns: Column[];
  visible: Set<string>;
  onChange: (visible: Set<string>) => void;
}

export function ColumnToggle({ columns, visible, onChange }: ColumnToggleProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 220;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      setPosition({ top: rect.bottom + 6, left });
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function toggle(key: string) {
    const next = new Set(visible);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  }

  const hiddenCount = columns.filter((c) => !c.locked && !visible.has(c.key)).length;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm hover:bg-foreground/[0.05] hover:border-foreground/20 transition-all cursor-pointer select-none whitespace-nowrap ${
          open ? "border-foreground/20 bg-foreground/[0.05]" : ""
        }`}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground/40"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        <span className="text-foreground/60 font-medium">Filter</span>
        {hiddenCount > 0 && (
          <span className="text-[10px] font-bold bg-foreground/[0.08] text-foreground/50 w-5 h-5 rounded-full flex items-center justify-center -mr-1">
            {hiddenCount}
          </span>
        )}
      </button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && position && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: "fixed",
                  top: position.top,
                  left: position.left,
                  zIndex: 9999,
                }}
                className="w-[220px] bg-background border border-foreground/[0.1] rounded-xl shadow-xl shadow-foreground/[0.06] overflow-hidden"
              >
                <div className="px-3.5 py-2.5 border-b border-foreground/[0.06]">
                  <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">
                    Toggle Columns
                  </p>
                </div>
                <div className="py-1.5 max-h-[280px] overflow-y-auto scrollbar-hidden">
                  {columns.map((col) => {
                    const isChecked = visible.has(col.key);
                    const isLocked = col.locked;
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => !isLocked && toggle(col.key)}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm transition-colors ${
                          isLocked
                            ? "text-foreground/30 cursor-default"
                            : "text-foreground/65 hover:bg-foreground/[0.04] cursor-pointer"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? "bg-foreground border-foreground"
                              : "border-foreground/20 bg-transparent"
                          } ${isLocked ? "opacity-40" : ""}`}
                        >
                          {isChecked && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-background"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className={isChecked ? "text-foreground/70" : "text-foreground/40"}>
                          {col.label}
                        </span>
                        {isLocked && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-foreground/20 ml-auto"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
