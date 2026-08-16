import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  // Per-field validation errors (shown after blur)
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [touched, setTouched]         = useState({ email: false, password: false });

  const { login }       = useContext(AuthContext);
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  /* ─── Validators ─── */
  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address (e.g. you@example.com).';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const validate = () => ({
    email:    validateEmail(email),
    password: validatePassword(password),
  });

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validate();
    setFieldErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const handleChange = (field, value) => {
    if (field === 'email')    setEmail(value);
    if (field === 'password') setPassword(value);

    if (touched[field]) {
      const errs = validate();
      setFieldErrors(prev => ({ ...prev, [field]: errs[field] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errs = validate();
    setFieldErrors(errs);
    setTouched({ email: true, password: true });

    if (errs.email || errs.password) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  /* ─── Shared input border style ─── */
  const inputClass = (field) =>
    `w-full h-11 pl-10 pr-10 rounded-xl text-sm text-zinc-900 bg-white border transition-all shadow-sm focus:outline-none focus:ring-1 ${
      touched[field] && fieldErrors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
        : touched[field] && !fieldErrors[field]
        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
        : 'border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20'
    }`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-purple-200/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none"></div>

      <Link to="/" className="absolute top-8 left-8 flex items-center text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors duration-200">
        <FiArrowLeft className="mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-white border border-zinc-200/80 p-8 rounded-3xl shadow-xl relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <span className="font-extrabold text-lg tracking-wider text-white">RAG</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome Back</h2>
          <p className="text-sm text-zinc-500 mt-1">Log in to manage your documents</p>
        </div>

        {/* Server error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-3">
            <FiAlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* ── Email ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 tracking-wide uppercase">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                <FiMail className="h-4 w-4" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                disabled={loading}
                className={inputClass('email')}
              />
            </div>
            {touched.email && fieldErrors.email && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {fieldErrors.email}
              </p>
            )}
          </div>

          {/* ── Password ── */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-500 tracking-wide uppercase">
                Password <span className="text-red-500">*</span>
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                <FiLock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={loading}
                className={inputClass('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-indigo-600 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {fieldErrors.password}
              </p>
            )}
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 glow-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 mt-8">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
