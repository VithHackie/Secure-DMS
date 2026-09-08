import { useState, useEffect } from "react";
import { FileText, Eye, Upload, Download, RefreshCw, X, ShieldCheck, Calendar, Tag, Folder } from "lucide-react";
import PdfViewerModal from "./PdfViewerModal";

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: any | null;
  onUploadForCase: (caseId: string) => void;
}

const CaseDetailsModal = ({
  isOpen,
  onClose,
  caseItem,
  onUploadForCase,
}: CaseDetailsModalProps) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [errorDocs, setErrorDocs] = useState<string>("");
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<any | null>(null);

  const fetchCaseDocuments = async () => {
    if (!caseItem?.id) return;
    setIsLoadingDocs(true);
    setErrorDocs("");
    try {
      const base = (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";
      const res = await fetch(`${base}/cases/${caseItem.id}/documents`);
      if (!res.ok) {
        throw new Error("Failed to fetch documents for this case.");
      }
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      console.error("Error fetching case documents:", err);
      setErrorDocs(err.message || "Failed to load documents.");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (isOpen && caseItem?.id) {
      fetchCaseDocuments();
    } else {
      setDocuments([]);
    }
  }, [isOpen, caseItem?.id]);

  if (!isOpen || !caseItem) return null;

  const baseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-300 bg-[#f8fafc] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">{caseItem.title}</h2>
                  <span
                    className={[
                      "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
                      caseItem.status === "closed"
                        ? "border-slate-700 bg-slate-800 text-slate-300"
                        : caseItem.status === "under_investigation"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                    ].join(" ")}
                  >
                    {(caseItem.status || "open").replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Case ID: {caseItem.case_number} ({caseItem.id})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onUploadForCase(caseItem.id)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Document</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Case Overview Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-600" />
                Case Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Case Number</span>
                  <span className="font-semibold text-slate-800 text-sm">{caseItem.case_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date Registered</span>
                  <span className="text-slate-700 text-sm flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(caseItem.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Database UUID</span>
                  <span className="font-mono text-slate-700 text-xs truncate block">{caseItem.id}</span>
                </div>
              </div>

              {caseItem.description && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 block font-medium mb-1">Description</span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    {caseItem.description}
                  </p>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Associated Documents ({documents.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cryptographically hashed and OCR processed files attached to this case.
                  </p>
                </div>

                <button
                  onClick={fetchCaseDocuments}
                  disabled={isLoadingDocs}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDocs ? "animate-spin" : ""}`} />
                  Refresh List
                </button>
              </div>

              {errorDocs && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorDocs}
                </div>
              )}

              {isLoadingDocs ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  Loading case documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-700">No documents uploaded yet</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Upload an investigative PDF, FIR, or evidence file for this case.
                  </p>
                  <button
                    type="button"
                    onClick={() => onUploadForCase(caseItem.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Document Now
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left border-collapse">
                      <thead className="bg-slate-900 text-white text-xs">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Document Name</th>
                          <th className="px-4 py-3 font-semibold">Classification</th>
                          <th className="px-4 py-3 font-semibold">Upload Date</th>
                          <th className="px-4 py-3 font-semibold">SHA-256 Hash</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3.5 font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                                <span className="font-semibold">{doc.file_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-block rounded bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 font-medium text-indigo-700 capitalize text-[11px]">
                                {(doc.doc_type || "other").replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                              <div className="flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>{doc.sha256_hash ? `${doc.sha256_hash.slice(0, 14)}...` : "N/A"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocForViewer(doc)}
                                  className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white shadow-xs transition hover:bg-indigo-700"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View PDF / Details</span>
                                </button>
                                <a
                                  href={`${baseUrl}/documents/${doc.id}/file`}
                                  download={doc.file_name}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 shadow-xs transition hover:bg-slate-100"
                                  title="Download File"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-white px-6 py-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>

      {/* PDF & Document Viewer Modal */}
      {selectedDocForViewer && (
        <PdfViewerModal
          isOpen={!!selectedDocForViewer}
          onClose={() => setSelectedDocForViewer(null)}
          document={selectedDocForViewer}
        />
      )}
    </>
  );
};

export default CaseDetailsModal;
