'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Terminal,
  LogOut,
  Building,
} from 'lucide-react';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  DEMO_USERS,
  type User,
} from '@/lib/auth';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const redirectUrl = searchParams.get('redirect') || '/blogs';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Controls & PLC Automation');
  const [stationId, setStationId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberStation, setRememberStation] = useState(true);
  const [agreedToSafety, setAgreedToSafety] = useState(false);

  // UI status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  useEffect(() => {
    setLocalCurrentUser(getCurrentUser());
  }, []);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your engineering email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Find matching demo user or create session user
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      const userToSave: User = matched || {
        id: `usr-${Date.now().toString(36)}`,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: email.trim(),
        role: 'Certified Controls Engineer',
        stationId: stationId.trim() || 'TERMINAL-LOCAL-01',
        avatar: email.slice(0, 2).toUpperCase(),
        joinedDate: 'Oct 2026',
      };

      setCurrentUser(userToSave);
      setLocalCurrentUser(userToSave);
      setIsLoading(false);
      setSuccessMsg(`Welcome, ${userToSave.name}! Initializing console...`);

      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full engineering name or callsign.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid engineering email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Access key / password must be at least 6 characters.');
      return;
    }
    if (!agreedToSafety) {
      setErrorMsg('Please review and acknowledge the safety interlock guidelines.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const newUser: User = {
        id: `usr-${Date.now().toString(36)}`,
        name: name.trim(),
        email: email.trim(),
        role,
        stationId: stationId.trim() || 'TERMINAL-NEW-01',
        avatar: name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'AU',
        joinedDate: 'Oct 2026',
      };

      setCurrentUser(newUser);
      setLocalCurrentUser(newUser);
      setIsLoading(false);
      setSuccessMsg(`Account created! Welcome to AutomationHub, ${newUser.name}.`);

      setTimeout(() => {
        router.push(redirectUrl);
      }, 700);
    }, 650);
  };

  const handleQuickDemoSignIn = (user: User) => {
    setIsLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      setCurrentUser(user);
      setLocalCurrentUser(user);
      setIsLoading(false);
      setSuccessMsg(`Logged in as ${user.name} (${user.role})`);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 600);
    }, 400);
  };

  const handleSignOut = () => {
    clearCurrentUser();
    setLocalCurrentUser(null);
    setSuccessMsg('You have safely disconnected from the control console.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#070b14] text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blueprint decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(114,217,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(114,217,229,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <span className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors shadow-lg shadow-emerald-950/40">
              <Cpu size={20} />
            </span>
            <span className="text-2xl font-bold font-serif tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              AutomationHub
            </span>
          </Link>
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest text-emerald-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ENGINEER ACCESS CONSOLE // STATION AUTH
          </div>
        </div>

        {/* Current user session banner (if already signed in) */}
        {currentUser && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-sm font-mono">
                  {currentUser.avatar || 'OP'}
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-mono">ACTIVE SESSION</div>
                  <div className="text-sm font-semibold text-white">{currentUser.name}</div>
                  <div className="text-xs text-emerald-400 font-mono">{currentUser.role}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/40 hover:text-white text-xs font-mono transition-colors"
                title="Disconnect station"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-500/20 flex gap-2">
              <Link
                href="/blogs"
                className="flex-1 text-center py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                Go to Schematics Archive <ArrowRight size={14} />
              </Link>
              <Link
                href="/lab"
                className="px-3 py-2 border border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-200 rounded-lg text-xs font-mono transition-colors flex items-center gap-1"
              >
                Logic Lab ↗
              </Link>
            </div>
          </div>
        )}

        {/* Main Auth Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex rounded-xl bg-zinc-950 p-1 mb-6 border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Engineering Email / ID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@plant.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Access Key / Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot Key?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberStation}
                    onChange={(e) => setRememberStation(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                  />
                  <span className="text-xs text-zinc-400 select-none">Remember this terminal station</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Sign In to Console</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: CREATE ACCOUNT */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Full Name / Callsign
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon size={16} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Work / Facility Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan.hayes@facility.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Discipline
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                  >
                    <option>Controls &amp; PLC Automation</option>
                    <option>SCADA &amp; Distributed DCS</option>
                    <option>Robotics &amp; Motion Control</option>
                    <option>Process &amp; Chemical Systems</option>
                    <option>Electrical &amp; Instrumentation</option>
                    <option>Student / Academic Researcher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Station ID <span className="text-zinc-600">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Building size={14} />
                    </span>
                    <input
                      type="text"
                      value={stationId}
                      onChange={(e) => setStationId(e.target.value)}
                      placeholder="LINE-04 / DCS"
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-600 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Access Key / Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 alphanumeric characters"
                    autoComplete="new-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToSafety}
                    onChange={(e) => setAgreedToSafety(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-zinc-400 leading-tight select-none">
                    I acknowledge industrial safety interlock guidelines, fail-safe philosophies, and the AutomationHub community standards.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Configuring Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Create Engineer Profile</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick 1-Click Demo Logins */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Terminal size={12} className="text-emerald-400" />
                Quick 1-Click Demo Profiles
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">No password</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleQuickDemoSignIn(demo)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-800/60 hover:border-emerald-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-md bg-zinc-800 group-hover:bg-emerald-500/20 border border-zinc-700 group-hover:border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold flex items-center justify-center transition-colors">
                      {demo.avatar}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {demo.name}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                        {demo.role}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400/80 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all">
                    Sign in →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security footer disclaimer */}
        <div className="mt-6 text-center text-zinc-500 text-xs font-mono">
          🔒 Secure 256-Bit Station Simulation · ISO 13849 / IEC 61508 Compliant Principles
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 font-serif">
              Recover Engineering Access Key
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Enter your work email address. We will simulate sending a cryptographically signed recovery token to reset your console credentials.
            </p>

            {forgotSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 mb-4">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Reset Token Dispatched</div>
                  <div className="mt-1 text-zinc-300">
                    A recovery link was simulated for <strong>{forgotEmail}</strong>. (In this demo environment, any password or demo login unlocks console access.)
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotEmail) setForgotSubmitted(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wider">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="engineer@plant.com"
                    required
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSubmitted(false);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors"
                  >
                    Send Recovery Token
                  </button>
                </div>
              </form>
            )}

            {forgotSubmitted && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] bg-[#070b14] flex items-center justify-center text-zinc-400 font-mono text-xs">
          Loading Station Console...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
