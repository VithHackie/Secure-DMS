import React from "react";
import { Copy, ShieldCheck, UserCheck, Calendar, Hash, FileText } from "lucide-react";

export interface CaseData {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  status: "open" | "under_investigation" | "pending" | "closed";
  assigned_officer_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface ViewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseData | null;
}

const ViewCaseModal: React.FC<ViewCaseModalProps> = ({
  isOpen,
  onClose,
  caseData,
}) => {
  if (!isOpen || !caseData) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const statusStyles: Record<string, string> = {
    closed: "border-slate-200 bg-slate-100 text-slate-600",
    under_investigation: "border-amber-200 bg-amber-50 text-amber-700",
    pending: "border-blue-200 bg-blue-50 text-blue-700",
    open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-700/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-300 bg-[#f2f3f1] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-300 bg-[#f7f7f6] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Case Details
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                UUID: {caseData.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-3xl text-slate-600 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
          {/* Top Title & Status Banner */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {caseData.case_number}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {caseData.title}
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                  statusStyles[caseData.status] || statusStyles.open
                }`}
              >
                <ShieldCheck size={14} />
                {caseData.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Case Description */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileText size={16} />
              <span>Description / Narrative</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">
              {caseData.description || "No description provided for this case."}
            </p>
          </div>

          {/* Primary Metadata Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* System UUID */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Hash size={14} />
                <span>Internal Case UUID</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-800 truncate">
                  {caseData.id}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(caseData.id)}
                  className="ml-2 text-slate-400 hover:text-slate-700"
                  title="Copy UUID"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Assigned Officer */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <UserCheck size={14} />
                <span>Assigned Officer ID</span>
              </div>
              <span className="font-mono text-xs text-slate-800">
                {caseData.assigned_officer_id || "Unassigned"}
              </span>
            </div>

            {/* Created By */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <UserCheck size={14} />
                <span>Created By (User ID)</span>
              </div>
              <span className="font-mono text-xs text-slate-800">
                {caseData.created_by || "System / Anonymous"}
              </span>
            </div>

            {/* Registration Timestamp */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Calendar size={14} />
                <span>Created At (TIMESTAMPTZ)</span>
              </div>
              <span className="text-xs text-slate-800">
                {new Date(caseData.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
            <span>
              Last Updated: {new Date(caseData.updated_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-300 bg-[#f7f7f6] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewCaseModal;