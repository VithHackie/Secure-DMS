import { useState } from 'react';

const CreateCaseModal = ({ isOpen, onClose, onSuccess, currentUser, officers = [] }: any) => {
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: '',
    status: 'open',
    assignedOfficerId: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!formData.caseNumber.trim() || !formData.title.trim()) {
      setError('Case Number and Case Title are required fields.');
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        case_number: formData.caseNumber.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        assigned_officer_id: formData.assignedOfficerId || null,
        created_by: currentUser?.id || null, 
      };

      const response = await fetch('http://localhost:8080/case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create case');
      }

      setFormData({
        caseNumber: '',
        title: '',
        description: '',
        status: 'open',
        assignedOfficerId: '',
      });

      const newId = data?.case?.id || data?.id || null;
      setCreatedCaseId(newId);
      if (onSuccess) onSuccess(data);
      // don't immediately close - show generated UUID to the user
    } catch (err: any) {
      console.error('Create Case Error:', err);
      setError(err.message || 'An error occurred while creating the case.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-700/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-slate-300 bg-[#f2f3f1] p-0 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header - Aligned with Secure Document Upload modal */}
        <div className="flex items-center justify-between border-b border-slate-300 bg-[#f7f7f6] px-5 py-4">
          <div className="flex items-center gap-3 text-2xl font-bold text-slate-900">
            <span className="text-xl">▣</span>
            <span>Create New Case</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-3xl text-slate-600 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {createdCaseId ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Case successfully created. Database ID:
                <div className="mt-2 break-all font-mono text-sm text-slate-800">{createdCaseId}</div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    // Close modal; parent `onSuccess` already received the case data and may open upload modal
                    onClose();
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Close modal and let parent open upload modal (onSuccess already invoked)
                    onClose();
                  }}
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400 transition"
                >
                  Start Upload for This Case
                </button>
              </div>
            </div>
          ) : (

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Case Number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Case Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="caseNumber"
                  placeholder="e.g. FIR-2026-0091"
                  value={formData.caseNumber}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                >
                  <option value="open">Open</option>
                  <option value="under_investigation">Under Investigation</option>
                  <option value="archived">Archived</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Case Title / Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g. State vs. Crime Record Analysis"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
              />
            </div>

            {/* Assigned Officer */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Assigned Officer ID (UUID)
              </label>
              {officers.length > 0 ? (
                <select
                  name="assignedOfficerId"
                  value={formData.assignedOfficerId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                >
                  <option value="">-- Select Officer --</option>
                  {officers.map((officer: any) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.badge_number || officer.id.slice(0, 8)})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="assignedOfficerId"
                  placeholder="Paste User UUID (Optional)"
                  value={formData.assignedOfficerId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
                />
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Case Description</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Provide context or summary regarding the case..."
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-700 outline-none ring-0 transition focus:border-slate-500"
              />
            </div>

            {/* Actions - Aligned with upload modal buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400 transition"
              >
                {isLoading ? 'Creating...' : 'Create Case Record'}
              </button>
            </div>
          </form>
          )}
       </div>
      </div>
    </div>
  );
};

export default CreateCaseModal;