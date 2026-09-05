import { useContext, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';


const navItems = [
  { label: 'Admin Dashboard', active: true },
  { label: 'Audit Trail' },
  { label: 'Document Vault' },
  { label: 'Access Requests' },
];

const stats = [
  { label: 'Total Documents', value: '0' },
  { label: 'Verified', value: '0' },
  { label: 'Alerts', value: '0' },
];

const documentRows:any = [
  
];

const Home = () => {
  const auth = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleLogout = () => {
    if (auth) {
      auth.logout();
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedCategory('');
    setSelectedFile(null);
    setIsDragging(false);
    setUploadStatus('idle');
    setIsUploading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    setSelectedFile(file);
    setUploadStatus('idle');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedCategory) {
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    window.setTimeout(() => {
      setUploadStatus('success');
      setIsUploading(false);
      window.setTimeout(() => {
        closeUploadModal();
      }, 900);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-65 flex-col border-r border-slate-300 bg-[#e7edf5] lg:flex">
          <div className="px-5 py-4">
            <div className="text-[2rem] font-semibold tracking-tight text-slate-800">LegalIntegrity CMS</div>
          </div>

          <div className="px-4 py-4">
            <div className="mb-3 text-sm font-medium text-slate-500">Case Control</div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={[
                    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium transition',
                    item.active
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200/80',
                  ].join(' ')}
                >
                  <span className="flex h-5 w-5 items-center justify-center text-sm">
                    {item.active ? '▣' : '▢'}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-300 bg-[#e7edf5] p-4">
            <div className="space-y-2">
              <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-200/80">
                <span>⚙</span>
                <span>Settings</span>
              </button>
              <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-200/80">
                <span>?</span>
                <span>Support</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-300 bg-[#f4f6f9] px-5 lg:px-8">
            <div className="text-xl font-semibold text-slate-700">Administrator Control</div>
            <div className="flex items-center gap-4 text-slate-700">
              
              <button type="button" aria-label="notifications" className="text-xl">◌</button>
              <Link to="/profile" aria-label="profile" className="text-xl">◔</Link>
              <button type="button" aria-label="logout" onClick={handleLogout} className="text-xl">↗</button>
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
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  + Upload Document
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-5 py-4 shadow-sm"
                >
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{stat.label}</div>
                    <div className="mt-3 text-4xl font-semibold text-slate-800">{stat.value}</div>
                  </div>
                  {index < 2 && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600">
                      {index === 0 ? '▣' : '◌'}
                    </div>
                  )}
                  {index === 2 && (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-lg text-red-500">⚠</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-[1.65rem] font-semibold text-slate-900">Document Vault Overview</h2>
                <div className="flex items-center gap-2 text-slate-500">
                  <button type="button" className="text-xl">☰</button>
                  <button type="button" className="text-xl">⋮</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-5 py-3 text-sm font-semibold">Document Name</th>
                      <th className="px-5 py-3 text-sm font-semibold">Type</th>
                      <th className="px-5 py-3 text-sm font-semibold">Date Added</th>
                      <th className="px-5 py-3 text-sm font-semibold">Integrity Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentRows.map((row:any) => (
                      <tr key={row.name} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-5 py-4 text-sm font-medium text-slate-800">{row.name}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{row.type}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{row.date}</td>
                        <td className="px-5 py-4">
                          <span
                            className={[
                              'inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-medium',
                              row.status === 'Verified'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-sky-200 bg-sky-50 text-sky-700',
                            ].join(' ')}
                          >
                            <span className="h-2.5 w-2.5 rounded-full border border-current bg-current/85" />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

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
              <button type="button" onClick={closeUploadModal} className="text-3xl text-slate-600 hover:text-slate-900">
                ×
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Document Classification</label>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                >
                  <option value="">Select Category...</option>
                  <option value="Forensics">Forensics</option>
                  <option value="Evidence">Evidence</option>
                  <option value="Testimony">Testimony</option>
                  <option value="Legal">Legal</option>
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
                  'cursor-pointer rounded-xl border-2 border-dashed bg-white px-4 py-10 text-center transition',
                  isDragging ? 'border-slate-600 bg-slate-100' : 'border-slate-300',
                ].join(' ')}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleInputChange}
                />

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-3xl text-slate-500">☁</div>

                <div className="mt-4 text-2xl font-semibold text-slate-700">{selectedFile ? selectedFile.name : 'Drag & Drop file here'}</div>
                <div className="mt-2 text-base text-slate-500">or click to browse from local system</div>
                <div className="mt-4 inline-flex rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Supported: PDF, DOCX, TXT (Max 50MB)
                </div>
              </div>

              {uploadStatus === 'error' && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Please select a file and a category before uploading.
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Document uploaded successfully.
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
                  {isUploading ? 'Uploading...' : 'Initialize Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;