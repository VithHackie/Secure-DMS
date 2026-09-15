import { useState, useContext, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Bell,
  User,
  LogOut,
  Galaxy,
  Copy,
  Calendar,
  Hash,
  X,
  Eye,
  Sparkles,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";
import AIMetadataBadge from "../components/AIMetadataBadge";

// Shape as returned by GET /vault/search
export interface VaultDocument {
  id: string;
  case_id: string;
  uploader_id?: string;
  file_name?: string;
  file_url?: string;
  doc_type?: string;
  metadata?: {
    title?: string;
    description?: string;
    case_number?: string;
    verification_code?: 1 | 0;
    [key: string]: any;
  } | null;
  verification_code?: 1 | 0; // 1 = Cryptographically Intact, 0 = Hash Mismatch / Tampered
  created_at: string;
  file_base64?: string | null;
  content_type?: string | null;
}

const getDocTitle = (doc: VaultDocument) =>
  doc.metadata?.title || doc.file_name || "Untitled Document";

const getDocDescription = (doc: VaultDocument) =>
  doc.metadata?.description || "No narrative provided for this record.";

const getCaseNumber = (doc: VaultDocument) =>
  doc.metadata?.case_number || doc.case_id;

const getDocType = (doc: VaultDocument) => doc.doc_type || "Document";

type VerificationStatus = "verified" | "tampered" | "unknown";
const getVerificationStatus = (doc: VaultDocument): VerificationStatus => {
  const code = doc.verification_code ?? doc.metadata?.verification_code;
  console.log(code)
  if (code === 1) return "verified";
  if (code === 0) return "tampered";
  return "unknown";
};

const DocumentVault = () => {
  const auth = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"exact" | "ai">("ai");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<VaultDocument[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogout = () => {
    if (auth) auth.logout();
  };

  const openDocumentViewer = async (doc: VaultDocument) => {
    setViewerLoading(true);
    try {
      const base =
        (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";
      const token = auth?.token ?? null;

      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
        setViewerUrl(null);
      }

      let url: string | null = null;

      if (doc.file_base64) {
        const byteChars = atob(doc.file_base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: doc.content_type || "application/pdf",
        });
        url = URL.createObjectURL(blob);
      } else if (doc.file_url) {
        const resp = await fetch(
          doc.file_url.startsWith("http")
            ? doc.file_url
            : `${base}/${doc.file_url.replace(/^\//, "")}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        const blob = await resp.blob();
        url = URL.createObjectURL(blob);
      }

      setSelectedDoc(doc);
      setViewerUrl(url);

      // --- Audit log: record that this user viewed/accessed this document ---
      try {
        await fetch(`${base}/vault/log-access`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            document_id: doc.id,
            case_id: doc.case_id,
            action: "VIEW_DOC",
          }),
        });
      } catch {
        // Non-critical — viewer still opens even if the audit call fails
      }
    } catch (err) {
      console.error("Failed to load document for viewing", err);
      setSelectedDoc(doc);
      setViewerUrl(null);
    } finally {
      setViewerLoading(false);
    }
  };

  const handleSearch = async (e?: FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery !== undefined ? customQuery : searchQuery;
    if (!queryToUse.trim()) return;

    if (customQuery !== undefined) {
      setSearchQuery(customQuery);
    }

    setIsSearching(true);
    setHasSearched(true);
    setErrorMessage(null);
    setAiSummary(null);

    try {
      const base =
        (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";
      const token = auth?.token ?? null;

      const response = await fetch(
        `${base}/vault/search?q=${encodeURIComponent(queryToUse)}&mode=${searchMode}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data?.error || "Search failed. Please try again.");
        setResults([]);
        setAiSummary(null);
        return;
      }

      if (Array.isArray(data)) {
        setResults(data);
        setAiSummary(null);
      } else {
        setResults(Array.isArray(data.documents) ? data.documents : []);
        setAiSummary(data.ai_summary || null);
      }
    } catch (error) {
      console.error("Vault Search Error:", error);
      setErrorMessage("Could not reach the vault service. Showing sample data instead.");
      setAiSummary("Gemini AI Analysis: Stolen vehicle incident identified in Sector 4. CCTV footage retrieved for suspect Ramesh Kumar.");
      setResults([
        {
          id: "e4f8a2b1-09cd-4e89-81a2-3f4a5b6c7d8e",
          case_id: "e4f8a2b1-09cd-4e89-81a2-3f4a5b6c7d8e",
          uploader_id: "u-001",
          file_name: "vehicle-theft-fir.pdf",
          file_url: "/uploads/vehicle-theft-fir.pdf",
          doc_type: "FIR Narrative",
          verification_code: 1,
          metadata: {
            case_number: "FIR-2026-089",
            title: "Vehicle Theft in Sector 4 Parking Lot",
            description:
              "Stolen white sedan reported near central market. Suspect identified as Ramesh Kumar.",
            verification_code: 1,
            ai_extraction: {
              crime_category: "Vehicle Theft",
              suspect_names: ["Ramesh Kumar"],
              complainant_name: "Suresh Patel",
              location: { sector: "Sector 4", city: "Chandigarh", police_station: "PS Central" },
              dates: { incident_date: "2026-08-14" },
              bns_ipc_sections: ["Section 303 BNS", "Section 379 IPC"],
              summary: "White sedan stolen from Sector 4 market. CCTV footage collected.",
            },
          },
          created_at: new Date().toISOString(),
          file_base64: null,
          content_type: "application/pdf",
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar activeTab="vault" />

        <main className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-[#f4f6f9] px-5 lg:px-8">
            <div className="text-xl font-bold text-[#0f172a]">
              Document Vault & Integrity Search
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <button
                type="button"
                aria-label="notifications"
                className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <Bell size={16} />
              </button>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <User size={16} />
                Profile
              </Link>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          </header>

          <div className="p-5 lg:p-8 max-w-7xl mx-auto">
            {/* Title Section */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
                Hashed Ledger Vault
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Search via exact Case UUID or Case Number to verify hash integrity.
              </p>
            </div>

            {/* Smart Search Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
              {/* Search Mode Toggle */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSearchMode("ai")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                      searchMode === "ai"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Sparkles size={14} className={searchMode === "ai" ? "text-amber-300" : "text-slate-500"} />
                    AI Natural Language Search
                  </button>

                  <button
                    type="button"
                    onClick={() => setSearchMode("exact")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                      searchMode === "exact"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Hash size={14} />
                    Exact Case UUID / Number
                  </button>
                </div>

                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  {searchMode === "ai" ? "Powered by Gemini 2.5 LLM" : "Direct Ledger Index"}
                </span>
              </div>

              <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
                <div className="relative flex items-center">
                  <Search
                    className="absolute left-4 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchMode === "ai"
                        ? "Ask AI (e.g. 'Show me all vehicle theft cases in Sector 4 from last month')..."
                        : "Enter exact Case UUID or Case Number"
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50/50 py-3.5 pl-12 pr-32 text-slate-900 outline-none transition focus:border-[#0f172a] focus:bg-white focus:ring-1 focus:ring-[#0f172a]"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-2 rounded-md bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSearching ? (
                      "Resolving..."
                    ) : searchMode === "ai" ? (
                      <>
                        <Sparkles size={14} className="text-amber-300" /> AI Search
                      </>
                    ) : (
                      "Search Vault"
                    )}
                  </button>
                </div>

                {/* AI Suggestion Chips */}
                {searchMode === "ai" && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-slate-400">Try searching:</span>
                    {[
                      "Show me all vehicle theft cases in Sector 4",
                      "Find suspect Ramesh",
                      "Recent Cyber Crime FIRs",
                      "Stolen cars in Sector 5",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSearch(undefined, chip)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1 rounded-full transition border border-slate-200"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Galaxy size={20} className="text-[#0f172a]" />
                  <span>
                    {searchMode === "ai"
                      ? "Gemini LLM parses natural language query into metadata tags (Suspects, Sector, Crime Type, Dates)."
                      : "Case UUID lookup or Case Number search with real-time SHA256 chain verification."}
                  </span>
                </div>
              </form>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {/* AI Intelligence Synthesis Box */}
            {hasSearched && aiSummary && (
              <div className="mb-8 overflow-hidden rounded-xl border border-amber-500/30 bg-slate-900 text-white shadow-lg p-6 relative">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-inner">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-wide text-amber-300 flex items-center gap-2">
                        Professional Gemini AI Intelligence Synthesis
                      </h3>
                      <p className="text-xs text-slate-400">
                        Synthesized analysis collected across all uploaded case files & OCR documents
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2.5 py-1 rounded-md">
                    Gemini 2.5 LLM Engine
                  </span>
                </div>
                <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-line space-y-2 bg-slate-950/60 p-4 rounded-lg border border-slate-800 font-sans">
                  {aiSummary}
                </div>
              </div>
            )}

            {/* Results Section */}
            {hasSearched && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 bg-[#0f172a] px-6 py-4 text-white">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-wide">
                      Search Results & Hash Verification Ledger
                    </h2>
                    {searchMode === "ai" && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-medium">
                        <Sparkles size={12} /> AI Filtered
                      </span>
                    )}
                  </div>
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-200 font-mono">
                    Found {results.length} document(s)
                  </span>
                </div>

                {results.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <FileText
                      className="mx-auto mb-3 text-slate-300"
                      size={40}
                    />
                    <p className="text-base font-medium">
                      No documents found matching your query.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your keywords or switching search mode.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {results.map((doc) => {
                      const aiData = doc.metadata?.ai_extraction;
                      return (
                        <div
                          key={doc.id}
                          className="flex flex-col gap-4 p-6 transition hover:bg-slate-50/80 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="space-y-2.5 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#0f172a] bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                {getCaseNumber(doc)}
                              </span>
                              <span className="text-xs text-slate-500">
                                • {getDocType(doc)}
                              </span>
                              {doc.file_name && (
                                <span className="text-xs font-mono text-slate-400 truncate max-w-37.5">
                                  ({doc.file_name})
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {getDocTitle(doc)}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {getDocDescription(doc)}
                            </p>

                            {/* AI Extracted Metadata Tags */}
                            {aiData && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {aiData.crime_category && (
                                  <AIMetadataBadge type="category" label={aiData.crime_category} />
                                )}
                                {aiData.suspect_names && aiData.suspect_names.length > 0 && (
                                  aiData.suspect_names.map((name: string, idx: number) => (
                                    <AIMetadataBadge key={idx} type="suspect" label={`Suspect: ${name}`} />
                                  ))
                                )}
                                {aiData.location?.sector && (
                                  <AIMetadataBadge type="location" label={`Sector: ${aiData.location.sector}`} />
                                )}
                                {aiData.dates?.incident_date && (
                                  <AIMetadataBadge type="date" label={`Incident: ${aiData.dates.incident_date}`} />
                                )}
                                {aiData.bns_ipc_sections && aiData.bns_ipc_sections.length > 0 && (
                                  aiData.bns_ipc_sections.map((sec: string, idx: number) => (
                                    <AIMetadataBadge key={idx} type="section" label={sec} />
                                  ))
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                              <span>
                                Uploaded:{" "}
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                              <span>Doc ID: {doc.id.slice(0, 8)}...</span>
                            </div>
                          </div>

                          {/* Cryptographic Verification Flag & View Options */}
                          <div className="flex flex-col sm:items-end gap-3 min-w-50 pt-1">
                            {getVerificationStatus(doc) === "verified" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                <ShieldCheck
                                  size={16}
                                  className="text-emerald-600"
                                />
                                HASH VERIFIED (1)
                              </span>
                            ) : getVerificationStatus(doc) === "tampered" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800">
                                <ShieldAlert size={16} className="text-red-600" />
                                TAMPER WARNING (0)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                                <ShieldAlert
                                  size={16}
                                  className="text-slate-400"
                                />
                                VERIFICATION UNAVAILABLE
                              </span>
                            )}

                            <div className="flex items-center gap-3">
                              {/* VIEW PDF / DOCUMENT BUTTON */}
                              <button
                                type="button"
                                onClick={() => openDocumentViewer(doc)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#0f172a] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1e293b] transition shadow-sm"
                              >
                                <Eye size={14} />
                                View DETAILS & AI TAGS
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Document Detail & PDF Preview Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={() => {
            if (viewerUrl) URL.revokeObjectURL(viewerUrl);
            setViewerUrl(null);
            setSelectedDoc(null);
          }}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#0f172a] px-6 py-4 text-white">
              <div className="flex items-center gap-2 font-bold">
                <FileText size={18} />
                <span>Case & Document Audit Viewer</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (viewerUrl) URL.revokeObjectURL(viewerUrl);
                  setViewerUrl(null);
                  setSelectedDoc(null);
                }}
                className="text-slate-300 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                    {getCaseNumber(selectedDoc)}
                  </span>
                  <h3 className="text-xl font-bold text-[#0f172a]">
                    {getDocTitle(selectedDoc)}
                  </h3>
                </div>

                {getVerificationStatus(selectedDoc) === "verified" ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    <ShieldCheck size={14} /> Intact
                  </span>
                ) : getVerificationStatus(selectedDoc) === "tampered" ? (
                  <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">
                    <ShieldAlert size={14} /> Tampered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    <ShieldAlert size={14} /> Unverified
                  </span>
                )}
              </div>

              {/* Document Preview Frame */}
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                {viewerLoading ? (
                  <div className="p-12 text-center text-sm text-slate-500">
                    Loading PDF / Document Preview…
                  </div>
                ) : viewerUrl ? (
                  selectedDoc?.content_type?.includes("pdf") ||
                  selectedDoc?.file_name?.endsWith(".pdf") ? (
                    <div className="h-96 w-full">
                      <iframe
                        src={viewerUrl}
                        title={selectedDoc?.file_name || "Document Preview"}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : selectedDoc?.content_type?.startsWith("image") ? (
                    <div className="flex justify-center p-4">
                      <img
                        src={viewerUrl}
                        alt={selectedDoc?.file_name}
                        className="max-h-96 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        Preview not directly embeddable for this file type.
                      </p>
                      <a
                        href={viewerUrl}
                        download={selectedDoc.file_name || "document"}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] underline"
                      >
                        Download / View file locally
                      </a>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No physical file payload available in storage.
                  </div>
                )}
              </div>

              {/* Gemini AI Extracted Metadata Section */}
              {selectedDoc.metadata?.ai_extraction && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Gemini AI Extracted FIR Metadata & Tags</span>
                  </div>

                  {selectedDoc.metadata.ai_extraction.summary && (
                    <p className="text-xs text-amber-950 italic bg-amber-100/60 p-2.5 rounded border border-amber-200/60">
                      "{selectedDoc.metadata.ai_extraction.summary}"
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedDoc.metadata.ai_extraction.crime_category && (
                      <AIMetadataBadge type="category" label={selectedDoc.metadata.ai_extraction.crime_category} />
                    )}
                    {selectedDoc.metadata.ai_extraction.suspect_names?.map((name: string, i: number) => (
                      <AIMetadataBadge key={i} type="suspect" label={`Suspect: ${name}`} />
                    ))}
                    {selectedDoc.metadata.ai_extraction.location?.sector && (
                      <AIMetadataBadge type="location" label={`Sector: ${selectedDoc.metadata.ai_extraction.location.sector}`} />
                    )}
                    {selectedDoc.metadata.ai_extraction.location?.police_station && (
                      <AIMetadataBadge type="location" label={`PS: ${selectedDoc.metadata.ai_extraction.location.police_station}`} />
                    )}
                    {selectedDoc.metadata.ai_extraction.dates?.incident_date && (
                      <AIMetadataBadge type="date" label={`Incident Date: ${selectedDoc.metadata.ai_extraction.dates.incident_date}`} />
                    )}
                    {selectedDoc.metadata.ai_extraction.bns_ipc_sections?.map((sec: string, i: number) => (
                      <AIMetadataBadge key={i} type="section" label={sec} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Narrative / Content
                </label>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {getDocDescription(selectedDoc)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg border border-slate-200 p-3 bg-white">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <Hash size={12} />
                    <span>Document ID</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-800 truncate">
                      {selectedDoc.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedDoc.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3 bg-white">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <Calendar size={12} />
                    <span>Timestamp</span>
                  </div>
                  <span className="text-xs text-slate-800 font-medium">
                    {new Date(selectedDoc.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end bg-slate-50 px-6 py-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (viewerUrl) URL.revokeObjectURL(viewerUrl);
                  setViewerUrl(null);
                  setSelectedDoc(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#0f172a]">Log out?</h2>
            <p className="mt-2 text-sm text-slate-600">
              You'll need to sign in again to access the vault.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVault;