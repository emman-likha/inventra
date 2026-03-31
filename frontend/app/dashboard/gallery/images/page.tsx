"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SkeletonLine } from "@/components/ui/Skeleton";

const BUCKET = "images";

interface StorageFile {
  name: string;
  id: string | null;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchImages(): Promise<StorageFile[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error(error.message);
  return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
}

function getPublicUrl(name: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(name);
  return data.publicUrl;
}

export default function ImagesGalleryPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: files = [], isLoading } = useQuery<StorageFile[]>({
    queryKey: ["gallery", BUCKET],
    queryFn: fetchImages,
  });

  const filtered = search.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    setUploading(true);
    const arr = Array.from(fileList);
    for (const file of arr) {
      const name = `${Date.now()}_${file.name}`;
      await supabase.storage.from(BUCKET).upload(name, file);
    }
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["gallery", BUCKET] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([name]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery", BUCKET] });
      setLightbox(null);
    },
  });

  async function handleDownload(name: string) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(name, 60);
    if (error || !data?.signedUrl) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name.replace(/^\d+_/, "");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Images</h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Upload and browse asset images and photos.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 mb-6 text-center transition-all ${
          dragOver
            ? "border-foreground/30 bg-foreground/[0.04]"
            : "border-foreground/[0.10] bg-foreground/[0.02] hover:border-foreground/[0.16]"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/40">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">
              {uploading ? "Uploading..." : "Drag & drop images here"}
            </p>
            <p className="text-xs text-foreground/30 mt-1">PNG, JPG, WEBP, GIF, SVG</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            Choose Images
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*"
          onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* Search + count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-foreground/40">
          {filtered.length} {filtered.length === 1 ? "image" : "images"}
        </p>
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
      </div>

      {/* Image grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonLine key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-foreground/[0.08] rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.08] flex items-center justify-center mb-4">
            <svg className="text-foreground/20" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground/50">No images yet</p>
          <p className="text-xs text-foreground/30 mt-1">Upload images to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((file) => {
            const url = getPublicUrl(file.name);
            const displayName = file.name.replace(/^\d+_/, "");
            return (
              <div
                key={file.name}
                className="group relative aspect-square rounded-xl overflow-hidden border border-foreground/[0.08] bg-foreground/[0.03] cursor-pointer"
                onClick={() => setLightbox(file.name)}
              >
                {/* Thumbnail */}
                <img
                  src={url}
                  alt={displayName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* File name */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-medium truncate">{displayName}</p>
                    <p className="text-white/50 text-[10px] mt-0.5">{file.metadata?.size ? formatSize(file.metadata.size) : ""}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(file.name); }}
                      className="p-1.5 rounded-lg bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors cursor-pointer backdrop-blur-sm"
                      title="Download"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.name); }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg bg-black/40 text-white/80 hover:bg-red-600/80 hover:text-white transition-colors cursor-pointer backdrop-blur-sm disabled:opacity-50"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={getPublicUrl(lightbox)}
              alt={lightbox.replace(/^\d+_/, "")}
              className="w-full h-full object-contain rounded-xl"
            />

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl p-4 flex items-center justify-between">
              <p className="text-white text-sm font-medium truncate mr-4">{lightbox.replace(/^\d+_/, "")}</p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(lightbox)}
                  className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors cursor-pointer backdrop-blur-sm"
                >
                  Download
                </button>
                <button
                  onClick={() => deleteMutation.mutate(lightbox)}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1.5 rounded-lg bg-red-500/30 text-white text-xs font-medium hover:bg-red-500/50 transition-colors cursor-pointer backdrop-blur-sm disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
