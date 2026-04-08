const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/members — list all members (optionally filter by department_id)
router.get("/", requireAuth, async (req, res) => {
  const { department_id } = req.query;

  let query = supabase
    .from("members")
    .select("*")
    .eq("company_id", req.companyId)
    .order("first_name", { ascending: true });

  if (department_id) {
    query = query.eq("department_id", department_id);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// GET /api/members/:id — get a single member
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .eq("company_id", req.companyId)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Member not found." });
  res.json(data);
});

// POST /api/members — create a member
router.post("/", requireAuth, async (req, res) => {
  const { department_id, first_name, last_name, employee_id, position, email, site_location } = req.body;

  if (!department_id) {
    return res.status(400).json({ error: "department_id is required." });
  }
  if (!first_name?.trim() || !last_name?.trim()) {
    return res.status(400).json({ error: "First name and last name are required." });
  }

  const { data, error } = await supabase.from("members").insert({
    department_id,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    employee_id: employee_id?.trim() || null,
    position: position?.trim() || null,
    email: email?.trim() || null,
    site_location: site_location?.trim() || null,
    company_id: req.companyId,
  }).select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// POST /api/members/import — bulk import members
router.post("/import", requireAuth, async (req, res) => {
  const { members } = req.body;

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: "members array is required." });
  }

  const rows = members.map((m) => ({
    department_id: m.department_id,
    first_name: m.first_name?.trim(),
    last_name: m.last_name?.trim(),
    employee_id: m.employee_id?.trim() || null,
    position: m.position?.trim() || null,
    email: m.email?.trim() || null,
    site_location: m.site_location?.trim() || null,
    company_id: req.companyId,
  }));

  const invalid = rows.filter((r) => !r.department_id || !r.first_name || !r.last_name);
  if (invalid.length > 0) {
    return res.status(400).json({ error: "All members must have department_id, first_name, and last_name." });
  }

  const { data, error } = await supabase
    .from("members")
    .insert(rows)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/members/:id — update a member
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, employee_id, position, email, site_location } = req.body;

  const updates = {};
  if (first_name !== undefined) updates.first_name = first_name.trim();
  if (last_name !== undefined) updates.last_name = last_name.trim();
  if (employee_id !== undefined) updates.employee_id = employee_id?.trim() || null;
  if (position !== undefined) updates.position = position?.trim() || null;
  if (email !== undefined) updates.email = email?.trim() || null;
  if (site_location !== undefined) updates.site_location = site_location?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields to update." });
  }

  const { data, error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", id)
    .eq("company_id", req.companyId)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Member not found." });
  res.json(data[0]);
});

// DELETE /api/members/bulk — bulk delete members by ids
router.delete("/bulk", requireAuth, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "ids array is required." });
  }

  const { error } = await supabase
    .from("members")
    .delete()
    .in("id", ids)
    .eq("company_id", req.companyId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, deleted: ids.length });
});

// DELETE /api/members/:id — delete a member
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", id)
    .eq("company_id", req.companyId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
