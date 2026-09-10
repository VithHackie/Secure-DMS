import React from "react";

interface LogFiltersProps {
  onFilterChange: (filter: string) => void;
}

export const LogFilters: React.FC<LogFiltersProps> = ({ onFilterChange }) => {
  return (
    <div className="flex gap-4 mb-6">
      <select 
        onChange={(e) => onFilterChange(e.target.value)}
        className="p-2 border rounded shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">All System Actions</option>
        <option value="LOGIN">User Logins</option>
        <option value="UPLOAD_DOC">Document Uploads</option>
        <option value="CASE_CREATED">Cases Created</option>
        <option value="VAULT_SEARCH">Vault Searches</option>
        <option value="TAMPER_DETECTED">Security Alerts (Tamper)</option>
      </select>
    </div>
  );
};