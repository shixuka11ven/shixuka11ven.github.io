import { useState, useRef, KeyboardEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, X } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);
    setOtpToken(newOtp.join(''));
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;
    const newOtp = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);
    setOtpToken(newOtp.join(''));
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (isSignUp) {
        setEmailSent(true);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'discord') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: 'signup',
      });
      if (error) throw error;
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setError('Password reset email sent! Check your inbox.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetToSignIn = () => {
    setEmailSent(false);
    setIsSignUp(false);
    setIsForgotPassword(false);
    setError(null);
    setOtpToken('');
    setOtpValues(Array(6).fill(''));
  };

  if (!open) return null;

  const inputClass =
    'w-full bg-white/5 border border-border-subtle rounded-[6px] px-4 py-3 text-white placeholder-on-surface-faint outline-none ring-0 focus:outline-none focus:ring-0 focus:border-primary-border transition-all font-space text-sm';

  const primaryButtonClass =
    'w-full flex items-center justify-center bg-primary py-3 rounded-[6px] font-space font-semibold text-[13px] tracking-wide text-[#fafafa] border border-primary-border hover:bg-primary-hover hover:border-primary-border-hover transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed outline-none';

  // Google icon SVG
  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  // Discord icon SVG
  const DiscordIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0" fill="#5865F2">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
    </svg>
  );

  // OTP verification view
  if (emailSent) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div
          className="w-full max-w-md space-y-6 text-center glass-panel p-8 rounded-3xl relative z-10 mx-4 animate-dialog-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="w-14 h-14 rounded-full bg-green-500/10 mx-auto flex items-center justify-center border border-green-500/20">
            <Mail className="h-7 w-7 text-green-400 opacity-90" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-headline">Verify Email</h2>
          <p className="text-xs text-purple-200/60 uppercase tracking-widest font-bold leading-relaxed">
            We sent a 6-digit code to<br />
            <span className="text-white opacity-90 lowercase normal-case tracking-normal font-medium text-sm mt-1 block">{email}</span>
          </p>

          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-6">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  className="w-[14%] aspect-square bg-white/5 border border-white/10 rounded-md text-white font-headline font-bold text-center text-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>
            {error && <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
            <button type="submit" disabled={loading || otpToken.length !== 6} className={primaryButtonClass}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={resetToSignIn}
              className="w-full py-2 text-xs uppercase tracking-widest text-purple-300/50 hover:text-white transition-all font-bold group flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Back to Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (isForgotPassword) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div
          className="w-full max-w-sm space-y-6 glass-panel p-8 rounded-3xl relative z-10 mx-4 animate-dialog-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white font-headline mb-1">Reset Password</h2>
            <p className="text-[11px] uppercase tracking-widest text-white/50 font-medium">Enter email for reset link</p>
          </div>
          <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
            <input type="email" required className={inputClass} placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && (
              <p className={`text-sm text-center py-2 rounded-lg border ${error.includes('sent') ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-2`}>
              {loading ? 'Processing...' : 'Send Reset Link'}
            </button>
          </form>
          <div className="text-center pt-2">
            <button
              onClick={resetToSignIn}
              className="text-xs text-purple-300/60 hover:text-white transition-colors font-bold tracking-wide flex items-center justify-center gap-1 w-full"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main sign in / sign up view
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="w-full max-w-sm space-y-6 glass-panel p-8 rounded-3xl relative z-10 mx-4 animate-dialog-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="Arcturus Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(155,50,150,0.6)]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-space mb-1">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-[11px] uppercase tracking-widest text-on-surface-faint font-medium">
            {isSignUp ? 'Sign up to start chatting' : 'Sign in to continue chatting'}
          </p>
        </div>

        {/* OAuth Buttons - hidden when user starts typing email */}
        {!email && (
          <>
            <div className="space-y-3">
              <button
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-[6px] px-4 py-3 text-white hover:bg-white/10 hover:border-white/20 transition-all font-space font-semibold text-[15px] disabled:opacity-50"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuth('discord')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-[6px] px-4 py-3 text-white hover:bg-white/10 hover:border-white/20 transition-all font-space font-semibold text-[15px] disabled:opacity-50"
              >
                <DiscordIcon />
                Continue with Discord
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-3">
            <input type="email" required className={inputClass} placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
            {email && (
              <input type="password" required minLength={6} className={inputClass} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </div>
          {error && <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
          <button type="submit" disabled={loading || !email} className={primaryButtonClass}>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-1 flex flex-col gap-2">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-xs text-purple-300/60 hover:text-white transition-colors font-bold tracking-wide"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          {!isSignUp && email && (
            <button
              onClick={() => { setIsForgotPassword(true); setError(null); }}
              className="text-xs text-purple-300/60 hover:text-white transition-colors font-bold tracking-wide"
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
