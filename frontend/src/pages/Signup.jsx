import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Signup() {
  const [name, setName]                           = useState('');
  const [email, setEmail]                         = useState('');
  const [password, setPassword]                   = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError]                         = useState('');
  const [loading, setLoading]                     = useState(false);

  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched]         = useState({ name: false, email: false, password: false, confirmPassword: false });

  const { signup } = useContext(AuthContext);
  const navigate   = useNavigate();

  /* ─── Validators ─── */
  const validateName = (val) => {
    if (!val.trim()) return 'Full name is required.';
    if (!/^[A-Za-z\s]+$/.test(val)) return 'Name must contain letters only (no numbers or symbols).';
    if (val.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address (e.g. john@example.com).';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Za-z]/.test(val)) return 'Password must contain at least one letter.';
    return '';
  };

  const validateConfirmPassword = (val, pwd = password) => {
    if (!val) return 'Please confirm your password.';
    if (val !== pwd) return 'Passwords do not match.';
    return '';
  };

  const validate = () => ({
    name:            validateName(name),
    email:           validateEmail(email),
    password:        validatePassword(password),
    confirmPassword: validateConfirmPassword(confirmPassword),
  });

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errs = validate();
    setFieldErrors(prev => ({ ...prev, [field]: errs[field] }));
  };

  const handleChange = (field, value) => {
    if (field === 'name')            setName(value);
    if (field === 'email')           setEmail(value);
    if (field === 'password')        setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);

    if (touched[field]) {
      // Re-validate this field live
      let err = '';
      if (field === 'name')            err = validateName(value);
      if (field === 'email')           err = validateEmail(value);
      if (field === 'password') {
        err = validatePassword(value);
        // Also re-validate confirm if already touched
        if (touched.confirmPassword) {
          setFieldErrors(prev => ({
            ...prev,
            password: err,
            confirmPassword: validateConfirmPassword(confirmPassword, value),
          }));
          return;
        }
      }
      if (field === 'confirmPassword') err = validateConfirmPassword(value, password);
      setFieldErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  /* ─── Name: block non-alpha keystrokes ─── */
  const handleNameKeyDown = (e) => {
    const allowed = /^[A-Za-z\s]$/;
    const control = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter','Home','End'];
    if (!allowed.test(e.key) && !control.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errs = validate();
    setFieldErrors(errs);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (errs.name || errs.email || errs.password || errs.confirmPassword) return;

    setLoading(true);
    const result = await signup(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  /* ─── Dynamic border classes ─── */
  const inputClass = (field, hasRightIcon = false) =>
    `w-full h-11 pl-10 ${hasRightIcon ? 'pr-10' : 'pr-4'} rounded-xl text-sm text-zinc-900 bg-white border transition-all shadow-sm focus:outline-none focus:ring-1 ${
      touched[field] && fieldErrors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
        : touched[field] && !fieldErrors[field]
        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
        : 'border-zinc-200 focus:border-indigo-500 focus:ring-indigo-500/20'
    }`;

  /* ─── Inline error message ─── */
  const FieldError = ({ field }) =>
    touched[field] && fieldErrors[field] ? (
      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
        <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-purple-200/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-200/20 rounded-full blur-[140px] pointer-events-none"></div>

      <Link to="/" className="absolute top-8 left-8 flex items-center text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors duration-200">
        <FiArrowLeft className="mr-2" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-white border border-zinc-200 p-8 rounded-3xl shadow-xl relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <span className="font-extrabold text-lg tracking-wider text-white">RAG</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Create Account</h2>
          <p className="text-sm text-zinc-500 mt-1">Get started with RAG PDF Assistant</p>
        </div>

        {/* Required fields note */}
        <p className="text-[11px] text-zinc-400 mb-4">
          Fields marked with <span className="text-red-500 font-bold">*</span> are required.
        </p>

        {/* Server error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-3">
            <FiAlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* ── Full Name ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 tracking-wide uppercase">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                <FiUser className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                onKeyDown={handleNameKeyDown}
                disabled={loading}
                maxLength={60}
                className={inputClass('name')}
              />
            </div>
            <FieldError field="name" />
            {touched.name && !fieldErrors.name && (
              <p className="text-[11px] text-zinc-400 mt-0.5">Only letters and spaces allowed.</p>
            )}
          </div>

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
                placeholder="john@example.com"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                disabled={loading}
                className={inputClass('email')}
              />
            </div>
            <FieldError field="email" />
          </div>

          {/* ── Password ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 tracking-wide uppercase">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                <FiLock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={loading}
                className={inputClass('password', true)}
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
            <FieldError field="password" />
            {!fieldErrors.password && !touched.password && (
              <p className="text-[11px] text-zinc-400 mt-0.5">Must be at least 6 characters with at least one letter.</p>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 tracking-wide uppercase">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                <FiLock className="h-4 w-4" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                disabled={loading}
                className={inputClass('confirmPassword', true)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-indigo-600 transition-colors cursor-pointer"
                tabIndex={-1}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError field="confirmPassword" />
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 glow-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
