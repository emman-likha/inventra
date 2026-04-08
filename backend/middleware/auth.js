const { supabase } = require("../lib/supabase");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header." });
  }

  const token = header.split(" ")[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  // Fetch user's company and role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.company_id) {
    return res.status(403).json({ error: "User not associated with a company." });
  }

  req.user = user;
  req.companyId = profile.company_id;
  req.userRole = profile.role;
  next();
}

module.exports = { requireAuth };
