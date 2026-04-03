import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
  };

  const inputClass =
    'w-full bg-muted border border-app-border px-4 py-2 text-foreground focus:outline-none focus:border-white transition-colors';

  const primaryButtonClass =
    'w-full border border-white py-2 text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50';

  if (emailSent) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-8 text-center">
          <Mail className="mx-auto h-12 w-12 text-green-400 opacity-80" strokeWidth={1.5} />
          <h2 className="text-2xl font-light tracking-widest uppercase">
            Check Your Email
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
            We sent a verification link to<br />
            <span className="text-white opacity-80">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground tracking-wide opacity-70">
            Click the link in your email to verify your account, then come back here to sign in.
          </p>
          <button onClick={resetToSignIn} className={primaryButtonClass}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <h2 className="text-2xl font-light tracking-widest uppercase text-center">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>
        <form onSubmit={handleAuth} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input
              type="email"
              required
              className={inputClass}
              placeholder="Email"
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

          {error && <p className="text-sm text-red-500 text-center font-light">{error}</p>}

          <button type="submit" disabled={loading} className={primaryButtonClass}>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-widest opacity-60"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
