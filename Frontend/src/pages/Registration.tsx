import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Registration = () => {
  const auth = useContext(AuthContext);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'admin',
    badgeNumber: '',
    department: 'Engineering',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save token in global context. PublicRoute will automatically redirect to "/"
      if (auth && data.token) {
        auth.login(data.token,data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 lg:p-16">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* Left Section - Header & Info */}
        <div className="lg:col-span-5 space-y-4 pt-2">
          <p className="text-sm font-semibold text-gray-900">Registration</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
            Fill in your details to get secure access. Your role, badge number, and department determine the access you're granted.
          </p>
        </div>

        {/* Right Section - Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-5 max-w-md lg:max-w-lg">
            
            {/* Error Message Display */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                placeholder="Jane Doe"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-[#f4f4f5] border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#f4f4f5] border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter a strong password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#f4f4f5] border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
              />
              <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-900 mb-1.5">
                Role
              </label>
              <div className="relative">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-[#f4f4f5] border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition cursor-pointer pr-10"
                >
                  <option value="admin">Administrator</option>
                  <option value="investigating_officer">Investigating Officer</option>
                  <option value="court_clerk">Court Clerk</option>
                  <option value="judge">Judge</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Badge Number */}
            <div>
              <label htmlFor="badgeNumber" className="block text-sm font-medium text-gray-900 mb-1.5">
                Badge Number
              </label>
              <input
                type="text"
                id="badgeNumber"
                name="badgeNumber"
                required
                placeholder="e.g. 10234"
                value={formData.badgeNumber}
                onChange={handleChange}
                className="w-full bg-[#f4f4f5] border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-900 mb-1.5">
                Department
              </label>
              <div className="relative">
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-[#f4f4f5] border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition cursor-pointer pr-10"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Cyber Crime">Cyber Crime</option>
                  <option value="Forensics">Forensics</option>
                  <option value="Administration">Administration</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed pt-1">
              Already Registered ! <a className="font-medium"href="/login">Login Here</a>
            </p>
            <p className="text-xs text-gray-600 leading-relaxed pt-1">
              Your information is encrypted and stored securely. By registering you agree to our Privacy Policy.
            </p>

          </form>
        </div>

      </div>
    </div>
  );
};

export default Registration;