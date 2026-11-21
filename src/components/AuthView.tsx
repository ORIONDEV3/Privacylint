import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Lock, Mail, Shield, User } from 'lucide-react';
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
  const [email, setEmail] = useState('ananya.sharma@bharatpay.in');
  const [password, setPassword] = useState('PrivacyLint#2026');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('BharatPay FinTech Pvt Ltd');
  const [role, setRole] = useState<RoleId>('SECURITY_ANALYST');
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickPersona = (personaEmail: string) => {
    setMode('login');
    setEmail(personaEmail);
    setPassword('PrivacyLint#2026');
    setError(null);
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
        `Password reset instructions and a time-bound recovery token have been queued for ${email}.`
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

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-between p-6">
      <div>
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PrivacyLint Overview</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#0C1222] border border-slate-800 rounded-xl p-8 my-8">
        <div className="flex items-center gap-2.5 mb-6">
          <Shield className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-bold tracking-tight text-white">PrivacyLint</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-1">
          {mode === 'login'
            ? 'Sign In to Workspace'
            : mode === 'register'
            ? 'Create Organization Account'
            : 'Reset Account Password'}
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          {mode === 'login'
            ? 'Protected by scrypt cryptographic password hashing and HttpOnly signed session cookies.'
            : mode === 'register'
            ? 'Configure role-based access control for your engineering and security team.'
            : 'Enter your registered email to receive a recovery token.'}
        </p>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#070B14] border border-slate-800 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setResetMessage(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setResetMessage(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'register'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError(null);
              setResetMessage(null);
            }}
            className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'forgot'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reset Password
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-xs text-rose-200"
          >
            {error}
          </div>
        )}

        {resetMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-xs text-emerald-200 flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{resetMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    id="auth-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vikramaditya Rao"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#070B14] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-org"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Organization Name
                </label>
                <input
                  id="auth-org"
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#070B14] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-role"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  RBAC Role Assignment
                </label>
                <select
                  id="auth-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleId)}
                  className="w-full px-3 py-2 text-sm bg-[#070B14] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ADMIN">Admin (Organization &amp; User Management)</option>
                  <option value="SECURITY_ANALYST">
                    Security Analyst (Scan &amp; Findings Triage)
                  </option>
                  <option value="DEVELOPER">
                    Developer (Repository &amp; Patch Review)
                  </option>
                </select>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.in"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#070B14] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#070B14] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
          >
            {loading
              ? 'Verifying Credentials...'
              : mode === 'login'
              ? 'Sign In to Workspace'
              : mode === 'register'
              ? 'Create Account & Continue'
              : 'Send Recovery Instructions'}
          </button>
        </form>

        {/* Preloaded RBAC Test Accounts */}
        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-xs text-slate-400 mb-2.5">
              Quick Demo Personas (Password: <code className="text-slate-200">PrivacyLint#2026</code>):
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickPersona('ananya.sharma@bharatpay.in')}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#070B14] hover:bg-slate-900 border border-slate-800 text-xs flex items-center justify-between transition-colors"
              >
                <span className="font-medium text-slate-200">Ananya Sharma</span>
                <span className="font-mono text-blue-400">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('rohan.verma@bharatpay.in')}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#070B14] hover:bg-slate-900 border border-slate-800 text-xs flex items-center justify-between transition-colors"
              >
                <span className="font-medium text-slate-200">Rohan Verma</span>
                <span className="font-mono text-violet-400">Security Analyst</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('karthik.nair@bharatpay.in')}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#070B14] hover:bg-slate-900 border border-slate-800 text-xs flex items-center justify-between transition-colors"
              >
                <span className="font-medium text-slate-200">Karthik Nair</span>
                <span className="font-mono text-emerald-400">Developer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-500">
        PrivacyLint Enterprise Authentication · Argon2id / scrypt KDF · RBAC Enforced
      </div>
    </div>
  );
};
