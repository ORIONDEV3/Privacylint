import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { RoleId, UserProfile } from '../engine/types';

interface AuthViewProps {
  initialMode: 'login' | 'register' | 'forgot';
  onAuthSuccess: (user: UserProfile) => void;
  onBackToLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode,
  onAuthSuccess,
  onBackToLanding,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState<RoleId>('SECURITY_ANALYST');
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const changeMode = (nextMode: 'login' | 'register' | 'forgot') => {
    setMode(nextMode);
    setError(null);
    setResetMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (mode === 'forgot') {
      if (!email.includes('@')) {
        setError('Please enter a valid organization email address.');
        return;
      }
      setResetMessage(
        'Password recovery is not configured in this prototype. Contact your workspace administrator to reset access.'
      );
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { fullName, email, password, role, organizationName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
      } else if (data.user) {
        onAuthSuccess(data.user);
      }
    } catch {
      setError('Network error communicating with authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f7f8fc] px-4 py-5 text-slate-950 sm:px-8 sm:py-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-violet-200/50 blur-3xl" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <a href="#top" onClick={(event) => { event.preventDefault(); onBackToLanding(); }} className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-700 text-white shadow-md shadow-violet-200"><ShieldCheck className="h-5 w-5" /></span>
          <span className="text-lg font-extrabold tracking-tight">Privacy<span className="text-violet-700">Lint</span></span>
        </a>
        <button type="button" onClick={onBackToLanding} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-violet-800">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to overview</span><span className="sm:hidden">Back</span>
        </button>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 py-10 lg:grid-cols-2 lg:gap-14 lg:py-14">
        <section className="mx-auto max-w-xl lg:mx-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-violet-800 shadow-sm">
            <LockKeyhole className="h-3.5 w-3.5" /> Secure workspace access
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Keep privacy reviews moving.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            Sign in to inspect repository findings, follow personal data flows, and review verified fixes with your team.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Evidence linked to the exact source file and line',
              'Separate access for Admins, Analysts and Developers',
              'Findings close only after a fresh scan passes',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-4">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></span>
                <span className="text-sm font-medium leading-6 text-slate-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-violet-200 bg-white text-violet-700"><BadgeCheck className="h-5 w-5" /></span>
            <span><strong className="font-bold text-slate-800">PrivacyLint</strong><br />Role-based access · DPDP-aware triage</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-34px_rgba(40,30,80,0.35)] sm:p-8">
            <div className="mb-6">
              <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">
                {isLogin ? 'Welcome back' : isRegister ? 'Create your workspace' : 'Account recovery'}
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                {isLogin ? 'Sign in to PrivacyLint' : isRegister ? 'Set up your account' : 'Reset your password'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isLogin
                  ? 'Enter your work email and password to continue.'
                  : isRegister
                    ? 'Create an organization account and choose your workspace role.'
                    : 'Enter your work email to request account recovery.'}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1" role="tablist" aria-label="Account actions">
              {[
                { id: 'login' as const, label: 'Sign in' },
                { id: 'register' as const, label: 'Register' },
                { id: 'forgot' as const, label: 'Reset' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === item.id}
                  onClick={() => changeMode(item.id)}
                  className={`rounded-full px-2 py-2.5 text-xs font-bold transition sm:text-sm ${mode === item.id ? 'bg-white text-violet-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
            {resetMessage && (
              <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> <span>{resetMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label htmlFor="auth-fullname" className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</label>
                    <div className="relative">
                      <UserRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input id="auth-fullname" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="auth-org" className="mb-1.5 block text-sm font-semibold text-slate-700">Organization</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input id="auth-org" type="text" required value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Company or team name" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="auth-role" className="mb-1.5 block text-sm font-semibold text-slate-700">Workspace role</label>
                    <select id="auth-role" value={role} onChange={(e) => setRole(e.target.value as RoleId)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
                      <option value="ADMIN">Admin</option>
                      <option value="SECURITY_ANALYST">Security Analyst</option>
                      <option value="DEVELOPER">Developer</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Work email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" autoComplete="email" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="auth-password" className="text-sm font-semibold text-slate-700">Password</label>
                    {isLogin && <button type="button" onClick={() => changeMode('forgot')} className="text-xs font-bold text-violet-700 hover:text-violet-900">Forgot password?</button>}
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input id="auth-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="Enter your password" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60">
                {loading ? 'Please wait…' : isLogin ? 'Sign in to workspace' : isRegister ? 'Create account' : 'Send recovery instructions'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {isLogin && (
              <p className="mt-6 text-center text-sm text-slate-500">
                New to PrivacyLint?{' '}
                <button type="button" onClick={() => changeMode('register')} className="font-bold text-violet-700 hover:text-violet-900">Create an account</button>
              </p>
            )}
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">Passwords are protected with the server’s configured password hashing and session controls.</p>
        </section>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-7xl border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
        PrivacyLint · Secure privacy engineering workspace
      </footer>
    </div>
  );
};
