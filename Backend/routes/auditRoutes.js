import express from "express";
import { AuditLog } from "../models/AuditLogModel.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [["created_at", "DESC"]],
      limit: 100 // Prevent overwhelming the UI payload
    });
    res.status(200).json(logs);
  } catch (error) {
    console.error("Fetch Audit Logs Error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;