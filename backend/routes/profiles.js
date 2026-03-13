const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/profiles/me — get current user's profile
router.get("/me", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Profile not found." });

  res.json(data);
});

module.exports = router;
