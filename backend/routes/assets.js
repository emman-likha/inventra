const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/assets — list all assets
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST /api/assets — create a single asset
router.post("/", requireAuth, async (req, res) => {
  const { name, category, location, status, value } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ error: "Category is required." });
  }

  const { data, error } = await supabase.from("assets").insert({
    name: name.trim(),
    category: category.trim(),
    location: location?.trim() || null,
    status: status || "available",
    value: value ?? null,
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
