import { supabase } from './supabase';

export interface ImpactStats {
  mealsRescued: number;
  successfulConnections: number;
  pickupsCompleted: number;
  activeProviders: number;
}

export async function fetchImpactStats(): Promise<ImpactStats> {
  // Meals rescued: sum of quantities from completed listings
  const { data: completed, error: cErr } = await supabase
    .from('food_listings')
    .select('quantity')
    .eq('status', 'COMPLETED');
  if (cErr) throw cErr;
  const mealsRescued = (completed ?? []).reduce((sum, r) => sum + (r.quantity ?? 0), 0);

  // Successful connections: completed listings count
  const successfulConnections = completed?.length ?? 0;

  // Pickups completed: delivered pickups
  const { count: pickupsCompleted, error: pErr } = await supabase
    .from('pickups')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'delivered');
  if (pErr) throw pErr;

  // Active food providers: providers with at least one listing in a non-cancelled state
  const { data: providers, error: prErr } = await supabase
    .from('food_listings')
    .select('provider_id')
    .neq('status', 'CANCELLED');
  if (prErr) throw prErr;
  const uniqueProviders = new Set((providers ?? []).map((p) => p.provider_id));

  return {
    mealsRescued,
    successfulConnections,
    pickupsCompleted: pickupsCompleted ?? 0,
    activeProviders: uniqueProviders.size,
  };
}
