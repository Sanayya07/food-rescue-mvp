import { useState, type FormEvent } from 'react';
import { Package, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  onSwitchToSignUp: () => void;
}

export function LoginPage({ onSignIn, onBack, onSwitchToSignUp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="absolute top-0 inset-x-0 px-4 sm:px-6 py-5 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <Package className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
            <p className="text-ink-500 text-sm mt-1.5">Sign in to continue to FoodBridge</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            New to FoodBridge?{' '}
            <button onClick={onSwitchToSignUp} className="font-semibold text-brand-600 hover:text-brand-700">
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
