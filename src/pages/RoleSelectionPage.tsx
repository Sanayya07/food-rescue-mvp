import { Package, ArrowLeft, Utensils, HeartHandshake, Truck, Check } from 'lucide-react';
import type { Role } from '@/lib/types';

interface Props {
  onSelect: (role: Role) => void;
  onBack: () => void;
}

const roles: Array<{
  id: Role;
  emoji: string;
  label: string;
  desc: string;
  features: string[];
  icon: typeof Utensils;
  accent: string;
}> = [
  {
    id: 'provider',
    emoji: '🍱',
    label: 'Food Provider',
    desc: 'Restaurants, canteens, event hosts',
    features: ['Post surplus food', 'Review incoming requests', 'Track your impact'],
    icon: Utensils,
    accent: 'brand',
  },
  {
    id: 'ngo',
    emoji: '🤝',
    label: 'NGO / Community',
    desc: 'Shelters, community kitchens, NGOs',
    features: ['Browse nearby food', 'Request what you need', 'Track deliveries'],
    icon: HeartHandshake,
    accent: 'accent',
  },
  {
    id: 'volunteer',
    emoji: '🚚',
    label: 'Volunteer',
    desc: 'Help transport food',
    features: ['See open pickups', 'Collect & deliver', 'Build your record'],
    icon: Truck,
    accent: 'blue',
  },
];

export function RoleSelectionPage({ onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-ink-50">
      <div className="absolute top-0 inset-x-0 px-4 sm:px-6 py-5 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl animate-fadeIn">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <Package className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">Choose your role</h1>
            <p className="text-ink-500 text-sm mt-1.5 max-w-md mx-auto">
              Tell us how you want to participate in FoodBridge. You can pick one role per account.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => onSelect(role.id)}
                  className="card p-6 text-left transition-all duration-200 hover:shadow-cardHover hover:-translate-y-1 group animate-fadeIn"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="text-3xl mb-3">{role.emoji}</div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-ink-900 mb-0.5">{role.label}</h3>
                  <p className="text-xs text-ink-500 mb-4">{role.desc}</p>
                  <ul className="space-y-2">
                    {role.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-600">
                        <Check className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 text-sm font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                    Continue →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
