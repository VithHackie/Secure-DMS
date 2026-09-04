import { DataTypes } from "sequelize";
import { sequelise } from "../db/dbconnection.js";

export const User = sequelise.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: "investigating_officer" },
    badge_number: { type: DataTypes.STRING, unique: true },
    department: { type: DataTypes.STRING },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);
