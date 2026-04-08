const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/inventories — list all inventory items
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("inventories")
    .select("*")
    .eq("company_id", req.companyId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// GET /api/inventories/:id — get a single inventory item
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("inventories")
    .select("*")
    .eq("id", id)
    .eq("company_id", req.companyId)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Inventory item not found." });
  res.json(data);
});

// POST /api/inventories — create an inventory item
router.post("/", requireAuth, async (req, res) => {
  const { name, category, quantity, min_quantity, unit, cost_per_unit, location, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  const { data, error } = await supabase
    .from("inventories")
    .insert({
      name: name.trim(),
      category: category?.trim() || null,
      quantity: quantity ?? 0,
      min_quantity: min_quantity ?? 0,
      unit: unit?.trim() || "pcs",
      cost_per_unit: cost_per_unit ?? null,
      location: location?.trim() || null,
      description: description?.trim() || null,
      created_by: req.user.id,
      company_id: req.companyId,
    })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/inventories/import — bulk import inventory items
router.post("/import", requireAuth, async (req, res) => {
  const { inventories } = req.body;

  if (!Array.isArray(inventories) || inventories.length === 0) {
    return res.status(400).json({ error: "inventories array is required." });
  }

  const rows = inventories.map((inv) => ({
    name: inv.name?.trim(),
    category: inv.category?.trim() || null,
    quantity: inv.quantity ?? 0,
    min_quantity: inv.min_quantity ?? 0,
    unit: inv.unit?.trim() || "pcs",
    cost_per_unit: inv.cost_per_unit ?? null,
    location: inv.location?.trim() || null,
    description: inv.description?.trim() || null,
    created_by: req.user.id,
    company_id: req.companyId,
  }));

  const invalid = rows.filter((r) => !r.name);
  if (invalid.length > 0) {
    return res.status(400).json({ error: "All items must have a name." });
  }

  const { data, error } = await supabase
    .from("inventories")
    .insert(rows)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/inventories/:id — update an inventory item
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, min_quantity, unit, cost_per_unit, location, description } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (category !== undefined) updates.category = category?.trim() || null;
  if (quantity !== undefined) updates.quantity = quantity;
  if (min_quantity !== undefined) updates.min_quantity = min_quantity;
  if (unit !== undefined) updates.unit = unit?.trim() || "pcs";
  if (cost_per_unit !== undefined) updates.cost_per_unit = cost_per_unit;
  if (location !== undefined) updates.location = location?.trim() || null;
  if (description !== undefined) updates.description = description?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update." });
  }

  const { data, error } = await supabase
    .from("inventories")
    .update(updates)
    .eq("id", id)
    .eq("company_id", req.companyId)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Inventory item not found." });
  res.json(data[0]);
});

// DELETE /api/inventories — bulk delete inventory items by ids
router.delete("/", requireAuth, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required." });
  }

  const { error } = await supabase
    .from("inventories")
    .delete()
    .in("id", ids)
    .eq("company_id", req.companyId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, deleted: ids.length });
});

module.exports = router;
