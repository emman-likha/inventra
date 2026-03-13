"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { importDepartments } from "@/lib/api";

const COLUMN_ALIASES: Record<string, string> = {
  "name": "name",
  "department": "name",
  "department name": "name",
  "department_name": "name",
  "dept": "name",
  "dept name": "name",
  "dept_name": "name",
};

const REQUIRED_COLUMNS = ["name"];

interface ParsedDepartment {
  name: string;
}

interface ImportDepartmentModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportDepartmentModal({ open, onClose }: ImportDepartmentModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedDepartment[]>([]);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const mutation = useMutation({
    mutationFn: async (departments: ParsedDepartment[]) => {
      await importDepartments(departments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      resetState();
      onClose();
    },
    onError: (err: Error) => {
      setParseError(err.message);
    },
  });

  function resetState() {
    setFile(null);
    setPreview([]);
    setParseError("");
    setIsDragging(false);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function resolveColumnName(header: string): string | null {
    const key = header.toLowerCase().trim().replace(/\(.*?\)/g, "").trim();
    if (COLUMN_ALIASES[key]) return COLUMN_ALIASES[key];
    for (const [alias, field] of Object.entries(COLUMN_ALIASES)) {
      if (key.includes(alias)) return field;
    }
    return null;
  }

  function validateRows(rows: Record<string, string>[], headers: string[]): { parsed: ParsedDepartment[]; error?: string } {
    const headerMap: Record<string, string> = {};
    headers.forEach((h) => {
      const resolved = resolveColumnName(h);
      if (resolved) headerMap[h] = resolved;
    });

    const mappedFields = new Set(Object.values(headerMap));
    const missing = REQUIRED_COLUMNS.filter((c) => !mappedFields.has(c));
    if (missing.length > 0) {
      return { parsed: [], error: `Missing required column: department/name.\nDetected columns: ${headers.join(", ")}` };
    }

    const seen = new Set<string>();
    const parsed: ParsedDepartment[] = [];

    rows.forEach((row) => {
      const normalized: Record<string, string> = {};
      Object.entries(row).forEach(([key, val]) => {
        const field = headerMap[key.toLowerCase().trim()] || resolveColumnName(key);
        if (field) {
          normalized[field] = String(val ?? "").trim();
        }
      });

      const deptName = normalized["name"];
      if (!deptName) return;

      const key = deptName.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);

      parsed.push({ name: deptName });
    });

    if (parsed.length === 0) {
      return { parsed: [], error: "No valid rows found in the file." };
    }

    return { parsed };
  }

  function processFile(f: File) {
    setParseError("");
    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      setParseError("Only .csv and .xlsx files are supported.");
      return;
    }

    setFile(f);

    if (ext === "csv") {
      Papa.parse<Record<string, string>>(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setParseError(`Parse error on row ${results.errors[0].row}: ${results.errors[0].message}`);
            return;
          }
          const headers = results.meta.fields?.map((h) => h.toLowerCase().trim()) ?? [];
          const { parsed, error } = validateRows(results.data, headers);
          if (error) { setParseError(error); return; }
          setPreview(parsed);
        },
        error: (err) => {
          setParseError(`Failed to read file: ${err.message}`);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

          if (rows.length === 0) {
            setParseError("The spreadsheet is empty.");
            return;
          }

          const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim());
          const { parsed, error } = validateRows(rows, headers);
          if (error) { setParseError(error); return; }
          setPreview(parsed);
        } catch {
          setParseError("Failed to read the Excel file. Make sure it's a valid .xlsx file.");
        }
      };
      reader.onerror = () => {
        setParseError("Failed to read the file.");
      };
      reader.readAsArrayBuffer(f);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
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
                  Import Departments
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

              {parseError && (
                <div className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 whitespace-pre-line">
                  {parseError}
                </div>
              )}

              {!file ? (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors
                      ${isDragging
                        ? "border-foreground/30 bg-foreground/[0.05]"
                        : "border-foreground/[0.08] hover:border-foreground/15 hover:bg-foreground/[0.02]"
                      }
                    `}
                  >
                    <svg
                      className="text-foreground/20 mb-4"
                      width="36" height="36" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="text-sm font-medium text-foreground/50 mb-1">
                      Drop your CSV or Excel file here
                    </p>
                    <p className="text-xs text-foreground/30">
                      .csv, .xlsx supported — or click to browse
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="mt-4 bg-foreground/[0.02] border border-foreground/[0.06] rounded-xl p-4">
                    <p className="text-xs font-semibold text-foreground/50 mb-2">File Format (CSV or Excel)</p>
                    <p className="text-xs text-foreground/35 mb-3">
                      Required column: <span className="text-foreground/55 font-medium">department</span> (or name)
                    </p>
                    <div className="bg-foreground/[0.03] rounded-lg p-3 font-mono text-[11px] text-foreground/40 leading-relaxed overflow-x-auto">
                      department<br />
                      Engineering<br />
                      Human Resources<br />
                      Marketing
                    </div>
                  </div>
                </>
              ) : preview.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-4 bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-3">
                    <svg className="text-foreground/30 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-foreground/35">{preview.length} {preview.length === 1 ? "department" : "departments"} ready to import</p>
                    </div>
                    <button
                      onClick={() => { setFile(null); setPreview([]); setParseError(""); }}
                      className="text-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer p-1"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="border border-foreground/[0.08] rounded-xl overflow-hidden mb-4 max-h-60 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-foreground/[0.08]">
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 10).map((d, i) => (
                          <tr key={i} className="border-b border-foreground/[0.04] last:border-0">
                            <td className="px-4 py-2 text-xs text-foreground">{d.name}</td>
                          </tr>
                        ))}
                        {preview.length > 10 && (
                          <tr>
                            <td className="px-4 py-2 text-xs text-foreground/30 text-center">
                              ...and {preview.length - 10} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 border border-foreground/[0.08] text-foreground/60 text-sm font-medium py-2.5 rounded-xl hover:bg-foreground/[0.03] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => mutation.mutate(preview)}
                      disabled={mutation.isPending}
                      className="flex-1 bg-foreground text-background text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      {mutation.isPending ? "Importing..." : `Import ${preview.length} Departments`}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
