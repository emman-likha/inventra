"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAsset,
  fetchAssets,
  fetchAllMembers,
  fetchDepartments,
  type Member,
} from "@/lib/api";

const inputClass =
  "w-full bg-foreground/[0.03] border border-foreground/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/20 transition-colors";

const labelClass = "block text-foreground/50 text-xs font-medium mb-1.5";

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
}

interface Asset {
  category: string;
  inventory_location?: string | null;
}

interface Department {
  id: string;
  name: string;
}

export function AddAssetModal({ open, onClose }: AddAssetModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [workSetup, setWorkSetup] = useState<"on_site" | "remote">("on_site");
  const [location, setLocation] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [value, setValue] = useState("");
  const [checkOut, setCheckOut] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const departmentRef = useRef<HTMLDivElement>(null);
  const memberRef = useRef<HTMLDivElement>(null);

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: fetchAssets,
    enabled: open,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["all-members"],
    queryFn: fetchAllMembers,
    enabled: open && checkOut,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    enabled: open && checkOut,
  });

  const categories = useMemo(() => {
    const unique = [...new Set(assets.map((a) => a.category).filter(Boolean))];
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [assets]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const inventoryLocations = useMemo(() => {
    const unique = [
      ...new Set(
        assets
          .map((a) => a.inventory_location)
          .filter((l): l is string => !!l)
      ),
    ];
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [assets]);

  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return inventoryLocations;
    const q = locationSearch.toLowerCase();
    return inventoryLocations.filter((l) => l.toLowerCase().includes(q));
  }, [inventoryLocations, locationSearch]);

  const filteredDepartments = useMemo(() => {
    if (!departmentSearch.trim()) return departments;
    const q = departmentSearch.toLowerCase();
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, departmentSearch]);

  const filteredMembers = useMemo(() => {
    let list = members;
    if (departmentId) {
      list = list.filter((m) => m.department_id === departmentId);
    }
    if (!memberSearch.trim()) return list;
    const q = memberSearch.toLowerCase();
    return list.filter(
      (m) =>
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q)
    );
  }, [members, departmentId, memberSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
      if (departmentRef.current && !departmentRef.current.contains(e.target as Node)) {
        setDepartmentOpen(false);
      }
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) {
        setMemberOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // When work setup changes, update location accordingly
  useEffect(() => {
    if (workSetup === "remote") {
      setLocation("Home");
      setLocationOpen(false);
    } else {
      // Reset location when switching to on_site so user picks from dropdown
      setLocation("");
    }
  }, [workSetup]);

  const mutation = useMutation({
    mutationFn: async () => {
      const finalCategory = isOtherCategory ? customCategory.trim() : category;
      await createAsset({
        name: name.trim(),
        category: finalCategory,
        location: location.trim() || null,
        status: checkOut && memberId ? "checked_out" : "available",
        value: value.trim() ? parseFloat(value) : null,
        assigned_to: checkOut && memberId ? memberId : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        resetForm();
        onClose();
      }, 1500);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  function resetForm() {
    setName("");
    setCategory("");
    setCategorySearch("");
    setCategoryOpen(false);
    setIsOtherCategory(false);
    setCustomCategory("");
    setWorkSetup("on_site");
    setLocation("");
    setLocationOpen(false);
    setLocationSearch("");
    setValue("");
    setCheckOut(false);
    setDepartmentId("");
    setDepartmentOpen(false);
    setDepartmentSearch("");
    setMemberId("");
    setMemberOpen(false);
    setMemberSearch("");
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
    const finalCategory = isOtherCategory ? customCategory.trim() : category;
    if (!finalCategory) {
      setError("Category is required.");
      return;
    }
    if (value.trim() && isNaN(parseFloat(value))) {
      setError("Value must be a valid number.");
      return;
    }
    if (checkOut && !memberId) {
      setError("Select a member to check out to.");
      return;
    }

    mutation.mutate();
  }

  const selectedDepartment = departments.find((d) => d.id === departmentId);
  const selectedMember = members.find((m) => m.id === memberId);

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
              className="bg-background border border-foreground/[0.08] rounded-2xl w-full max-w-lg p-6 pointer-events-auto shadow-xl max-h-[90vh] overflow-y-auto scrollbar-hidden"
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

                {/* Category */}
                <div>
                  <label className={labelClass}>Category *</label>
                  {isOtherCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter new category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className={inputClass}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtherCategory(false);
                          setCustomCategory("");
                        }}
                        className="shrink-0 text-foreground/40 hover:text-foreground/70 text-xs px-3 border border-foreground/[0.08] rounded-xl transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  ) : (
                    <div ref={categoryRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryOpen(!categoryOpen);
                          setCategorySearch("");
                        }}
                        className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
                      >
                        <span className={category ? "text-foreground" : "text-foreground/30"}>
                          {category || "Select category"}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-foreground/30 transition-transform ${categoryOpen ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {categoryOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-background border border-foreground/[0.08] rounded-xl shadow-lg overflow-hidden">
                          {/* Search */}
                          <div className="p-2 border-b border-foreground/[0.06]">
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/15 transition-colors"
                              autoFocus
                            />
                          </div>

                          {/* Options */}
                          <div className="max-h-44 overflow-y-auto">
                            {filteredCategories.length === 0 && (
                              <div className="px-4 py-3 text-xs text-foreground/30">
                                No categories found
                              </div>
                            )}
                            {filteredCategories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setCategory(cat);
                                  setCategoryOpen(false);
                                  setCategorySearch("");
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-foreground/[0.04] transition-colors cursor-pointer ${
                                  category === cat ? "text-foreground font-medium bg-foreground/[0.03]" : "text-foreground/70"
                                }`}
                              >
                                {cat}
                              </button>
                            ))}

                            {/* Other option */}
                            <div className="border-t border-foreground/[0.06]">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOtherCategory(true);
                                  setCategory("");
                                  setCategoryOpen(false);
                                  setCategorySearch("");
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground/70 transition-colors cursor-pointer italic"
                              >
                                + Other (add new category)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Work Setup + Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Work Setup</label>
                    <div className="flex rounded-xl border border-foreground/[0.08] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setWorkSetup("on_site")}
                        className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                          workSetup === "on_site"
                            ? "bg-foreground text-background"
                            : "bg-foreground/[0.03] text-foreground/50 hover:text-foreground/70"
                        }`}
                      >
                        On Site
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkSetup("remote")}
                        className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer border-l border-foreground/[0.08] ${
                          workSetup === "remote"
                            ? "bg-foreground text-background"
                            : "bg-foreground/[0.03] text-foreground/50 hover:text-foreground/70"
                        }`}
                      >
                        Remote
                      </button>
                    </div>
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

                {/* Location */}
                <div>
                  <label className={labelClass}>Location</label>
                  {workSetup === "remote" ? (
                    <div className={`${inputClass} opacity-60 cursor-default`}>
                      Home
                    </div>
                  ) : (
                    <div ref={locationRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setLocationOpen(!locationOpen);
                          setLocationSearch("");
                        }}
                        className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
                      >
                        <span className={`truncate ${location ? "text-foreground" : "text-foreground/30"}`}>
                          {location || "Select location"}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`shrink-0 text-foreground/30 transition-transform ${locationOpen ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {locationOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-background border border-foreground/[0.08] rounded-xl shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-foreground/[0.06]">
                            <input
                              type="text"
                              placeholder="Search locations..."
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/15 transition-colors"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-44 overflow-y-auto">
                            {/* None option */}
                            <button
                              type="button"
                              onClick={() => {
                                setLocation("");
                                setLocationOpen(false);
                                setLocationSearch("");
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-foreground/[0.04] transition-colors cursor-pointer ${
                                !location ? "text-foreground/40 font-medium bg-foreground/[0.03]" : "text-foreground/40"
                              }`}
                            >
                              None
                            </button>
                            {filteredLocations.length === 0 && (
                              <div className="px-4 py-3 text-xs text-foreground/30">
                                No locations found
                              </div>
                            )}
                            {filteredLocations.map((loc) => (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => {
                                  setLocation(loc);
                                  setLocationOpen(false);
                                  setLocationSearch("");
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-foreground/[0.04] transition-colors cursor-pointer ${
                                  location === loc ? "text-foreground font-medium bg-foreground/[0.03]" : "text-foreground/70"
                                }`}
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Check Out toggle */}
                <div>
                  <label className={labelClass}>Check Out</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckOut(!checkOut);
                      if (checkOut) {
                        setDepartmentId("");
                        setMemberId("");
                      }
                    }}
                    className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
                  >
                    <span className={checkOut ? "text-foreground" : "text-foreground/30"}>
                      {checkOut ? "Assign to a member" : "No — keep available"}
                    </span>
                    <div
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        checkOut ? "bg-foreground" : "bg-foreground/15"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform shadow-sm ${
                          checkOut ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Department + Member — only when check out is on */}
                {checkOut && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Department dropdown */}
                    <div>
                      <label className={labelClass}>Department *</label>
                      <div ref={departmentRef} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setDepartmentOpen(!departmentOpen);
                            setDepartmentSearch("");
                          }}
                          className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
                        >
                          <span className={`truncate ${selectedDepartment ? "text-foreground" : "text-foreground/30"}`}>
                            {selectedDepartment?.name || "Select department"}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-foreground/30 transition-transform ${departmentOpen ? "rotate-180" : ""}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {departmentOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-background border border-foreground/[0.08] rounded-xl shadow-lg overflow-hidden">
                            <div className="p-2 border-b border-foreground/[0.06]">
                              <input
                                type="text"
                                placeholder="Search departments..."
                                value={departmentSearch}
                                onChange={(e) => setDepartmentSearch(e.target.value)}
                                className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/15 transition-colors"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-44 overflow-y-auto">
                              {filteredDepartments.length === 0 && (
                                <div className="px-4 py-3 text-xs text-foreground/30">No departments found</div>
                              )}
                              {filteredDepartments.map((dept) => (
                                <button
                                  key={dept.id}
                                  type="button"
                                  onClick={() => {
                                    setDepartmentId(dept.id);
                                    setDepartmentOpen(false);
                                    setDepartmentSearch("");
                                    setMemberId("");
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-foreground/[0.04] transition-colors cursor-pointer ${
                                    departmentId === dept.id ? "text-foreground font-medium bg-foreground/[0.03]" : "text-foreground/70"
                                  }`}
                                >
                                  {dept.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member dropdown */}
                    <div>
                      <label className={labelClass}>Member *</label>
                      <div ref={memberRef} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setMemberOpen(!memberOpen);
                            setMemberSearch("");
                          }}
                          className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
                        >
                          <span className={`truncate ${selectedMember ? "text-foreground" : "text-foreground/30"}`}>
                            {selectedMember
                              ? `${selectedMember.first_name} ${selectedMember.last_name}`
                              : "Select member"}
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-foreground/30 transition-transform ${memberOpen ? "rotate-180" : ""}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {memberOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-background border border-foreground/[0.08] rounded-xl shadow-lg overflow-hidden">
                            <div className="p-2 border-b border-foreground/[0.06]">
                              <input
                                type="text"
                                placeholder="Search members..."
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                className="w-full bg-foreground/[0.03] border border-foreground/[0.06] rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/15 transition-colors"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-44 overflow-y-auto">
                              {filteredMembers.length === 0 && (
                                <div className="px-4 py-3 text-xs text-foreground/30">
                                  {departmentId ? "No members in this department" : "Select a department first"}
                                </div>
                              )}
                              {filteredMembers.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setMemberId(m.id);
                                    setMemberOpen(false);
                                    setMemberSearch("");
                                    // Auto-fill location from member's site_location when on_site
                                    if (workSetup === "on_site" && m.site_location) {
                                      setLocation(m.site_location);
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-foreground/[0.04] transition-colors cursor-pointer ${
                                    memberId === m.id ? "text-foreground font-medium bg-foreground/[0.03]" : "text-foreground/70"
                                  }`}
                                >
                                  {m.first_name} {m.last_name}
                                  {m.position && <span className="text-foreground/30 ml-1">— {m.position}</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                    disabled={mutation.isPending || success}
                    className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-default ${
                      success
                        ? "bg-emerald-500 text-white"
                        : "bg-foreground text-background hover:opacity-90 disabled:opacity-50"
                    }`}
                  >
                    {success ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Asset Added
                      </span>
                    ) : mutation.isPending ? "Adding..." : "Add Asset"}
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
