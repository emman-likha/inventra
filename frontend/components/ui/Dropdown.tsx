"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[] | readonly string[];
    label?: string;
    className?: string;
    placeholder?: string;
}

export function Dropdown({ value, onChange, options, label, className = "", placeholder }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getLabel = (val: string) => {
        if (Array.isArray(options) && typeof options[0] === "string") {
            return val === "all" ? placeholder || "All" : val.charAt(0).toUpperCase() + val.slice(1).replace("_", " ");
        }
        const option = (options as { value: string; label: string }[]).find(o => o.value === val);
        return option ? option.label : val;
    };

    const normalizedOptions = useMemo(() => {
        if (!options || options.length === 0) return [];
        if (typeof options[0] === "string") {
            return (options as string[]).map(o => ({
                value: o,
                label: o === "all" ? placeholder || "All" : o.charAt(0).toUpperCase() + o.slice(1).replace("_", " ")
            }));
        }
        return options as { value: string; label: string }[];
    }, [options, placeholder]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-xs font-medium text-foreground/40 mb-1.5 ml-1 select-none">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground hover:bg-foreground/[0.05] hover:border-foreground/20 transition-all focus:outline-none text-left"
            >
                <span className="truncate">{getLabel(value)}</span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="text-foreground/30 shrink-0"
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute z-50 w-full mt-2 py-1.5 bg-background/80 backdrop-blur-xl border border-foreground/[0.1] rounded-2xl shadow-2xl shadow-black/10 max-h-64 overflow-y-auto scrollbar-hidden"
                    >
                        {normalizedOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center justify-between ${value === opt.value
                                    ? "bg-foreground/[0.05] text-foreground font-medium"
                                    : "text-foreground/60 hover:bg-foreground/[0.03] hover:text-foreground"
                                    }`}
                            >
                                {opt.label}
                                {value === opt.value && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
