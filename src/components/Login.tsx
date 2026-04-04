import { useState, useRef, KeyboardEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
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
    setError(null);
    setOtpToken('');
    setOtpValues(Array(8).fill(''));
  };

  const inputClass =
    'w-full bg-surface-container-highest/40 backdrop-blur-md border border-[rgba(255,255,255,0.05)] rounded-full px-6 py-4 text-white placeholder-purple-300/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all font-body text-sm';

  const primaryButtonClass =
    'w-full bg-gradient-to-r from-primary-container to-primary py-4 rounded-full font-headline font-bold text-sm tracking-wide text-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed';

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

  if (emailSent) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden font-body text-white relative">
        <div className="archive-grain pointer-events-none"></div>
        <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

        <div className="w-full max-w-md space-y-8 text-center glass-panel p-10 rounded-[2.5rem] relative z-10 mx-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto flex items-center justify-center border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <Mail className="h-8 w-8 text-green-400 opacity-90" strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white font-headline">
            Verify Email
          </h2>
          <p className="text-xs text-purple-200/60 uppercase tracking-widest font-bold leading-relaxed">
            We sent an 8-digit code to<br />
            <span className="text-white opacity-90 lowercase normal-case tracking-normal font-medium text-sm mt-1 block">{email}</span>
          </p>
          
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-8">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  className="w-[11%] aspect-square bg-surface-container-highest/40 backdrop-blur-md border border-[rgba(255,255,255,0.05)] rounded-2xl text-white font-headline font-black text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden font-body text-white relative">
      <div className="archive-grain pointer-events-none"></div>
      <div className="fixed inset-0 bg-custom-image z-0 pointer-events-none"></div>

      <div className="w-full max-w-sm space-y-8 glass-panel p-10 rounded-[2.5rem] relative z-10 mx-4 border border-[rgba(255,255,255,0.05)] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary mx-auto mb-6 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
            <span className="material-symbols-outlined text-white text-2xl">star</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-white font-headline mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300/60 font-bold">
            Arcturus AI Midnight Edition
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="mt-8 space-y-6">
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
        
        <div className="text-center pt-2">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-xs text-purple-300/60 hover:text-white transition-colors font-bold tracking-wide"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
