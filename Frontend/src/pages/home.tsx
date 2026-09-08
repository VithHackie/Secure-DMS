import {
  useContext,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  useEffect,
} from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Bell, User, LogOut, House, FileText, Archive } from "lucide-react";
import CreateCaseModal from "../components/createCaseModal";

const navItems = [
  { label: "Admin Dashboard", active: true, icon: House },
  { label: "Document Vault", icon: Archive },
  { label: "Audit Trail", icon: FileText },
];


const Home = () => {
  const auth = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [casesList, setCasesList] = useState<any[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false); // 2. State for Create Case modal

  // Form & Upload States
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [caseIdInput, setCaseIdInput] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // 2. Define the fetch function
  const fetchCases = async () => {
    try {
      setIsLoadingCases(true);
      const base =
        (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";

      const response = await fetch(`${base}/cases`);
      const data = await response.json();

      if (response.ok) {
        setCasesList(data);
      } else {
        console.error("Backend Error:", data.error);
      }
    } catch (error) {
      console.error("Network error while fetching cases:", error);
    } finally {
      setIsLoadingCases(false);
    }
  };

  // 3. Trigger the fetch on component mount
  useEffect(() => {
    fetchCases();
  }, []);

  const handleLogout = () => {
    if (auth) {
      auth.logout();
    }
  };

  const uuidv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  const openUploadModal = () => {
    const id =
      typeof crypto !== "undefined" &&
      typeof (crypto as any).randomUUID === "function"
        ? (crypto as any).randomUUID()
        : uuidv4();
    setCaseIdInput(id);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedCategory("");
    setSelectedFile(null);
    setIsDragging(false);
    setUploadStatus("idle");
    setIsUploading(false);
    setCaseIdInput("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    setSelectedFile(file);
    setUploadStatus("idle");
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const decodeUserIdFromToken = (token: string | null): string | null => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = parts[1];
      const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
      let json = "";
      if (typeof globalThis.atob === "function") {
        json = globalThis.atob(padded);
      } else {
        return null;
      }
      const obj = JSON.parse(json);
      return obj.id ?? null;
    } catch (e) {
      return null;
    }
  };

  const token = auth?.token ?? null;
  const currentUserId = decodeUserIdFromToken(token);

  const handleUpload = async () => {
    setUploadMessage("");

    if (!selectedFile || !selectedCategory) {
      setUploadStatus("error");
      setUploadMessage("Please select a file and a category before uploading.");
      return;
    }

    const caseId = caseIdInput?.trim();
    if (!caseId) {
      setUploadStatus("error");
      setUploadMessage(
        "Please enter a Case ID to associate this document with.",
      );
      return;
    }

    setIsUploading(true);
    setUploadStatus("idle");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("caseId", caseId);
      formData.append("docType", selectedCategory);

      if (currentUserId) formData.append("uploaderId", currentUserId);

      const base =
        (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";

      const res = await fetch(`${base}/upload`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errMsg = data?.error || data?.message || "Upload failed";
        setUploadStatus("error");
        setUploadMessage(errMsg);
        return;
      }

      setUploadStatus("success");
      setUploadMessage(data?.message || "Document uploaded successfully.");
      window.setTimeout(() => {
        closeUploadModal();
      }, 900);
    } catch (error: any) {
      setUploadStatus("error");
      setUploadMessage(error?.message || "Network error during upload");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Callback when a case is created successfully
  const handleCaseCreated = (newCaseData: any) => {
    console.log("Case successfully generated:", newCaseData);
    // Optionally pre-fill the upload modal with the created case ID and open it directly
    const createdId = newCaseData?.case?.id || newCaseData?.id;
    if (createdId) {
      setCaseIdInput(createdId);
      setShowUploadModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-65 flex-col border-r border-slate-300 bg-[#e7edf5] lg:flex">
          <div className="px-5 py-4">
            <div className="text-[2rem] font-semibold tracking-tight text-slate-800">
              LegalIntegrity CMS
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="mb-3 text-sm font-medium text-slate-500">
              Case Control
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium transition",
                    item.active
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-200/80",
                  ].join(" ")}
                >
                    <span className="flex h-5 w-5 items-center justify-center text-sm">
                      {item.icon ? (
                        <item.icon className={item.active ? 'h-5 w-5 text-white' : 'h-5 w-5 text-slate-600'} />
                      ) : (
                        item.active ? "▣" : "▢"
                      )}
                    </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-300 bg-[#e7edf5] p-4">
            <div className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-200/80"
              >
                <span>⚙</span>
                <span>Settings</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-200/80"
              >
                <span>?</span>
                <span>Support</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-300 bg-[#f4f6f9] px-5 lg:px-8">
            <div className="text-xl font-semibold text-slate-700">
              Administrator Control
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <button
                type="button"
                aria-label="notifications"
                className="flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <Bell size={16} />
              </button>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <User size={16} />
                Profile
              </Link>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          </header>

          <div className="p-5 lg:p-8">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-[2.25rem]">
                  Cases And Related Investigative Documents.
                </h1>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Generate Report
                </button>
                {/* 4. Separated target click handler for + Create Case */}
                <button
                  type="button"
                  onClick={() => setShowCreateCaseModal(true)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  + Create Case
                </button>
                <button
                  type="button"
                  onClick={openUploadModal}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  + Upload Document
                </button>
              </div>
            </div>


            <div className="mt-8 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-[1.65rem] font-semibold text-slate-900">
                  Cases Overview
                </h2>
                <div className="flex items-center gap-2 text-slate-500"></div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-5 py-3 text-sm font-semibold">
                        Case Number
                      </th>
                      <th className="px-5 py-3 text-sm font-semibold">
                        Title / Subject
                      </th>
                      <th className="px-5 py-3 text-sm font-semibold">
                        Status
                      </th>
                      <th className="px-5 py-3 text-sm font-semibold">
                        Date Registered
                      </th>
                      <th className="px-5 py-3 text-sm font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingCases ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-sm text-slate-500"
                        >
                          Loading cases...
                        </td>
                      </tr>
                    ) : casesList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-sm text-slate-500"
                        >
                          No cases found. Create a new case to get started.
                        </td>
                      </tr>
                    ) : (
                      casesList.map((caseItem: any) => (
                        <tr
                          key={caseItem.id}
                          className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition"
                        >
                          <td className="px-5 py-4 text-sm font-medium text-slate-800">
                            {caseItem.case_number}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {caseItem.title}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={[
                                "inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium uppercase tracking-wide",
                                caseItem.status === "closed"
                                  ? "border-slate-200 bg-slate-100 text-slate-600"
                                  : caseItem.status === "under_investigation"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
                              ].join(" ")}
                            >
                              {caseItem.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {new Date(caseItem.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            {/* Future implementation: Navigate to dynamic case route using caseItem.id */}
                            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
                              View Related Details →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 5. Render CreateCaseModal */}
      <CreateCaseModal
        isOpen={showCreateCaseModal}
        onClose={() => setShowCreateCaseModal(false)}
        onSuccess={handleCaseCreated}
        currentUser={{ id: currentUserId }}
      />

      {/* Existing Upload Document Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-700/50 px-4"
          onClick={closeUploadModal}
        >
          <div
            className="w-full max-w-180 rounded-xl border border-slate-300 bg-[#f2f3f1] p-0 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-300 bg-[#f7f7f6] px-5 py-4">
              <div className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                <span className="text-xl">▣</span>
                <span>Secure Document Upload</span>
              </div>
              <button
                type="button"
                onClick={closeUploadModal}
                className="text-3xl text-slate-600 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Case ID
                </label>
                <input
                  value={caseIdInput}
                  onChange={(e) => setCaseIdInput(e.target.value)}
                  placeholder="Enter or paste existing Case UUID"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Document Classification
                </label>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                >
                  <option value="">Select Category...</option>
                  <option value="fir">FIR</option>
                  <option value="charge_sheet">Charge Sheet</option>
                  <option value="evidence">Evidence</option>
                  <option value="witness_statement">Witness Statement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={[
                  "cursor-pointer rounded-xl border-2 border-dashed bg-white px-4 py-10 text-center transition",
                  isDragging
                    ? "border-slate-600 bg-slate-100"
                    : "border-slate-300",
                ].join(" ")}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleInputChange}
                />

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-3xl text-slate-500">
                  ☁
                </div>

                <div className="mt-4 text-2xl font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : "Drag & Drop file here"}
                </div>
                <div className="mt-2 text-base text-slate-500">
                  or click to browse from local system
                </div>
                <div className="mt-4 inline-flex rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Supported: PDF, DOCX, TXT (Max 50MB)
                </div>
              </div>

              {uploadStatus === "error" && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {uploadMessage ??
                    "Please select a file and a category before uploading."}
                </div>
              )}

              {uploadStatus === "success" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {uploadMessage ?? "Document uploaded successfully."}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUploading || !selectedFile || !selectedCategory}
                  onClick={handleUpload}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isUploading ? "Uploading..." : "Initialize Upload"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-700/50 px-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-300 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Log out?</h2>
            <p className="mt-2 text-sm text-slate-600">
              You'll need to sign in again to access the dashboard.
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

export default Home;
