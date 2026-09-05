import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = auth?.user;

  const handleLogout = () => {
    auth?.logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef2f7]">
        <p className="text-slate-600">No user data available. Please sign in again.</p>
      </div>
    );
  }

  const fields = [
    { label: 'Full Name', value: user.fullName },
    { label: 'Email', value: user.email },
    { label: 'Role', value: user.role },
    { label: 'Department', value: user.department },
  ];

  return (
    <div className="min-h-screen bg-[#eef2f7] p-5 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
          <div className="flex items-center gap-2">
            <Link
            to="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
            >
              Back to Dashboard
            </Link>
            <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
            >
            Log out
            </button>
          </div>  
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
              {user.fullName
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-semibold text-slate-900">{user.fullName}</div>
              <div className="text-sm text-slate-500">{user.email}</div>
            </div>
          </div>

          <dl>
            {fields.map((field, index) => (
              <div
                key={field.label}
                className={[
                  'flex items-center justify-between px-6 py-4',
                  index < fields.length - 1 ? 'border-b border-slate-100' : '',
                ].join(' ')}
              >
                <dt className="text-sm font-medium text-slate-500">{field.label}</dt>
                <dd className="text-sm font-medium text-slate-900">{field.value || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

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

export default Profile;
