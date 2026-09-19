import { useEffect, useState, type FormEvent } from 'react';
import { MapPin, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, ErrorBanner } from '@/components/ui';
import { locationPresets } from '@/pages/SignUpPage';
import { updateProfile } from '@/lib/profiles';

export function ProfilePage() {
  const { profile, setProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [orgName, setOrgName] = useState(profile?.org_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [locationLabel, setLocationLabel] = useState(profile?.location_label ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setOrgName(profile.org_name ?? '');
    setPhone(profile.phone ?? '');
    setLocationLabel(profile.location_label ?? '');
  }, [profile]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    const location = locationPresets.find((item) => item.label === locationLabel);
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateProfile(profile.id, {
        name,
        org_name: orgName || null,
        phone: phone || null,
        location_label: locationLabel || null,
        location_lat: location?.lat ?? null,
        location_lng: location?.lng ?? null,
      });
      setProfile(updated);
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Keep your contact and matching details up to date." />
      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-5">
        {error && <ErrorBanner message={error} />}
        {message && <div className="rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-700">{message}</div>}
        <div>
          <label className="label" htmlFor="profile-name">Full name</label>
          <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" /><input id="profile-name" required value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" /></div>
        </div>
        <div>
          <label className="label" htmlFor="profile-org">Organization</label>
          <input id="profile-org" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="profile-phone">Phone</label>
          <input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="profile-location">Area / location</label>
          <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" /><select id="profile-location" required value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} className="input pl-10"><option value="">Select your area...</option>{locationPresets.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  );
}
