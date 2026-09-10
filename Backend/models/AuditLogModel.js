import { DataTypes } from "sequelize";
import { sequelise } from "../db/dbconnection.js";

export const AuditLog = sequelise.define("AuditLog", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: { type: DataTypes.UUID, allowNull: true },
  case_id: { type: DataTypes.UUID, allowNull: true },
  document_id: { type: DataTypes.UUID, allowNull: true },
  action: { type: DataTypes.STRING(50), allowNull: false },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
  details: { type: DataTypes.JSONB, defaultValue: {} },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: "audit_logs",
  timestamps: false
});