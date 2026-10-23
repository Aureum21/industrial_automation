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
  Database,
  KeyRound,
} from 'lucide-react';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  signInWithNeon,
  signUpWithNeon,
  signOutWithNeon,
  checkSessionWithNeon,
  changePasswordWithNeon,
  type User,
} from '@/lib/auth';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const redirectUrl = searchParams.get('redirect') || '/blogs';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);

  // Database Connection State
  const [dbState, setDbState] = useState<{
    status: 'checking' | 'connected' | 'not_configured' | 'error';
    database?: string;
    message?: string;
  }>({ status: 'checking' });

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

  // Change Password States
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [changePassIdentifier, setChangePassIdentifier] = useState('');
  const [changePassCurrent, setChangePassCurrent] = useState('');
  const [changePassNew, setChangePassNew] = useState('');
  const [changePassConfirm, setChangePassConfirm] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check local session
    setLocalCurrentUser(getCurrentUser());

    // 2. Query Neon database status
    fetch('/api/health/db')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.status === 'CONNECTED') {
          setDbState({
            status: 'connected',
            database: data.database,
            message: `Connected to ${data.database || 'Neon Cloud'}`,
          });
          // Also sync user session from server cookie if available
          checkSessionWithNeon().then((user) => {
            if (user) setLocalCurrentUser(user);
          });
        } else if (data.status === 'NOT_CONFIGURED') {
          setDbState({
            status: 'not_configured',
            message: 'Awaiting DATABASE_URL in environment',
          });
        } else {
          setDbState({
            status: 'error',
            message: data.error || 'Connection error',
          });
        }
      })
      .catch(() => {
        setDbState({ status: 'not_configured', message: 'Offline mode' });
      });
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your username/email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt live authentication via Neon PostgreSQL
      const result = await signInWithNeon(email.trim(), password);

      if (result.ok && result.user) {
        setLocalCurrentUser(result.user);
        setIsLoading(false);
        setSuccessMsg(`Welcome, ${result.user.name}! Connecting console...`);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 650);
        return;
      }

      // If database is not configured yet, fallback gracefully to local session
      if (result.error && (result.error.includes('DATABASE_URL') || result.error.includes('not connected'))) {
        const usernameInput = email.trim();
        const isAlazar = usernameInput.toLowerCase().includes('alazar');

        const fallbackUser: User = {
          id: `usr-${Date.now().toString(36)}`,
          name: isAlazar ? 'Alazar Wake Kore' : usernameInput,
          email: usernameInput.includes('@') ? usernameInput : `${usernameInput.toLowerCase()}@automationhub.io`,
          role: isAlazar
            ? 'Electrical Engineering Technology Senior at Higher Colleges of Technology (UAE)'
            : 'Certified Controls Engineer',
          stationId: stationId.trim() || 'TERMINAL-LOCAL-01',
          avatar: isAlazar ? 'AW' : usernameInput.slice(0, 2).toUpperCase(),
          joinedDate: 'Oct 2026',
        };

        setCurrentUser(fallbackUser);
        setLocalCurrentUser(fallbackUser);
        setIsLoading(false);
        setSuccessMsg(`Local session connected (Ready to link with Neon cloud).`);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 800);
        return;
      }

      setIsLoading(false);
      setErrorMsg(result.error || 'Invalid credentials. Please verify your username and password.');
    } catch (err) {
      setIsLoading(false);
      setErrorMsg((err as Error).message || 'Authentication error.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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

    try {
      const result = await signUpWithNeon({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        stationId: stationId.trim() || 'TERMINAL-NEW-01',
      });

      if (result.ok && result.user) {
        setLocalCurrentUser(result.user);
        setIsLoading(false);
        setSuccessMsg(`Account created in Neon Database! Welcome to AutomationHub, ${result.user.name}.`);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 700);
        return;
      }

      // If database is not configured yet, fallback gracefully to local session
      if (result.error && (result.error.includes('DATABASE_URL') || result.error.includes('not connected'))) {
        const fallbackUser: User = {
          id: `usr-${Date.now().toString(36)}`,
          name: name.trim(),
          email: email.trim(),
          role,
          stationId: stationId.trim() || 'TERMINAL-NEW-01',
          avatar:
            name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'AU',
          joinedDate: 'Oct 2026',
        };

        setCurrentUser(fallbackUser);
        setLocalCurrentUser(fallbackUser);
        setIsLoading(false);
        setSuccessMsg(`Account created locally (Ready to link with Neon cloud).`);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 800);
        return;
      }

      setIsLoading(false);
      setErrorMsg(result.error || 'Failed to create account.');
    } catch (err) {
      setIsLoading(false);
      setErrorMsg((err as Error).message || 'Signup failed.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError(null);
    setChangePassSuccess(null);

    if (changePassNew !== changePassConfirm) {
      setChangePassError('New passwords do not match.');
      return;
    }

    if (changePassNew.length < 6) {
      setChangePassError('New password must be at least 6 characters long.');
      return;
    }

    setChangePassLoading(true);

    try {
      const result = await changePasswordWithNeon({
        currentPassword: changePassCurrent,
        newPassword: changePassNew,
        emailOrUsername: changePassIdentifier.trim() || currentUser?.email || email.trim() || 'alazar',
      });

      setChangePassLoading(false);

      if (result.ok) {
        setChangePassSuccess(result.message || 'Password successfully updated in Neon database!');
        setChangePassCurrent('');
        setChangePassNew('');
        setChangePassConfirm('');
        setTimeout(() => {
          setShowChangePassModal(false);
          setChangePassSuccess(null);
        }, 2500);
      } else {
        setChangePassError(result.error || 'Failed to update password.');
      }
    } catch (err) {
      setChangePassLoading(false);
      setChangePassError((err as Error).message || 'Failed to update password.');
    }
  };

  const handleSignOut = async () => {
    await signOutWithNeon();
    setLocalCurrentUser(null);
    setSuccessMsg('You have safely disconnected from the control console.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fbfbfd] text-[#1d1d1f] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background subtle Apple dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5ea_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <span className="h-10 w-10 rounded-xl bg-white border border-[#e5e5ea] flex items-center justify-center text-[#0071e3] group-hover:border-[#0071e3] transition-colors shadow-sm">
              <Cpu size={22} />
            </span>
            <span className="text-2xl font-bold font-serif tracking-tight text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
              AutomationHub
            </span>
          </Link>
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#86868b]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ENGINEER ACCESS CONSOLE // STATION AUTH
          </div>

          {/* Neon Database Live Indicator */}
          <div className="mt-3 flex items-center justify-center">
            {dbState.status === 'connected' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-[11px] font-mono text-emerald-700 shadow-sm">
                <Database size={12} className="text-emerald-600 animate-pulse" />
                <span>Neon PostgreSQL Live: {dbState.database || 'royal-leaf-98510202'}</span>
              </div>
            ) : dbState.status === 'checking' ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e5e5ea] text-[11px] font-mono text-[#86868b] shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                <span>Checking Neon Database...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-800 shadow-sm">
                <Database size={12} className="text-amber-600" />
                <span>Neon Driver Ready (Awaiting DATABASE_URL)</span>
              </div>
            )}
          </div>
        </div>

        {/* Current user session banner (if already signed in) */}
        {currentUser && (
          <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-center text-sm font-mono">
                  {currentUser.avatar || 'OP'}
                </div>
                <div>
                  <div className="text-xs text-[#86868b] font-mono uppercase tracking-wider">ACTIVE SESSION</div>
                  <div className="text-sm font-semibold text-[#1d1d1f]">{currentUser.name}</div>
                  <div className="text-xs text-emerald-700 font-mono">{currentUser.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setChangePassIdentifier(currentUser.email || currentUser.name);
                    setChangePassError(null);
                    setChangePassSuccess(null);
                    setShowChangePassModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e5ea] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] text-xs font-mono transition-colors shadow-sm"
                  title="Change your station password"
                >
                  <KeyRound size={13} className="text-emerald-600" />
                  Change Password
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-mono transition-colors"
                  title="Disconnect station"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200/60 flex gap-2">
              <Link
                href="/blogs"
                className="flex-1 text-center py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Go to Schematics Archive <ArrowRight size={14} />
              </Link>
              <Link
                href="/lab"
                className="px-3 py-2 border border-[#e5e5ea] hover:bg-[#f5f5f7] bg-white text-[#1d1d1f] rounded-xl text-xs font-mono transition-colors flex items-center gap-1 shadow-sm"
              >
                Logic Lab ↗
              </Link>
            </div>
          </div>
        )}

        {/* Main Auth Card */}
        <div className="bg-white border border-[#e5e5ea] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6 sm:p-8">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex rounded-xl bg-[#f5f5f7] p-1 mb-6 border border-[#e5e5ea]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#1d1d1f] font-semibold shadow-sm border border-[#e5e5ea]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
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
                  ? 'bg-white text-[#1d1d1f] font-semibold shadow-sm border border-[#e5e5ea]'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  Username or Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868b]">
                    <UserIcon size={16} />
                  </span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your username or email"
                    autoComplete="username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono text-[#86868b] uppercase tracking-wider">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePassIdentifier(email.trim());
                        setChangePassError(null);
                        setChangePassSuccess(null);
                        setShowChangePassModal(true);
                      }}
                      className="text-[11px] font-mono text-[#0071e3] hover:underline transition-colors flex items-center gap-1"
                    >
                      <KeyRound size={11} />
                      Change Password
                    </button>
                    <span className="text-[#d2d2d7]">·</span>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-mono text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868b]">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#86868b] hover:text-[#1d1d1f]"
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
                    className="w-4 h-4 rounded border-[#e5e5ea] text-[#0071e3] focus:ring-[#0071e3]"
                  />
                  <span className="text-xs text-[#86868b] select-none">Remember this terminal station</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  Full Name / Callsign
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868b]">
                    <UserIcon size={16} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Hayes"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  Work / Facility Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868b]">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan.hayes@facility.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                    Discipline
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-xs text-[#1d1d1f] outline-none"
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
                  <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                    Station ID <span className="text-[#86868b]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868b]">
                      <Building size={14} />
                    </span>
                    <input
                      type="text"
                      value={stationId}
                      onChange={(e) => setStationId(e.target.value)}
                      placeholder="LINE-04 / DCS"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-xs text-[#1d1d1f] placeholder-[#86868b] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  Access Key / Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#86868b]">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 alphanumeric characters"
                    autoComplete="new-password"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#86868b] hover:text-[#1d1d1f]"
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
                    className="w-4 h-4 mt-0.5 rounded border-[#e5e5ea] text-[#0071e3] focus:ring-[#0071e3]"
                  />
                  <span className="text-xs text-[#86868b] leading-tight select-none">
                    I acknowledge industrial safety interlock guidelines, fail-safe philosophies, and the AutomationHub community standards.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm tracking-wide transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        </div>

        {/* Security footer disclaimer */}
        <div className="mt-6 text-center text-[#86868b] text-xs font-mono">
          🔒 Secure 256-Bit Station Simulation · ISO 13849 / IEC 61508 Compliant Principles
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-white border border-[#e5e5ea] rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-2 font-serif">
              Recover Engineering Access Key
            </h3>
            <p className="text-xs text-[#86868b] mb-4 leading-relaxed">
              Enter your work email address. We will simulate sending a cryptographically signed recovery token to reset your console credentials.
            </p>

            {forgotSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 mb-4">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <div className="font-semibold text-[#1d1d1f]">Reset Token Dispatched</div>
                  <div className="mt-1 text-[#424245]">
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
                  <label className="block text-xs font-mono text-[#86868b] mb-1 uppercase tracking-wider">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="engineer@plant.com"
                    required
                    className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] rounded-xl text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSubmitted(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs transition-colors shadow-sm"
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
                  className="px-4 py-2 rounded-xl bg-[#f5f5f7] hover:bg-[#e5e5ea] text-[#1d1d1f] font-mono text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-[#e5e5ea] rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e5e5ea]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <KeyRound size={16} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f] font-serif">
                    Change Station Password
                  </h3>
                  <div className="text-[11px] font-mono text-[#86868b]">
                    Saves directly to your Neon PostgreSQL database
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassModal(false);
                  setChangePassError(null);
                  setChangePassSuccess(null);
                }}
                className="text-[#86868b] hover:text-[#1d1d1f] transition p-1"
              >
                ✕
              </button>
            </div>

            {changePassError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span>{changePassError}</span>
              </div>
            )}

            {changePassSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{changePassSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  Username or Registered Email
                </label>
                <input
                  type="text"
                  value={changePassIdentifier}
                  onChange={(e) => setChangePassIdentifier(e.target.value)}
                  placeholder="alazar or alazar@industrialautomation.website"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  value={changePassCurrent}
                  onChange={(e) => setChangePassCurrent(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  New Password (Min 6 Characters)
                </label>
                <input
                  type="password"
                  value={changePassNew}
                  onChange={(e) => setChangePassNew(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#86868b] mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={changePassConfirm}
                  onChange={(e) => setChangePassConfirm(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-[#e5e5ea] focus:border-[#0071e3] focus:bg-white rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassModal(false);
                    setChangePassError(null);
                    setChangePassSuccess(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#86868b] hover:text-[#1d1d1f] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePassLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs font-mono transition flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {changePassLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Database...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
        <div className="min-h-[calc(100vh-64px)] bg-[#fbfbfd] flex items-center justify-center text-[#86868b] font-mono text-xs">
          Loading Station Console...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
