import { useState, type ReactNode } from 'react';
import {
  Home,
  LayoutList,
  Inbox,
  User as UserIcon,
  Package,
  History,
  Truck,
  LogOut,
  Menu,
  X,
  HeartHandshake,
  Utensils,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/lib/types';

export type PageId =
  | 'home'
  | 'listings'
  | 'requests'
  | 'post-food'
  | 'history'
  | 'profile'
  | 'impact'
  | 'pickup-details'
  | 'food-details'
  | 'pickups';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof Home;
}

const navByRole: Record<Role, NavItem[]> = {
  provider: [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'listings', label: 'Listings', icon: LayoutList },
    { id: 'requests', label: 'Requests', icon: Inbox },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ],
  ngo: [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'requests', label: 'Requests', icon: Inbox },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ],
  volunteer: [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'pickups', label: 'Pickups', icon: Truck },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ],
};

const roleLabel: Record<Role, string> = {
  provider: 'Food Provider',
  ngo: 'NGO / Community',
  volunteer: 'Volunteer',
};

const roleIcon: Record<Role, typeof Home> = {
  provider: Utensils,
  ngo: HeartHandshake,
  volunteer: Truck,
};

interface LayoutProps {
  children: ReactNode;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function AppLayout({ children, activePage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  if (!profile) return <>{children}</>;

  const items = navByRole[profile.role];
  const RoleIcon = roleIcon[profile.role];

  const handleNav = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-ink-200 bg-white">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-ink-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-ink-900 leading-tight">FoodBridge</p>
            <p className="text-[11px] text-ink-500 leading-tight">Share surplus. Reduce waste.</p>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-ink-100">
          <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <RoleIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-800 truncate">{profile.name}</p>
              <p className="text-[11px] text-ink-500 truncate">{roleLabel[profile.role]}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id || (item.id === 'pickups' && activePage === 'pickup-details') || (item.id === 'home' && activePage === 'food-details') || (item.id === 'home' && activePage === 'post-food');
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-800'
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-ink-100 space-y-1">
          <button
            onClick={() => handleNav('impact')}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              activePage === 'impact' ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            <HeartHandshake className="h-4.5 w-4.5" />
            Impact
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 transition"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white border-b border-ink-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Package className="h-4 w-4" />
          </div>
          <span className="font-bold text-ink-900">FoodBridge</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="p-2 -mr-2 rounded-lg text-ink-600 hover:bg-ink-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-14" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-ink-900/30" />
          <div
            className="absolute top-14 left-0 right-0 bg-white border-b border-ink-200 shadow-lg animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <RoleIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">{profile.name}</p>
                <p className="text-[11px] text-ink-500">{roleLabel[profile.role]}</p>
              </div>
            </div>
            <nav className="px-2 py-2">
              {items.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={() => handleNav('impact')}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  activePage === 'impact' ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                }`}
              >
                <HeartHandshake className="h-4.5 w-4.5" />
                Impact
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <LogOut className="h-4.5 w-4.5" />
                Sign out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 pb-24 md:pb-10">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-ink-200 grid grid-cols-4 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                active ? 'text-brand-600' : 'text-ink-400'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
