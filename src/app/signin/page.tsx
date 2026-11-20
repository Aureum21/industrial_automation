'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Cpu, Eye, EyeOff, KeyRound, LogOut } from 'lucide-react';
import { changePassword, signIn, signOut, signUp, useSession } from '@/lib/auth';
import { safeRedirectPath } from '@/shared/urls';
import { changePasswordSchema, firstIssue, signInSchema, signUpSchema } from '@/shared/validation';

type Mode = 'signin' | 'signup';

const inputClass =
  'w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15';
const labelClass = 'block text-xs font-medium text-[#515154] mb-1.5';
const primaryButton =
  'w-full rounded-xl bg-[#0071e3] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-60';

function Message({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  const error = kind === 'error';
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
    >
      {error ? <AlertCircle size={14} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
      <span>{text}</span>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required className={`${inputClass} pr-10`} />
      <button type="button" onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-0 px-3 text-[#86868b] hover:text-[#1d1d1f]" aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm) return setMessage({ kind: 'error', text: 'The new passwords do not match.' });
    const parsed = changePasswordSchema.safeParse({ currentPassword: current, newPassword: next });
    if (!parsed.success) return setMessage({ kind: 'error', text: firstIssue(parsed.error) });
    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);
    if (!result.ok) return setMessage({ kind: 'error', text: result.error });
    setCurrent('');
    setNext('');
    setConfirm('');
    setMessage({ kind: 'success', text: 'Password changed. Other devices have been signed out.' });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
        <KeyRound size={14} /> Change password
      </h2>
      {message && <Message {...message} />}
      <div>
        <label htmlFor="current-password" className={labelClass}>Current password</label>
        <PasswordInput id="current-password" value={current} onChange={setCurrent} autoComplete="current-password" />
      </div>
      <div>
        <label htmlFor="new-password" className={labelClass}>New password (8+ characters)</label>
        <PasswordInput id="new-password" value={next} onChange={setNext} autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelClass}>Confirm new password</label>
        <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </div>
      <button type="submit" disabled={busy} className={primaryButton}>{busy ? 'Saving…' : 'Change password'}</button>
    </form>
  );
}

function SignInContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirectPath(params.get('redirect'), '/');
  const { user, checked, accounts } = useSession();

  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (mode === 'signin') {
      const parsed = signInSchema.safeParse({ identifier, password });
      if (!parsed.success) return setError(firstIssue(parsed.error));
      setBusy(true);
      const result = await signIn(parsed.data.identifier, parsed.data.password);
      setBusy(false);
      if (!result.ok) return setError(result.error);
    } else {
      const parsed = signUpSchema.safeParse({ name, email, password });
      if (!parsed.success) return setError(firstIssue(parsed.error));
      setBusy(true);
      const result = await signUp(parsed.data);
      setBusy(false);
      if (!result.ok) return setError(result.error);
    }
    router.push(redirectTo);
  };

  return (
    <main className="min-h-[calc(100vh-58px)] bg-[#fbfbfd] px-5 py-14 font-sans text-[#1d1d1f]">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1d1d1f] text-emerald-400">
            <Cpu size={20} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{user ? 'Your account' : mode === 'signin' ? 'Sign in' : 'Create an account'}</h1>
          {!user && (
            <p className="mt-2 text-sm text-[#86868b]">
              {mode === 'signin' ? 'Sign in to write articles and keep your work.' : 'Free. Lets you publish articles with live labs.'}
            </p>
          )}
        </div>

        {!accounts && <Message kind="error" text="Accounts are not available on this deployment (no database configured)." />}

        {user ? (
          <div className="space-y-6 rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-[#86868b]">{user.email}</p>
              </div>
              <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5ea] px-3 py-1.5 text-xs font-medium hover:bg-[#f5f5f7]">
                <LogOut size={12} /> Sign out
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              <Link href="/write" className="flex-1 rounded-xl bg-[#1d1d1f] py-2 text-center font-medium text-white hover:bg-black">Open Studio</Link>
              <Link href="/lab" className="flex-1 rounded-xl border border-[#d2d2d7] py-2 text-center font-medium hover:bg-[#f5f5f7]">Logic Lab</Link>
            </div>
            <hr className="border-[#e5e5ea]" />
            <ChangePasswordForm />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e5e5ea] bg-white p-6 shadow-xs">
            <div className="mb-5 flex rounded-xl bg-[#f5f5f7] p-1" role="tablist">
              {(['signin', 'signup'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => switchMode(value)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${mode === value ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                >
                  {value === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              {error && <Message kind="error" text={error} />}
              {mode === 'signin' ? (
                <div>
                  <label htmlFor="identifier" className={labelClass}>Username or email</label>
                  <input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required className={inputClass} />
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="name" className={labelClass}>Username</label>
                    <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" placeholder="e.g. jordan_controls" required className={inputClass} />
                    <p className="mt-1 text-[11px] text-[#86868b]">Shown as the author of your articles. Letters, numbers, . _ -</p>
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={inputClass} />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="password" className={labelClass}>Password{mode === 'signup' ? ' (8+ characters)' : ''}</label>
                <PasswordInput id="password" value={password} onChange={setPassword} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
              </div>
              <button type="submit" disabled={busy || !accounts || !checked} className={primaryButton}>
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
