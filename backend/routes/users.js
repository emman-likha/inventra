const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// Middleware: require admin role
function requireAdmin(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

// GET /api/users — list all users in the admin's company
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  // Get profiles in the same company
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, created_at")
    .eq("company_id", req.companyId)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Get emails from auth.users for these profile ids
  const userIds = (profiles ?? []).map((p) => p.id);
  const usersWithEmail = [];

  for (const profile of profiles ?? []) {
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    usersWithEmail.push({
      ...profile,
      email: authUser?.user?.email ?? null,
    });
  }

  res.json(usersWithEmail);
});

// POST /api/users/invite — admin creates a new user under their company
router.post("/invite", requireAuth, requireAdmin, async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name?.trim() || !last_name?.trim()) {
    return res.status(400).json({ error: "First name and last name are required." });
  }
  if (!email?.trim()) {
    return res.status(400).json({ error: "Email is required." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  // Create user via Supabase admin API with company_id in metadata
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      company_id: req.companyId,
    },
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  res.status(201).json({
    id: authData.user.id,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: email.trim(),
    role: "user",
  });
});

// DELETE /api/users/:id — admin removes a user from their company
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account." });
  }

  // Verify the user belongs to the same company
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", id)
    .eq("company_id", req.companyId)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: "User not found in your company." });
  }

  // Delete the auth user (this will cascade to profile via trigger/FK)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  res.json({ success: true });
});

module.exports = router;
