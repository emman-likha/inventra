const { Router } = require("express");
const { supabase } = require("../lib/supabase");
const { requireAuth } = require("../middleware/auth");

const router = Router();

// GET /api/asset-actions — list all asset actions with asset + member info
router.get("/", requireAuth, async (req, res) => {
  const { asset_id } = req.query;

  let query = supabase
    .from("asset_actions")
    .select("*, asset:assets!asset_id(id, name), member:members!member_id(id, first_name, last_name), department:departments!department_id(id, name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (asset_id) {
    query = query.eq("asset_id", asset_id);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST /api/asset-actions — create an asset action and update the asset accordingly
router.post("/", requireAuth, async (req, res) => {
  const { asset_id, action, member_id, department_id, to_location, work_setup, action_date, notes } = req.body;

  if (!asset_id) {
    return res.status(400).json({ error: "asset_id is required." });
  }
  if (!action) {
    return res.status(400).json({ error: "action is required." });
  }

  const validActions = ["check_out", "check_in", "move", "maintenance", "dispose", "reserve"];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` });
  }

  // Get current asset state
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("*")
    .eq("id", asset_id)
    .single();

  if (assetError || !asset) {
    return res.status(404).json({ error: "Asset not found." });
  }

  // Build the action record
  const actionRecord = {
    asset_id,
    action,
    member_id: member_id || null,
    department_id: department_id || null,
    from_location: asset.location || null,
    to_location: to_location || null,
    work_setup: work_setup || null,
    action_date: action_date || null,
    notes: notes?.trim() || null,
    performed_by: req.user.id,
  };

  // Build asset updates based on action type
  const assetUpdates = {};

  switch (action) {
    case "check_out":
      if (!member_id) {
        return res.status(400).json({ error: "member_id is required for check out." });
      }
      assetUpdates.status = "checked_out";
      assetUpdates.assigned_to = member_id;
      // Get member's site_location
      const { data: memberOut } = await supabase
        .from("members")
        .select("site_location")
        .eq("id", member_id)
        .single();
      if (memberOut?.site_location) {
        assetUpdates.location = memberOut.site_location;
        actionRecord.to_location = memberOut.site_location;
      }
      break;

    case "check_in":
      assetUpdates.status = "available";
      assetUpdates.assigned_to = null;
      if (to_location) {
        assetUpdates.location = to_location;
      }
      break;

    case "move":
      if (!to_location) {
        return res.status(400).json({ error: "to_location is required for move." });
      }
      assetUpdates.location = to_location;
      break;

    case "maintenance":
      assetUpdates.status = "maintenance";
      break;

    case "dispose":
      assetUpdates.status = "retired";
      assetUpdates.assigned_to = null;
      break;

    case "reserve":
      if (!member_id) {
        return res.status(400).json({ error: "member_id is required for reserve." });
      }
      // Reserve doesn't change status to checked_out yet, just records intent
      assetUpdates.assigned_to = member_id;
      break;
  }

  // Insert the action record
  const { error: insertError } = await supabase
    .from("asset_actions")
    .insert(actionRecord);

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  // Update the asset
  if (Object.keys(assetUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from("assets")
      .update(assetUpdates)
      .eq("id", asset_id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
  }

  res.status(201).json({ success: true });
});

module.exports = router;
