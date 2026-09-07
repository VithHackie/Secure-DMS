import { DataTypes } from "sequelize";
import { sequelise } from "../db/dbconnection.js"; 

export const Document = sequelise.define("Document", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  case_id: { type: DataTypes.UUID, allowNull: false },
  uploader_id: { type: DataTypes.UUID, allowNull: true },
  file_name: { type: DataTypes.STRING, allowNull: false },
  file_url: { type: DataTypes.TEXT, allowNull: false },
  doc_type: { type: DataTypes.STRING, defaultValue: 'other' },
  sha256_hash: { type: DataTypes.CHAR(64), allowNull: false },
  previous_hash: { type: DataTypes.CHAR(64), allowNull: true },
  digital_signature: { type: DataTypes.TEXT, allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {} }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // Your schema doesn't have updated_at for documents
});