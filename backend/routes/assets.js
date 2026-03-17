const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/assets — list all assets with assigned member info
router.get("/", requireAuth, async (req, res) => {
  // Try with member join first; fall back to plain select if FK isn't set up yet
  let { data, error } = await supabase
    .from("assets")
    .select("*, member:members!assigned_to(id, first_name, last_name)")
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback: fetch without join (FK may not exist yet)
    const fallback = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (fallback.error) return res.status(500).json({ error: fallback.error.message });

    const result = (fallback.data ?? []).map((a) => ({
      ...a,
      assigned_member: null,
    }));
    return res.json(result);
  }

  const result = (data ?? []).map((a) => ({
    ...a,
    assigned_member: a.member || null,
  }));
  result.forEach((a) => delete a.member);

  res.json(result);
});

// POST /api/assets — create a single asset
router.post("/", requireAuth, async (req, res) => {
  const { name, category, location, status, value, assigned_to } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ error: "Category is required." });
  }

  // If assigning to a member, use their site_location as asset location
  let resolvedLocation = location?.trim() || null;
  if (assigned_to) {
    const { data: member } = await supabase
      .from("members")
      .select("site_location")
      .eq("id", assigned_to)
      .single();
    if (member?.site_location) {
      resolvedLocation = member.site_location;
    }
  }

  const { data, error } = await supabase.from("assets").insert({
    name: name.trim(),
    category: category.trim(),
    location: resolvedLocation,
    status: assigned_to ? "checked_out" : (status || "available"),
    value: value ?? null,
    assigned_to: assigned_to || null,
    created_by: req.user.id,
  }).select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/assets/import — bulk import assets
router.post("/import", requireAuth, async (req, res) => {
  const { assets } = req.body;

  if (!Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ error: "No assets provided." });
  }

  const rows = assets.map((a) => ({
    name: a.name,
    category: a.category,
    location: a.location || null,
    status: a.status || "available",
    value: a.value ?? null,
    created_by: req.user.id,
  }));

  const { data, error } = await supabase.from("assets").insert(rows).select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/assets/:id — update an asset
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, category, location, status, value, assigned_to } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (category !== undefined) updates.category = category?.trim() || null;
  if (location !== undefined) updates.location = location?.trim() || null;
  if (status !== undefined) updates.status = status;
  if (value !== undefined) updates.value = value;
  if (assigned_to !== undefined) {
    updates.assigned_to = assigned_to || null;
    // Enforce status based on assignment
    if (assigned_to) {
      updates.status = "checked_out";
      // Set location to member's site_location
      const { data: member } = await supabase
        .from("members")
        .select("site_location")
        .eq("id", assigned_to)
        .single();
      if (member?.site_location) {
        updates.location = member.site_location;
      }
    } else if (!updates.status || updates.status === "checked_out") {
      updates.status = "available";
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update." });
  }

  const { data, error } = await supabase
    .from("assets")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Asset not found." });
  res.json(data[0]);
});

// DELETE /api/assets — bulk delete assets by ids
router.delete("/", requireAuth, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required." });
  }

  const { error } = await supabase
    .from("assets")
    .delete()
    .in("id", ids);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, deleted: ids.length });
});

module.exports = router;
