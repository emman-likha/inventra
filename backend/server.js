require("dotenv").config({ path: ".env.local" });

const express = require("express");
const cors = require("cors");

const profilesRouter = require("./routes/profiles");
const assetsRouter = require("./routes/assets");
const departmentsRouter = require("./routes/departments");
const membersRouter = require("./routes/members");
const inventoriesRouter = require("./routes/inventories");
const assetActionsRouter = require("./routes/assetActions");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
}));

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({ message: "Inventra API running" });
});

app.use("/api/profiles", profilesRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/members", membersRouter);
app.use("/api/inventories", inventoriesRouter);
app.use("/api/asset-actions", assetActionsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
