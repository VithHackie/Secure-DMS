import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Bell, User, LogOut, ShieldAlert, FileText, Search, KeyRound, PlusCircle, Download } from "lucide-react";
import Sidebar from "../components/Sidebar";

interface AuditLogItem {
  id: string;
  action: string;
  user_id: string | null;
  case_id: string | null;
  document_id: string | null;
  ip_address: string;
  details: any;
  created_at: string;
}

const AuditLogs = () => {
  const auth = useContext(AuthContext);
  const [logsList, setLogsList] = useState<AuditLogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const base =
        (import.meta as any)?.env?.VITE_API_BASE_URL ?? "http://localhost:8080";

      const response = await fetch(`${base}/audit-logs`, {
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      });
      const data = await response.json();

      if (response.ok) {
        setLogsList(data);
        setFilteredLogs(data);
      } else {
        console.error("Backend Error:", data.error);
      }
    } catch (error) {
      console.error("Network error while fetching audit logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (selectedFilter === "ALL") {
      setFilteredLogs(logsList);
    } else {
      setFilteredLogs(logsList.filter((log) => log.action === selectedFilter));
    }
  }, [selectedFilter, logsList]);

  const handleLogout = () => {
    if (auth) {
      auth.logout();
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No audit logs to export.");
      return;
    }

    const headers = ["Log ID", "Action", "Timestamp", "User ID", "Case ID", "Document ID", "IP Address", "Details"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.action,
      new Date(l.created_at).toISOString(),
      l.user_id || "N/A",
      l.case_id || "N/A",
      l.document_id || "N/A",
      l.ip_address || "N/A",
      JSON.stringify(l.details || {}).replace(/"/g, '""'),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_audit_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "TAMPER_DETECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-red-700">
            <ShieldAlert size={14} /> Tamper Detected
          </span>
        );
      case "UPLOAD_DOC":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
            <FileText size={14} /> Upload Doc
          </span>
        );
      case "CASE_CREATED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-700">
            <PlusCircle size={14} /> Case Created
          </span>
        );
      case "VAULT_SEARCH":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-indigo-700">
            <Search size={14} /> Vault Search
          </span>
        );
      case "VIEW_DOC":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-purple-700">
            <Download size={14} /> View Doc
          </span>
        );
      case "LOGIN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
            <KeyRound size={14} /> Login
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <div className="flex min-h-screen">
        {/* Reusable Sidebar with activeTab set to audit-logs */}
        <Sidebar activeTab="audit" />

        <main className="flex-1">
          {/* Header matching Home.tsx */}
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
                  System Audit Logs & Compliance.
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Immutable record of all cryptographic ledger events and user actions.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Export Report (.csv)
                </button>
              </div>
            </div>

            {/* Filters & Controls */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Filter Action:</span>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500"
                >
                  <option value="ALL">All System Actions</option>
                  <option value="LOGIN">User Logins</option>
                  <option value="UPLOAD_DOC">Document Uploads</option>
                  <option value="CASE_CREATED">Cases Created</option>
                  <option value="VAULT_SEARCH">Vault Searches</option>
                  <option value="VIEW_DOC">Document Views</option>
                  <option value="TAMPER_DETECTED">Security Alerts (Tamper)</option>
                </select>
              </div>
              <div className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-800">{filteredLogs.length}</span> entries
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="space-y-4">
              {isLoadingLogs ? (
                <div className="rounded-xl border border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
                  Loading audit logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="rounded-xl border border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
                  No system activities found matching this filter criteria.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-2">
                      <div>{getActionBadge(log.action)}</div>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600">
                      {log.user_id && (
                        <div>
                          <span className="text-slate-400 block font-medium">User ID</span>
                          <span className="font-mono text-slate-800 break-all">{log.user_id}</span>
                        </div>
                      )}
                      {log.case_id && (
                        <div>
                          <span className="text-slate-400 block font-medium">Case ID</span>
                          <span className="font-mono text-slate-800 break-all">{log.case_id}</span>
                        </div>
                      )}
                      {log.document_id && (
                        <div>
                          <span className="text-slate-400 block font-medium">Doc ID</span>
                          <span className="font-mono text-slate-800 break-all">{log.document_id}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block font-medium">IP Address</span>
                        <span className="font-mono text-slate-800">{log.ip_address || "System"}</span>
                      </div>
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 block mb-1">Context Payload:</span>
                        <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-xs overflow-x-auto shadow-inner">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
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

export default AuditLogs;