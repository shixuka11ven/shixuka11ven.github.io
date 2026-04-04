import { useState, useRef, KeyboardEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(Array(8).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);
    setOtpToken(newOtp.join(''));

    if (digit && index < 7) {
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
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (!pastedData) return;

    const newOtp = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);
    setOtpToken(newOtp.join(''));
    
    const focusIndex = Math.min(pastedData.length, 7);
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
      if (isSignUp) setEmailSent(true);
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
    setOtpValues(Array(8).fill(''));
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body text-sm';

  const primaryButtonClass =
    'w-full bg-primary py-3 rounded-md font-headline font-semibold text-sm tracking-wide text-white hover:bg-primary/90 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: 'signup'
      });
      if (error) throw error;
      // Success will automatically update auth session and redirect
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden font-body text-white relative">
        <div className="archive-grain pointer-events-none"></div>
        <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

        <div className="w-full max-w-md space-y-6 text-center bg-zinc-950/80 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-2xl relative z-10 mx-4">
          <div className="w-14 h-14 rounded-full bg-green-500/10 mx-auto flex items-center justify-center border border-green-500/20">
            <Mail className="h-7 w-7 text-green-400 opacity-90" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-headline">
            Verify Email
          </h2>
          <p className="text-xs text-purple-200/60 uppercase tracking-widest font-bold leading-relaxed">
            We sent an 8-digit code to<br />
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
                  className="w-[11%] aspect-square bg-white/5 border border-white/10 rounded-md text-white font-headline font-bold text-center text-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>

            {error && <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

            <button
              type="submit"
              disabled={loading || otpToken.length !== 8}
              className={primaryButtonClass}
            >
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

  if (isForgotPassword) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden font-body text-white relative">
        <div className="archive-grain pointer-events-none"></div>
        <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

        <div className="w-full max-w-sm space-y-6 bg-zinc-950/80 backdrop-blur-md p-8 rounded-xl relative z-10 mx-4 border border-white/10 shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white font-headline mb-1">
              Reset Password
            </h2>
            <p className="text-[11px] uppercase tracking-widest text-white/50 font-medium">
              Enter email for reset link
            </p>
          </div>
          
          <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
            <input
              type="email"
              required
              className={inputClass}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className={`text-sm text-center py-2 rounded-lg border ${error.includes('sent') ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{error}</p>}
            
            <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-2`}>
              {loading ? 'Processing...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div className="text-center pt-2">
            <button
              onClick={resetToSignIn}
              className="text-xs text-purple-300/60 hover:text-white transition-colors font-bold tracking-wide flex items-center justify-center gap-1 w-full"
            >
              <span className="material-symbols-outlined text-[14px] group-hover:-translate-x-1 transition-transform">arrow_back</span> Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden font-body text-white relative">
      <div className="archive-grain pointer-events-none"></div>
      <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

      <div className="w-full max-w-sm space-y-6 bg-zinc-950/80 backdrop-blur-md p-8 rounded-xl relative z-10 mx-4 border border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">star</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-headline mb-1">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-[11px] uppercase tracking-widest text-white/50 font-medium">
            Arcturus AI Standard
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="mt-6 space-y-5">
          <div className="space-y-4">
            <input
              type="email"
              required
              className={inputClass}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              minLength={6}
              className={inputClass}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

          <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-2`}>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center pt-2 flex flex-col gap-3">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-xs text-purple-300/60 hover:text-white transition-colors font-bold tracking-wide"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          {!isSignUp && (
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
