require("dotenv").config({ path: ".env.local" });

const express = require("express");
const cors = require("cors");
const { supabase } = require("./lib/supabase");

const profilesRouter = require("./routes/profiles");
const assetsRouter = require("./routes/assets");
const departmentsRouter = require("./routes/departments");
const membersRouter = require("./routes/members");
const inventoriesRouter = require("./routes/inventories");
const assetActionsRouter = require("./routes/assetActions");
const usersRouter = require("./routes/users");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
}));

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({ message: "Inventra API running" });
});

// Public endpoint: check if company name already exists
app.post("/api/companies/check", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.json({ exists: false });

  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", name.trim())
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ exists: (data ?? []).length > 0 });
});

app.use("/api/profiles", profilesRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/members", membersRouter);
app.use("/api/inventories", inventoriesRouter);
app.use("/api/asset-actions", assetActionsRouter);
app.use("/api/users", usersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
