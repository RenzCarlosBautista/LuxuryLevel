// app/admin/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    } catch (err) {
      setError('A network error occurred. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-slate-200/50 blur-[120px]"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-slate-200/50 blur-[120px]"></div>
        </div>

        <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative z-10 animate-slide-up">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
              <AlertCircle size={32} className="text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
            <p className="text-slate-600 text-sm mb-8">
              The reset link is missing or invalid. Please request a new one.
            </p>
            <Link
              href="/admin/forgot-password"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-slate-200/50 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-slate-200/50 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative z-10 animate-slide-up">
        
        {!submitted ? (
          <>
            {/* Back Link */}
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <Lock size={32} className="text-slate-800" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Create New Password
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                Enter a new password for your account.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-rose-800">Error</h3>
                  <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    required
                    suppressHydrationWarning
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium transition-all outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    suppressHydrationWarning
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Minimum 8 characters</p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    required
                    suppressHydrationWarning
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium transition-all outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    suppressHydrationWarning
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-bold py-4 px-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <CheckCircle2 size={32} className="text-green-600" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Password Reset Successfully
              </h2>
              <p className="text-slate-600 text-sm mb-2">
                Your password has been updated.
              </p>
              <p className="text-slate-500 text-xs">
                Redirecting to login page in a few seconds...
              </p>

              {/* Action Button */}
              <div className="mt-8 w-full">
                <Link
                  href="/admin/login"
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)]"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
