import React from "react";

export interface AIMetadataBadgeProps {
  type: "suspect" | "location" | "category" | "date" | "section" | "stolen";
  label: string;
}

export const AIMetadataBadge: React.FC<AIMetadataBadgeProps> = ({ type, label }) => {
  if (!label || typeof label !== "string") return null;

  const styles = {
    suspect: "bg-blue-50 text-blue-800 border-blue-200",
    location: "bg-purple-50 text-purple-800 border-purple-200",
    category: "bg-amber-50 text-amber-800 border-amber-200",
    date: "bg-emerald-50 text-emerald-800 border-emerald-200",
    section: "bg-indigo-50 text-indigo-800 border-indigo-200",
    stolen: "bg-rose-50 text-rose-800 border-rose-200",
  };

  const icons = {
    suspect: "👤",
    location: "📍",
    category: "🏷️",
    date: "📅",
    section: "⚖️",
    stolen: "🚗",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border shadow-xs transition hover:scale-105 ${styles[type] || styles.category}`}
    >
      <span className="text-xs">{icons[type] || "🏷️"}</span>
      <span>{label}</span>
    </span>
  );
};

export default AIMetadataBadge;
