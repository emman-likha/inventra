const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/departments — list all departments with member count
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("departments")
    .select("*, members(count)")
    .eq("company_id", req.companyId)
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Flatten the count from the join
  const result = (data ?? []).map((d) => ({
    ...d,
    member_count: d.members?.[0]?.count ?? 0,
  }));
  // Remove the raw members join data
  result.forEach((d) => delete d.members);

  res.json(result);
});

// POST /api/departments — create a department
router.post("/", requireAuth, async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  const { data, error } = await supabase.from("departments").insert({
    name: name.trim(),
    company_id: req.companyId,
  }).select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/departments/import — bulk import departments
router.post("/import", requireAuth, async (req, res) => {
  const { departments } = req.body;

  if (!Array.isArray(departments) || departments.length === 0) {
    return res.status(400).json({ error: "departments array is required." });
  }

  const rows = departments.map((d) => ({
    name: d.name?.trim(),
    company_id: req.companyId,
  }));

  const invalid = rows.filter((r) => !r.name);
  if (invalid.length > 0) {
    return res.status(400).json({ error: "All departments must have a name." });
  }

  const { data, error } = await supabase
    .from("departments")
    .upsert(rows, { onConflict: "name,company_id", ignoreDuplicates: true })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/departments/:id — get a single department with member count
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("departments")
    .select("*, members(count)")
    .eq("id", id)
    .eq("company_id", req.companyId)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Department not found." });

  const result = {
    ...data,
    member_count: data.members?.[0]?.count ?? 0,
  };
  delete result.members;

  res.json(result);
});

// PUT /api/departments/:id — update a department
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  const { data, error } = await supabase
    .from("departments")
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("company_id", req.companyId)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Department not found." });
  res.json(data[0]);
});

// DELETE /api/departments — bulk delete departments by ids
router.delete("/", requireAuth, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required." });
  }

  const { error } = await supabase
    .from("departments")
    .delete()
    .in("id", ids)
    .eq("company_id", req.companyId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, deleted: ids.length });
});

module.exports = router;
