const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/departments — list all departments
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST /api/departments — create a department
router.post("/", requireAuth, async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  const { data, error } = await supabase.from("departments").insert({
    name: name.trim(),
    description: description?.trim() || null,
  }).select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/departments/:id/members — get members of a department
router.get("/:id/members", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("department_id", id)
    .order("first_name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

module.exports = router;
