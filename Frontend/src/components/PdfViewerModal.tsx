import { useState } from "react";
import { FileText, Download, ShieldCheck, Hash, Eye, X, Copy, Check, Info } from "lucide-react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any | null;
}

const PdfViewerModal = ({ isOpen, onClose, document: doc }: PdfViewerModalProps) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeTab, setActiveTab] = useState<"viewer" | "ocr">("viewer");

  if (!isOpen || !doc) return null;

  const baseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";
  const fileApiUrl = `${baseUrl}/documents/${doc.id}/file`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const ocrText = doc.metadata?.extracted_fields?.raw_text || doc.metadata?.extracted_text || "";
  const ocrConfidence = doc.metadata?.ocr_confidence ?? doc.metadata?.confidence_score ?? null;
  const totalPages = doc.metadata?.total_pages ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{doc.file_name}</h3>
                <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-semibold uppercase text-indigo-300">
                  {doc.doc_type || "document"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Uploaded on {new Date(doc.created_at || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={fileApiUrl}
              download={doc.file_name}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <Download className="h-4 w-4 text-indigo-400" />
              <span>Download PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Security / Cryptographic Hash Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">SHA-256 Hash:</span>
            <span className="font-mono text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded border border-slate-300/60 select-all">
              {doc.sha256_hash}
            </span>
            <button
              onClick={() => copyToClipboard(doc.sha256_hash)}
              className="ml-1 text-slate-500 hover:text-indigo-600 transition"
              title="Copy Hash"
            >
              {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {doc.previous_hash && (
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
              <Hash className="h-3.5 w-3.5 text-slate-400" />
              <span>Prev Hash: {doc.previous_hash.slice(0, 16)}...</span>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-slate-100">
          {/* Main Document Viewer (Left / Top) */}
          <div className="flex flex-1 flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("viewer")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    activeTab === "viewer"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  PDF / Document Preview
                </button>
                {ocrText && (
                  <button
                    onClick={() => setActiveTab("ocr")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                      activeTab === "ocr"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    OCR Text Result
                  </button>
                )}
              </div>

              {totalPages !== null && (
                <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
                  Total Pages: {totalPages}
                </span>
              )}
            </div>

            <div className="flex-1 rounded-xl border border-slate-300 bg-white shadow-inner overflow-hidden flex flex-col">
              {activeTab === "viewer" ? (
                <iframe
                  src={fileApiUrl}
                  className="h-full w-full border-none rounded-xl"
                  title={doc.file_name}
                />
              ) : (
                <div className="flex-1 p-5 overflow-auto bg-slate-900 text-emerald-400 font-mono text-sm leading-relaxed">
                  <div className="mb-4 pb-2 border-b border-slate-800 text-slate-400 flex items-center justify-between text-xs font-sans">
                    <span>Extracted Text Content via Tesseract OCR</span>
                    {ocrConfidence && (
                      <span className="text-emerald-400 font-medium">Confidence: {ocrConfidence}%</span>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-xs">{ocrText || "No text extracted."}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Metadata */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-5 overflow-y-auto flex flex-col gap-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Document Details
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">File Name</span>
                  <span className="font-semibold text-slate-800 break-all">{doc.file_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Category / Type</span>
                  <span className="font-medium text-slate-800 capitalize">{doc.doc_type || "Other"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Case ID</span>
                  <span className="font-mono text-slate-700 text-[11px] break-all">{doc.case_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Uploaded At</span>
                  <span className="text-slate-700">{new Date(doc.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-500" />
                OCR & Analysis
              </h4>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">OCR Scan:</span>
                  <span className="font-semibold text-slate-700">
                    {ocrConfidence !== null ? "Completed" : "N/A"}
                  </span>
                </div>
                {ocrConfidence !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="font-semibold text-emerald-600">{ocrConfidence}%</span>
                  </div>
                )}
                {totalPages !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Page Count:</span>
                    <span className="font-semibold text-slate-700">{totalPages}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4">
              <a
                href={fileApiUrl}
                download={doc.file_name}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Download Document
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewerModal;
