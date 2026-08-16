import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiMail, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setSuccess(response.data.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Glow Elements */}
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-purple-200/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Back Button */}
      <Link to="/login" className="absolute top-8 left-8 flex items-center text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors duration-200">
        <FiArrowLeft className="mr-2" /> Back to Login
      </Link>

      <div className="w-full max-w-md bg-white border border-zinc-200 p-8 rounded-3xl shadow-xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <span className="font-extrabold text-lg tracking-wider text-white">RAG</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Recover Password</h2>
          <p className="text-sm text-zinc-500 mt-1">We'll send recovery details to your inbox</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-3">
            <FiAlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success ? (
          <div className="space-y-6">
            <div className="px-4 py-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex items-start gap-3">
              <FiCheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Request Submitted</p>
                <p className="leading-relaxed text-zinc-600">{success}</p>
              </div>
            </div>
            <Link
              to="/login"
              className="w-full h-11 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition-all duration-200 glow-hover"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 tracking-wide uppercase">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <FiMail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="enter your account email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm text-zinc-900 bg-white border border-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 glow-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Send Recovery Email'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
