const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:3000"
}));

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Inventra API running 🚀" });
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});