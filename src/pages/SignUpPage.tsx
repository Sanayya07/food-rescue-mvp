import { useState, type FormEvent } from 'react';
import { Package, ArrowLeft, Mail, Lock, Eye, EyeOff, User as UserIcon, Building2, Phone, MapPin, Check } from 'lucide-react';
import type { Role } from '@/lib/types';

interface Props {
  onSignUp: (email: string, password: string, profile: SignUpProfile) => Promise<void>;
  onBack: () => void;
  onSwitchToLogin: () => void;
  selectedRole: Role;
}

export interface SignUpProfile {
  role: Role;
  name: string;
  orgName: string | null;
  phone: string | null;
  locationLabel: string;
  lat: number;
  lng: number;
}

const roleMeta: Record<Role, { emoji: string; label: string; desc: string; namePlaceholder: string; orgLabel: string; orgOptional: boolean }> = {
  provider: {
    emoji: '🍱',
    label: 'Food Provider',
    desc: 'You have surplus food to share.',
    namePlaceholder: 'Your name',
    orgLabel: 'Organization / restaurant name',
    orgOptional: true,
  },
  ngo: {
    emoji: '🤝',
    label: 'NGO / Community',
    desc: 'You receive food for your community.',
    namePlaceholder: 'Your name',
    orgLabel: 'Organization name',
    orgOptional: false,
  },
  volunteer: {
    emoji: '🚚',
    label: 'Volunteer',
    desc: 'You help transport food.',
    namePlaceholder: 'Your name',
    orgLabel: 'Organization (optional)',
    orgOptional: true,
  },
};

// Simple predefined location presets (hackathon-friendly, no geocoding API needed)
const locationPresets = [
  { label: 'Downtown — City Center', lat: 12.9716, lng: 77.5946 },
  { label: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { label: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
  { label: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { label: 'Jayanagar', lat: 12.9250, lng: 77.5938 },
  { label: 'HSR Layout', lat: 12.9116, lng: 77.6474 },
  { label: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { label: 'Malleshwaram', lat: 13.0035, lng: 77.5647 },
];

export function SignUpPage({ onSignUp, onBack, onSwitchToLogin, selectedRole }: Props) {
  const meta = roleMeta[selectedRole];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!locationLabel) {
      setError('Please select your area/location.');
      return;
    }
    setLoading(true);
    try {
      const location = locationPresets.find((loc) => loc.label === locationLabel)!;
      await onSignUp(email, password, {
        role: selectedRole,
        name,
        orgName: orgName || null,
        phone: phone || null,
        locationLabel,
        lat: location.lat,
        lng: location.lng,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
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
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <Package className="h-6 w-6" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
              <span>{meta.emoji}</span> {meta.label}
            </div>
            <h1 className="text-2xl font-bold text-ink-900">Create your account</h1>
            <p className="text-ink-500 text-sm mt-1">{meta.desc}</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  placeholder={meta.namePlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="label">
                {meta.orgLabel}
                {meta.orgOptional && <span className="text-ink-400 font-normal"> (optional)</span>}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="input pl-10"
                  placeholder="e.g. Sunrise Restaurant"
                />
              </div>
            </div>

            <div>
              <label className="label">
                Phone <span className="text-ink-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input pl-10"
                  placeholder="+91 90000 00000"
                />
              </div>
            </div>

            <div>
              <label className="label">Your area / location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 z-10" />
                <select
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  className="input pl-10 appearance-none"
                  required
                >
                  <option value="">Select your area…</option>
                  {locationPresets.map((loc) => (
                    <option key={loc.label} value={loc.label}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-ink-400 mt-1.5 flex items-center gap-1">
                <Check className="h-3 w-3 text-brand-500" />
                Used for matching and distance calculation.
              </p>
            </div>

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
                  placeholder="Min 6 characters"
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export { locationPresets };
