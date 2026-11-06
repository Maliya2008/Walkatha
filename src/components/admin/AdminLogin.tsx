import React, { useState } from 'react';
import { BookOpen, Lock, Mail, Eye, EyeOff, KeyRound, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types/admin';

interface AdminLoginProps {
  onSuccess: (user: User) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToSite }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password reset modal state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both your administrator email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.login(email.trim(), password, remember);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or server connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetStatus('loading');
    try {
      const result = await authService.requestPasswordReset(resetEmail.trim());
      setResetStatus('success');
      setResetMessage(result.message);
    } catch (err: any) {
      setResetStatus('error');
      setResetMessage(err.message || 'Failed to process request.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#070e1e] text-white selection:bg-rose-600 selection:text-white">
      {/* Return to public site link */}
      <div className="absolute top-6 left-6">
        <button
          type="button"
          onClick={onBackToSite}
          className="flex items-center gap-2 text-xs font-medium text-white transition-colors px-3 py-2 rounded-lg bg-[#0b1633] border border-[#16264c] hover:bg-[#111f44] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Story Website</span>
        </button>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/25 mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white font-serif">
            Walkathawa <span className="text-rose-400 font-sans text-xl">(වල් කතාව)</span>
          </h2>
          <p className="mt-2 text-xs text-blue-200/80">
            Secure administrative access for managing Sinhala stories, SEO, and ad monetization
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-[#0a142c] backdrop-blur-md rounded-2xl p-8 border border-[#182a55] shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-white mb-1.5 uppercase tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@walkathawa.site"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#070e1e] border border-[#16264c] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password" className="block text-xs font-semibold text-white uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetOpen(true);
                    setResetStatus('idle');
                    setResetMessage('');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-[#070e1e] border border-[#16264c] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-400 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-blue-200/80 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#16264c] bg-[#070e1e] text-blue-600 focus:ring-blue-500"
                />
                <span>Remember session for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In to Admin Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-400">
              Authorized administrator access only. Accounts are managed via Firebase Console.
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              Reset Administrator Password
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your registered administrator email to receive secure recovery instructions.
            </p>

            {resetStatus === 'success' ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{resetMessage}</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {resetStatus === 'error' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {resetMessage}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@storyhub.com"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {resetStatus === 'loading' ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {resetStatus === 'success' && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
