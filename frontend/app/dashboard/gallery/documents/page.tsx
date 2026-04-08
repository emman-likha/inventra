"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { fetchMyProfile } from "@/lib/api";
import { SkeletonPage } from "@/components/ui/Skeleton";

const BUCKET = "documents";

type StorageFile = {
  name: string;
  id: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
};

const FILE_ICONS: Record<string, { color: string; label: string }> = {
  "application/pdf": { color: "text-red-500 bg-red-500/10", label: "PDF" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { color: "text-blue-500 bg-blue-500/10", label: "DOCX" },
  "application/msword": { color: "text-blue-500 bg-blue-500/10", label: "DOC" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { color: "text-emerald-500 bg-emerald-500/10", label: "XLSX" },
  "application/vnd.ms-excel": { color: "text-emerald-500 bg-emerald-500/10", label: "XLS" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { color: "text-amber-500 bg-amber-500/10", label: "PPTX" },
  "text/plain": { color: "text-foreground/50 bg-foreground/[0.06]", label: "TXT" },
  "text/csv": { color: "text-emerald-500 bg-emerald-500/10", label: "CSV" },
};

function getMeta(file: StorageFile) {
  const m = file.metadata as { size?: number; mimetype?: string } | null;
  return { size: m?.size ?? 0, mimetype: m?.mimetype ?? "" };
}

function getFileIcon(mimetype: string | undefined) {
  if (!mimetype) return { color: "text-foreground/40 bg-foreground/[0.06]", label: "FILE" };
  return FILE_ICONS[mimetype] ?? { color: "text-foreground/40 bg-foreground/[0.06]", label: mimetype.split("/").pop()?.toUpperCase().slice(0, 4) ?? "FILE" };
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface OrgProfile {
  company_id: string;
  id: string;
}

export default function DocumentsGalleryPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery<OrgProfile>({
    queryKey: ["profile", "me"],
    queryFn: fetchMyProfile,
    staleTime: 5 * 60 * 1000,
  });

  const companyId = profile?.company_id;
  const userId = profile?.id;

  const { data: files = [], isLoading } = useQuery<StorageFile[]>({
    queryKey: ["gallery", BUCKET, companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.storage.from(BUCKET).list(companyId, {
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw new Error(error.message);
      return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder" && f.name !== ".keep" && f.id) as StorageFile[];
    },
    enabled: !!companyId,
  });

  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    if (!companyId || !userId) return;
    setUploading(true);
    const arr = Array.from(fileList);
    for (const file of arr) {
      const name = `${companyId}/${Date.now()}_${file.name}`;
      await supabase.storage.from(BUCKET).upload(name, file);
    }
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["gallery", BUCKET, companyId] });
  }, [queryClient, companyId, userId]);

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([`${companyId}/${name}`]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery", BUCKET, companyId] }),
  });

  async function handlePreview(name: string) {
    const { data, error } = await supabase.storage.from(BUCKET).download(`${companyId}/${name}`);
    if (error || !data) return;
    const url = URL.createObjectURL(data);
    window.open(url, "_blank");
  }

  async function handleDownload(name: string) {
    const { data, error } = await supabase.storage.from(BUCKET).download(`${companyId}/${name}`);
    if (error || !data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name.replace(/^\d+_/, "");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  const hasFiles = !isLoading && files.length > 0;

  return (
    <div className={hasFiles ? "" : "flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)]"}>
      {/* Header */}
      <div className={hasFiles ? "mb-8" : "mb-4"}>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Documents</h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Upload and manage PDFs, spreadsheets, presentations, and other files.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.ppt,.txt,.csv,.rtf"
        onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }}
      />

      {/* File list */}
      {isLoading ? (
        <SkeletonPage header={false} search={false} cols={4} />
      ) : files.length === 0 ? (
        /* Empty state: large upload zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl px-8 text-center transition-all cursor-pointer flex-1 flex items-center justify-center ${
            dragOver
              ? "border-foreground/30 bg-foreground/[0.05]"
              : "border-foreground/[0.10] bg-foreground/[0.02] hover:border-foreground/[0.18] hover:bg-foreground/[0.03]"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              dragOver ? "bg-foreground/[0.10]" : "bg-foreground/[0.06]"
            }`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p className="text-base font-medium text-foreground/60">
                {uploading ? "Uploading..." : "Drag & drop files here"}
              </p>
              <p className="text-sm text-foreground/30 mt-1.5">
                or click anywhere to browse
              </p>
            </div>

            <button
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Files"}
            </button>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["PDF", "DOCX", "XLSX", "PPTX", "CSV", "TXT"].map((ext) => (
                <span key={ext} className="text-[10px] font-semibold tracking-wider text-foreground/20 bg-foreground/[0.04] px-2.5 py-1 rounded-lg">
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Has files: search bar + table, no upload zone */
        <>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-foreground/40">
            {filtered.length} {filtered.length === 1 ? "file" : "files"}
          </p>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
        <div className="border border-foreground/[0.08] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-foreground/[0.08]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden md:table-cell">Size</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider hidden lg:table-cell">Uploaded</th>
                <th className="w-[100px] px-5 py-3.5 text-xs font-semibold text-foreground/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => {
                const meta = getMeta(file);
                const icon = getFileIcon(meta.mimetype);
                const displayName = file.name.replace(/^\d+_/, "");
                return (
                  <tr key={file.name} className="border-b border-foreground/[0.06] last:border-0 hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${icon.color}`}>
                          {icon.label}
                        </div>
                        <button
                          onClick={() => handlePreview(file.name)}
                          className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-[300px] hover:underline cursor-pointer text-left"
                          title="Preview in new tab"
                        >
                          {displayName}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-foreground/40 whitespace-nowrap hidden sm:table-cell">{icon.label}</td>
                    <td className="px-5 py-3.5 text-xs text-foreground/40 whitespace-nowrap hidden md:table-cell">{getMeta(file).size ? formatSize(getMeta(file).size) : "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-foreground/40 whitespace-nowrap hidden lg:table-cell">
                      {file.created_at ? new Date(file.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(file.name)}
                          className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/[0.05] transition-colors cursor-pointer"
                          title="Download"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(file.name)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
