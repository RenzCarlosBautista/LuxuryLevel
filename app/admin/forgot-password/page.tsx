'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Lock, KeyRound, KeySquare } from 'lucide-react';

export default function ForgotPasswordFlow() {
  const router = useRouter();
  
  // States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: Code+Password, 3: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Send Code to Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send code');
        setLoading(false);
        return;
      }

      setStep(2); // Proceed to OTP step
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid code or failed to reset');
        setLoading(false);
        return;
      }

      setStep(3); // Success Screen
      setTimeout(() => router.push('/admin/login'), 3000);
    } catch (err) {
      setError('A network error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-slate-200/50 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative z-10 animate-slide-up">
        
        {/* Step 1: Email Form */}
        {step === 1 && (
          <div className="animate-fade-in">
            <Link href="/admin/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </Link>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-5">
                <Mail size={32} className="text-slate-800" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
              <p className="text-slate-500 text-sm mt-2">Enter your email to receive a 6-digit code.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-800 mt-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900/10 outline-none"
                  placeholder="admin@example.com"
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-slate-800 transition-colors">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : 'Send Code'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Enter Code & New Password */}
        {step === 2 && (
          <div className="animate-fade-in">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium mb-6 transition-colors">
              <ArrowLeft size={16} /> Wrong email?
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-5">
                <KeySquare size={32} className="text-slate-800" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Enter Code</h1>
              <p className="text-slate-500 text-sm mt-2">We sent a 6-digit code to <span className="font-bold text-slate-900">{email}</span></p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-800 mt-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/[^0-9]/g, '')); setError(''); }}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-bold tracking-[0.25em] focus:ring-2 focus:ring-slate-900/10 outline-none"
                  placeholder="000000"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2">New Password</label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900/10 outline-none"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900/10 outline-none"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || code.length !== 6} className="w-full mt-2 bg-slate-900 text-white py-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-slate-800 disabled:bg-slate-400 transition-colors">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 3 && (
          <div className="animate-fade-in text-center py-8">
            <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-green-600" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Updated!</h2>
            <p className="text-slate-600 text-sm mb-8">Your password has been changed successfully.</p>
            <p className="text-slate-400 text-xs uppercase tracking-widest animate-pulse">Redirecting to login...</p>
          </div>
        )}

      </div>
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}