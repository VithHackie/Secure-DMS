import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
  const auth = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Save token to global context. PublicRoute wrapper will redirect to "/"
      if (auth && data.token) {
        auth.login(data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 lg:p-16">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* Left Section - Header */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-900">Welcome Back</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h1>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
            Access the secure Digital Document Management System.
          </p>
        </div>

        {/* Right Section - Form */}
        <div className="bg-[#f4f4f5] p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

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
                className="w-full bg-white border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black transition"
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-md px-3.5 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-black transition"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white px-5 py-2.5 rounded-md font-semibold text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{' '}
              <Link to="/reg" className="text-black font-semibold hover:underline">
                Register here
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;