"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { importMembers, type MemberInput } from "@/lib/api";

const COLUMN_ALIASES: Record<string, string> = {
  "first name": "first_name",
  "first_name": "first_name",
  "firstname": "first_name",
  "last name": "last_name",
  "last_name": "last_name",
  "lastname": "last_name",
  "name": "full_name",
  "full name": "full_name",
  "fullname": "full_name",
  "member": "full_name",
  "member name": "full_name",
  "employee": "full_name",
  "employee name": "full_name",
  "employee id": "employee_id",
  "employee_id": "employee_id",
  "emp id": "employee_id",
  "id number": "employee_id",
  "position": "position",
  "job title": "position",
  "job_title": "position",
  "title": "position",
  "role": "position",
  "email": "email",
  "email address": "email",
  "email_address": "email",
  "site location": "site_location",
  "site_location": "site_location",
  "location": "site_location",
  "site": "site_location",
  "office": "site_location",
  "branch": "site_location",
};

interface ImportMemberModalProps {
  open: boolean;
  onClose: () => void;
  departmentId: string;
}

interface ParsedMember {
  first_name: string;
  last_name: string;
  employee_id?: string;
  position?: string;
  email?: string;
  site_location?: string;
}

export function ImportMemberModal({ open, onClose, departmentId }: ImportMemberModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedMember[]>([]);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const mutation = useMutation({
    mutationFn: async (members: ParsedMember[]) => {
      const payload: MemberInput[] = members.map((m) => ({
        department_id: departmentId,
        first_name: m.first_name,
        last_name: m.last_name,
        employee_id: m.employee_id || null,
        position: m.position || null,
        email: m.email || null,
        site_location: m.site_location || null,
      }));
      await importMembers(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", departmentId] });
      queryClient.invalidateQueries({ queryKey: ["department", departmentId] });
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

  function extractMembers(rows: Record<string, string>[], headers: string[]): { members: ParsedMember[]; error?: string } {
    const headerMap: Record<string, string> = {};
    headers.forEach((h) => {
      const resolved = resolveColumnName(h);
      if (resolved) headerMap[h] = resolved;
    });

    const mappedFields = new Set(Object.values(headerMap));
    const hasFullName = mappedFields.has("full_name");
    const hasNameParts = mappedFields.has("first_name") || mappedFields.has("last_name");

    if (!hasFullName && !hasNameParts) {
      return { members: [], error: `Could not find a name column.\nDetected columns: ${headers.join(", ")}\nExpected: name, first name, last name, member, or employee` };
    }

    const members: ParsedMember[] = [];
    const errors: string[] = [];

    rows.forEach((row, i) => {
      const normalized: Record<string, string> = {};
      Object.entries(row).forEach(([key, val]) => {
        const field = headerMap[key.toLowerCase().trim()] || resolveColumnName(key);
        if (field) {
          normalized[field] = String(val ?? "").trim();
        }
      });

      let firstName = "";
      let lastName = "";

      if (hasNameParts) {
        firstName = normalized["first_name"] || "";
        lastName = normalized["last_name"] || "";
      } else if (hasFullName && normalized["full_name"]) {
        const parts = normalized["full_name"].trim().split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      if (!firstName && !lastName) {
        errors.push(`Row ${i + 2}: name is required.`);
        return;
      }

      members.push({
        first_name: firstName,
        last_name: lastName || firstName,
        employee_id: normalized["employee_id"] || undefined,
        position: normalized["position"] || undefined,
        email: normalized["email"] || undefined,
        site_location: normalized["site_location"] || undefined,
      });
    });

    if (errors.length > 0 && members.length === 0) {
      return { members: [], error: errors.slice(0, 3).join("\n") + (errors.length > 3 ? `\n...and ${errors.length - 3} more errors.` : "") };
    }

    if (members.length === 0) {
      return { members: [], error: "No valid members found in the file." };
    }

    return { members };
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
          const { members, error } = extractMembers(results.data, headers);
          if (error) { setParseError(error); return; }
          setPreview(members);
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
          const { members, error } = extractMembers(rows, headers);
          if (error) { setParseError(error); return; }
          setPreview(members);
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
                  Import Members
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
                    <p className="text-xs font-semibold text-foreground/50 mb-2">File Format</p>
                    <p className="text-xs text-foreground/35 mb-1">
                      Required: <span className="text-foreground/55 font-medium">first name</span> + <span className="text-foreground/55 font-medium">last name</span> (or <span className="text-foreground/55 font-medium">name</span>)
                    </p>
                    <p className="text-xs text-foreground/35 mb-3">
                      Optional: <span className="text-foreground/55 font-medium">employee id</span>, <span className="text-foreground/55 font-medium">position</span>, <span className="text-foreground/55 font-medium">email</span>, <span className="text-foreground/55 font-medium">site location</span>
                    </p>
                    <div className="bg-foreground/[0.03] rounded-lg p-3 font-mono text-[11px] text-foreground/40 leading-relaxed overflow-x-auto">
                      first name,last name,position,site location<br />
                      James,Reyes,Software Engineer,Main Office<br />
                      Maria,Santos,HR Manager,Head Office<br />
                      David,Cruz,Designer,Remote
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
                      <p className="text-xs text-foreground/35">{preview.length} {preview.length === 1 ? "member" : "members"} ready to import</p>
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
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">Name</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">Position</th>
                          <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-foreground/40 uppercase tracking-wider">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 15).map((m, i) => (
                          <tr key={i} className="border-b border-foreground/[0.04] last:border-0">
                            <td className="px-4 py-2 text-xs text-foreground">{m.first_name} {m.last_name}</td>
                            <td className="px-4 py-2 text-xs text-foreground/55">{m.position || "—"}</td>
                            <td className="px-4 py-2 text-xs text-foreground/55">{m.site_location || "—"}</td>
                          </tr>
                        ))}
                        {preview.length > 15 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-xs text-foreground/30 text-center">
                              ...and {preview.length - 15} more
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
                      {mutation.isPending ? "Importing..." : `Import ${preview.length} Members`}
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
