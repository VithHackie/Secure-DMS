import { DataTypes } from 'sequelize';
// Adjust the import path based on where your Sequelize connection instance is initialized
import { sequelise } from '../db/dbconnection.js'; 

export const Case = sequelise.define('Case', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  case_number: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'under_investigation', 'pending', 'closed'),
    allowNull: false,
    defaultValue: 'open',
  },
  assigned_officer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    // If you have a User model defined, uncomment the relationship below:
    // references: { model: 'users', key: 'id' }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    // references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'cases',
  timestamps: true,       // Tells Sequelize to manage created_at and updated_at
  createdAt: 'created_at', // Maps Sequelize's default 'createdAt' to your SQL column
  updatedAt: 'updated_at', // Maps Sequelize's default 'updatedAt' to your SQL column
});