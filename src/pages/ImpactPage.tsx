import { useEffect, useState } from 'react';
import { CheckCircle2, HeartHandshake, Package, Truck, Users } from 'lucide-react';
import { PageHeader, Spinner, ErrorBanner } from '@/components/ui';
import { fetchImpactStats, type ImpactStats } from '@/lib/impact';

export function ImpactPage() {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImpactStats().then(setStats).catch(() => setError('Unable to load impact statistics.'));
  }, []);

  return (
    <div>
      <PageHeader title="Community impact" subtitle="See what FoodBridge is helping the community accomplish." />
      {error && <ErrorBanner message={error} />}
      {!stats && !error ? <Spinner label="Loading impact statistics..." /> : stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ImpactCard icon={Package} label="Meals rescued" value={stats.mealsRescued} />
          <ImpactCard icon={HeartHandshake} label="Successful connections" value={stats.successfulConnections} />
          <ImpactCard icon={Truck} label="Pickups completed" value={stats.pickupsCompleted} />
          <ImpactCard icon={Users} label="Active providers" value={stats.activeProviders} />
        </div>
      )}
      {stats && <div className="card mt-6 p-6 flex items-center gap-3 bg-brand-50 border-brand-200">
        <CheckCircle2 className="h-5 w-5 text-brand-600" />
        <p className="text-sm text-ink-700">Every completed connection keeps good food in the community and out of landfill.</p>
      </div>}
    </div>
  );
}

function ImpactCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4"><Icon className="h-5 w-5" /></div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500 mt-1">{label}</p>
    </div>
  );
}
