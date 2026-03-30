"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssets,
  fetchAllMembers,
  fetchDepartments,
  createAssetAction,
} from "@/lib/api";

/* ── Types ─────────────────────────────────────────────── */

type ActionType = "check_out" | "check_in" | "move" | "maintenance" | "dispose" | "reserve";

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string | null;
  inventory_location: string | null;
  status: string;
  assigned_to: string | null;
  assigned_member: { id: string; first_name: string; last_name: string } | null;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  department_id: string;
  site_location: string | null;
}

interface Department {
  id: string;
  name: string;
}

const ACTION_CONFIG: Record<ActionType, {
  label: string;
  description: string;
  icon: React.ReactNode;
}> = {
  check_out: {
    label: "Check Out",
    description: "Assign an asset to a member",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
  },
  check_in: {
    label: "Check In",
    description: "Return an asset back to inventory",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
  move: {
    label: "Move",
    description: "Relocate an asset to a new location",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="5 9 2 12 5 15" />
        <polyline points="9 5 12 2 15 5" />
        <polyline points="15 19 12 22 9 19" />
        <polyline points="19 9 22 12 19 15" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    ),
  },
  maintenance: {
    label: "Maintenance",
    description: "Send an asset for repair or servicing",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  dispose: {
    label: "Dispose",
    description: "Retire and dispose of an asset",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
  },
  reserve: {
    label: "Reserve",
    description: "Reserve an asset for a member",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
};

/* ── Animations ────────────────────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const WORK_SETUP_OPTIONS = [
  { value: "on_site", label: "On Site" },
  { value: "remote", label: "Remote" },
];

const selectClass = "w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/20 transition-colors appearance-none cursor-pointer";
const inputClass = "w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors";
const labelClass = "block text-xs font-medium text-foreground/50 mb-1.5";

/* ── Searchable Select ────────────────────────────────── */

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Choose...",
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen((p) => !p); }}
        className={`${selectClass} text-left flex items-center justify-between ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <span className={value ? "text-foreground" : "text-foreground/30"}>
          {selectedLabel || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30 shrink-0 ml-2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-foreground/[0.1] rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-foreground/[0.08]">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-foreground/35 text-center">No results found.</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer hover:bg-foreground/[0.05] ${
                    o.value === value ? "bg-foreground/[0.06] text-foreground font-medium" : "text-foreground/70"
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Styled Date Picker ───────────────────────────────── */

function StyledDatePicker({
  value,
  onChange,
  placeholder = "Select date...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const displayValue = useMemo(() => {
    if (!value) return "";
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [value]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hiddenRef.current?.showPicker()}
        className={`${selectClass} text-left flex items-center justify-between`}
      >
        <span className={value ? "text-foreground" : "text-foreground/30"}>
          {displayValue || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30 shrink-0 ml-2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

/* ── Styled Time Picker ───────────────────────────────── */

function StyledTimePicker({
  value,
  onChange,
  placeholder = "Select time...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const displayValue = useMemo(() => {
    if (!value) return "";
    const [h, m] = value.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }, [value]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hiddenRef.current?.showPicker()}
        className={`${selectClass} text-left flex items-center justify-between`}
      >
        <span className={value ? "text-foreground" : "text-foreground/30"}>
          {displayValue || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/30 shrink-0 ml-2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
      <input
        ref={hiddenRef}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

/* ── Inline Action Form ───────────────────────────────── */

function ActionForm({
  action,
  assets,
  members,
  departments,
  onDone,
}: {
  action: ActionType;
  assets: Asset[];
  members: Member[];
  departments: Department[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const config = ACTION_CONFIG[action];

  const [assetId, setAssetId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [workSetup, setWorkSetup] = useState("");
  const [timing, setTiming] = useState<"now" | "scheduled">("now");
  const [actionDate, setActionDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [actionTime, setActionTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const availableAssets = useMemo(() => {
    switch (action) {
      case "check_out":
        return assets.filter((a) => a.status === "available");
      case "check_in":
        return assets.filter((a) => a.status === "checked_out");
      case "move":
        return assets.filter((a) => a.status !== "retired");
      case "maintenance":
        return assets.filter((a) => a.status !== "retired" && a.status !== "maintenance");
      case "dispose":
        return assets.filter((a) => a.status !== "retired");
      case "reserve":
        return assets.filter((a) => a.status === "available");
      default:
        return assets;
    }
  }, [assets, action]);

  const filteredMembers = useMemo(() => {
    if (!departmentId) return members;
    return members.filter((m) => m.department_id === departmentId);
  }, [members, departmentId]);

  const selectedMember = useMemo(() => members.find((m) => m.id === memberId), [members, memberId]);

  const selectedAsset = useMemo(() => assets.find((a) => a.id === assetId), [assets, assetId]);

  const inventoryLocations = useMemo(() => {
    const locs = new Set(assets.map((a) => a.inventory_location).filter(Boolean) as string[]);
    return Array.from(locs).sort().map((loc) => ({ value: loc, label: loc }));
  }, [assets]);

  function handleAssetChange(id: string) {
    setAssetId(id);
  }

  function handleMemberChange(id: string) {
    setMemberId(id);
    if (action === "check_out") {
      const member = members.find((m) => m.id === id);
      if (member?.site_location) setToLocation(member.site_location);
    }
  }

  function resetForm() {
    setAssetId("");
    setDepartmentId("");
    setMemberId("");
    setToLocation("");
    setWorkSetup("");
    setTiming("now");
    const now = new Date();
    setActionDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    setActionTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setNotes("");
    setSuccess(false);
  }

  const mutation = useMutation({
    mutationFn: () => {
      let dateTime: string;
      if (timing === "now") {
        dateTime = new Date().toISOString();
      } else {
        // Build a Date from local date+time so the timezone offset is correct
        const localDate = actionDate && actionTime
          ? new Date(`${actionDate}T${actionTime}:00`)
          : actionDate
            ? new Date(`${actionDate}T00:00:00`)
            : new Date();
        dateTime = localDate.toISOString();
      }
      return createAssetAction({
        asset_id: assetId,
        action,
        member_id: memberId || undefined,
        department_id: departmentId || undefined,
        to_location: toLocation || undefined,
        work_setup: workSetup || undefined,
        action_date: dateTime,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-actions"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setSuccess(true);
      setTimeout(() => {
        resetForm();
      }, 1500);
    },
  });

  const canSubmit = useMemo(() => {
    if (!assetId || mutation.isPending) return false;
    if (timing === "scheduled" && !actionDate) return false;
    switch (action) {
      case "check_out":
        return !!departmentId && !!memberId && !!toLocation.trim() && !!workSetup;
      case "check_in":
        return !!toLocation.trim();
      case "move":
        return !!toLocation.trim();
      case "maintenance":
        return true;
      case "dispose":
        return true;
      case "reserve":
        return !!departmentId && !!memberId;
      default:
        return true;
    }
  }, [assetId, action, departmentId, memberId, toLocation, workSetup, timing, actionDate, mutation.isPending]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="border border-foreground/[0.08] rounded-2xl bg-foreground/[0.015] overflow-hidden"
    >
      {/* Form header */}
      <div className="px-6 py-4 border-b border-foreground/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-foreground/50">{config.icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
            <p className="text-xs text-foreground/40 mt-0.5">{config.description}</p>
          </div>
        </div>
        <button
          onClick={onDone}
          className="p-1.5 rounded-lg text-foreground/30 hover:text-foreground/60 hover:bg-foreground/[0.05] transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Success state */}
      {success ? (
        <div className="px-6 py-10 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground/70">Action completed successfully</p>
        </div>
      ) : (
        <>
          {/* Form fields */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            {/* Asset select — all actions */}
            <div className={action === "check_out" || action === "reserve" ? "" : "sm:col-span-2"}>
              <label className={labelClass}>
                Select Asset <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={assetId}
                onChange={handleAssetChange}
                placeholder="Choose an asset..."
                options={availableAssets.map((a) => ({
                  value: a.id,
                  label: `${a.name} — ${a.category}${a.location ? ` (${a.location})` : ""}`,
                }))}
              />
              {availableAssets.length === 0 && (
                <p className="text-xs text-foreground/35 mt-1.5">No eligible assets for this action.</p>
              )}
            </div>

            {/* ── Check Out fields ── */}
            {action === "check_out" && (
              <>
                <div>
                  <label className={labelClass}>
                    Department <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={departmentId}
                    onChange={(val) => { setDepartmentId(val); setMemberId(""); }}
                    placeholder="Choose Department..."
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Assign to Member <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={memberId}
                    onChange={handleMemberChange}
                    placeholder={departmentId ? "Choose a member..." : "Select a department first"}
                    disabled={!departmentId}
                    options={filteredMembers.map((m) => ({
                      value: m.id,
                      label: `${m.first_name} ${m.last_name}`,
                    }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Work Setup <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={workSetup}
                    onChange={(val) => {
                      setWorkSetup(val);
                      if (val === "remote") {
                        setToLocation("Home");
                      } else {
                        setToLocation(selectedMember?.site_location || "");
                      }
                    }}
                    placeholder="Select work setup..."
                    options={WORK_SETUP_OPTIONS}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Location <span className="text-red-500">*</span>
                  </label>
                  {!workSetup ? (
                    <div className={`${inputClass} opacity-40 cursor-not-allowed`}>
                      <span className="text-foreground/30">Select work setup first</span>
                    </div>
                  ) : workSetup === "remote" ? (
                    <div className={`${inputClass} opacity-60 cursor-default`}>Home</div>
                  ) : (
                    <input
                      type="text"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      placeholder={selectedMember?.site_location ? "Auto-filled from member" : "Enter location..."}
                      className={inputClass}
                    />
                  )}
                </div>
              </>
            )}

            {/* ── Check In fields ── */}
            {action === "check_in" && (
              <>
                <div>
                  <label className={labelClass}>
                    Currently Assigned To
                  </label>
                  <div className={`${selectClass} text-left opacity-60 cursor-default`}>
                    {selectedAsset?.assigned_member
                      ? `${selectedAsset.assigned_member.first_name} ${selectedAsset.assigned_member.last_name}`
                      : <span className="text-foreground/30">Select an asset first</span>}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Return Location <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={toLocation}
                    onChange={setToLocation}
                    placeholder="Choose storage location..."
                    options={inventoryLocations}
                  />
                </div>
              </>
            )}

            {/* ── Move fields ── */}
            {action === "move" && (
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Destination Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  placeholder="Enter new location..."
                  className={inputClass}
                />
              </div>
            )}

            {/* ── Reserve fields ── */}
            {action === "reserve" && (
              <>
                <div>
                  <label className={labelClass}>
                    Department <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={departmentId}
                    onChange={(val) => { setDepartmentId(val); setMemberId(""); }}
                    placeholder="Choose Department..."
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Reserve for Member <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={memberId}
                    onChange={setMemberId}
                    placeholder={departmentId ? "Choose a member..." : "Select a department first"}
                    disabled={!departmentId}
                    options={filteredMembers.map((m) => ({
                      value: m.id,
                      label: `${m.first_name} ${m.last_name}`,
                    }))}
                  />
                </div>
              </>
            )}

            {/* ── Timing toggle — shared across all actions ── */}
            <div className="sm:col-span-2">
              <label className={labelClass}>When <span className="text-red-500">*</span></label>
              <div className="inline-flex rounded-xl border border-foreground/[0.08] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTiming("now")}
                  className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    timing === "now"
                      ? "bg-foreground text-background"
                      : "bg-foreground/[0.03] text-foreground/50 hover:text-foreground/70"
                  }`}
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => setTiming("scheduled")}
                  className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-l border-foreground/[0.08] ${
                    timing === "scheduled"
                      ? "bg-foreground text-background"
                      : "bg-foreground/[0.03] text-foreground/50 hover:text-foreground/70"
                  }`}
                >
                  Scheduled
                </button>
              </div>
            </div>

            {/* ── Date & Time pickers — only when scheduled ── */}
            {timing === "scheduled" && (
              <>
                <div>
                  <label className={labelClass}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <StyledDatePicker value={actionDate} onChange={setActionDate} />
                </div>
                <div>
                  <label className={labelClass}>
                    Time <span className="text-red-500">*</span>
                  </label>
                  <StyledTimePicker value={actionTime} onChange={setActionTime} />
                </div>
              </>
            )}

            {/* Notes — all actions, full width */}
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter notes..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="px-6 pb-3">
              <p className="text-xs text-red-500">
                {(mutation.error as Error).message || "Something went wrong."}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-foreground/[0.08] flex justify-end gap-3">
            <button
              onClick={onDone}
              className="px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground/80 hover:bg-foreground/[0.05] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-foreground text-background hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Processing..." : `Confirm ${config.label}`}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export default function AssetManagerPage() {
  const [activeAction, setActiveAction] = useState<ActionType | null>("check_out");

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["all-members"],
    queryFn: fetchAllMembers,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  function handleActionClick(action: ActionType) {
    setActiveAction((prev) => (prev === action ? null : action));
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Asset Manager</h1>
        <p className="text-foreground/50 mt-1 text-sm">
          Manage asset lifecycle — check out, check in, move, maintain, dispose, or reserve assets.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={fadeUp} className="grid grid-cols-6 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
        {(Object.keys(ACTION_CONFIG) as ActionType[]).map((action) => {
          const cfg = ACTION_CONFIG[action];
          const isActive = activeAction === action;
          return (
            <button
              key={action}
              onClick={() => handleActionClick(action)}
              className={`group relative flex flex-col items-center gap-1 sm:gap-2.5 px-1.5 py-3 sm:px-4 sm:py-5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "border-foreground/20 bg-foreground/[0.08] ring-1 ring-foreground/[0.12]"
                  : "border-foreground/[0.08] bg-foreground/[0.03] hover:bg-foreground/[0.06]"
              }`}
            >
              <div className={`transition-colors duration-200 ${
                isActive
                  ? "text-foreground"
                  : "text-foreground/60 group-hover:text-foreground/80"
              }`}>
                {cfg.icon}
              </div>
              <span className={`hidden sm:block text-sm font-semibold transition-colors ${
                isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground/90"
              }`}>
                {cfg.label}
              </span>
              <span className={`hidden sm:block text-[11px] leading-tight text-center transition-colors ${
                isActive ? "text-foreground/50" : "text-foreground/35"
              }`}>
                {cfg.description}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Inline Action Form */}
      <AnimatePresence mode="wait">
        {activeAction && (
          <ActionForm
            key={activeAction}
            action={activeAction}
            assets={assets}
            members={members}
            departments={departments}
            onDone={() => setActiveAction(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
