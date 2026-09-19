import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLayout, type PageId } from '@/components/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RoleSelectionPage } from '@/pages/RoleSelectionPage';
import { SignUpPage, type SignUpProfile } from '@/pages/SignUpPage';
import { ProviderDashboard } from '@/pages/provider/ProviderDashboard';
import { ProviderListings } from '@/pages/provider/ProviderListings';
import { ProviderRequests } from '@/pages/provider/ProviderRequests';
import { PostFoodPage } from '@/pages/provider/PostFoodPage';
import { NgoDashboard } from '@/pages/ngo/NgoDashboard';
import { NgoRequests } from '@/pages/ngo/NgoRequests';
import { NgoHistory } from '@/pages/ngo/NgoHistory';
import { FoodDetailsPage } from '@/pages/ngo/FoodDetailsPage';
import { VolunteerDashboard } from '@/pages/volunteer/VolunteerDashboard';
import { PickupDetailsPage } from '@/pages/volunteer/PickupDetailsPage';
import { ImpactPage } from '@/pages/ImpactPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { createProfile } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/types';

type PublicRoute = 'landing' | 'login' | 'roles' | 'signup';

function pathForPage(role: Role, page: PageId): string {
  if (page === 'home') return `/${role}`;
  return `/${page}`;
}

function routeFromPath(pathname: string): { page: PageId; id?: string } {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'ngo' && parts[1] === 'food' && parts[2]) return { page: 'food-details', id: parts[2] };
  if (parts[0] === 'volunteer' && parts[1] === 'pickup' && parts[2]) return { page: 'pickup-details', id: parts[2] };
  if (parts[0] === 'provider' || parts[0] === 'ngo' || parts[0] === 'volunteer') return { page: 'home' };
  if (parts[0] === 'listings' || parts[0] === 'requests' || parts[0] === 'post-food' || parts[0] === 'history' || parts[0] === 'profile' || parts[0] === 'impact' || parts[0] === 'pickups') {
    return { page: parts[0] as PageId };
  }
  return { page: 'home' };
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function AppContent() {
  const auth = useAuth();
  const [pathname, setPathname] = useState(window.location.pathname);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (auth.loading) return <div className="min-h-screen bg-ink-50" />;

  const handleSignUp = async (email: string, password: string, data: SignUpProfile) => {
    await auth.signUp(email, password);
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const profile = await createProfile(sessionData.session.user.id, data.role, data.name, data.orgName, data.phone, data.locationLabel, data.lat, data.lng);
      auth.setProfile(profile);
      navigate(`/${data.role}`);
    } else {
      navigate('/login');
    }
  };

  if (!auth.session) {
    if (pathname === '/login') return <LoginPage onSignIn={auth.signIn} onBack={() => navigate('/')} onSwitchToSignUp={() => navigate('/roles')} />;
    if (pathname === '/roles') return <RoleSelectionPage onSelect={(role) => { setSelectedRole(role); navigate('/signup'); }} onBack={() => navigate('/')} />;
    if (pathname === '/signup' && selectedRole) return <SignUpPage selectedRole={selectedRole} onSignUp={handleSignUp} onBack={() => navigate('/roles')} onSwitchToLogin={() => navigate('/login')} />;
    return <LandingPage onGetStarted={() => navigate('/roles')} onSignIn={() => navigate('/login')} />;
  }

  if (!auth.profile) return <div className="min-h-screen bg-ink-50 flex items-center justify-center text-ink-500">Loading your profile…</div>;

  const route = routeFromPath(pathname);
  const page = route.page;
  const go = (next: PageId) => navigate(pathForPage(auth.profile!.role, next));
  const dashboard = () => {
    if (auth.profile!.role === 'provider') return <ProviderDashboard onNavigate={go} onSelectListing={() => go('listings')} />;
    if (auth.profile!.role === 'ngo') return <NgoDashboard onSelectListing={(id) => navigate(`/ngo/food/${id}`)} />;
    return <VolunteerDashboard onSelectPickup={(id) => navigate(`/volunteer/pickup/${id}`)} />;
  };

  let content = dashboard();
  if (page === 'profile') content = <ProfilePage />;
  else if (page === 'impact') content = <ImpactPage />;
  else if (auth.profile.role === 'provider' && page === 'listings') content = <ProviderListings onNavigate={go} onSelectListing={() => go('listings')} />;
  else if (auth.profile.role === 'provider' && page === 'requests') content = <ProviderRequests />;
  else if (auth.profile.role === 'provider' && page === 'post-food') content = <PostFoodPage onBack={() => go('home')} onPosted={() => go('listings')} />;
  else if (auth.profile.role === 'ngo' && page === 'requests') content = <NgoRequests />;
  else if (auth.profile.role === 'ngo' && page === 'history') content = <NgoHistory />;
  else if (auth.profile.role === 'ngo' && page === 'food-details' && route.id) content = <FoodDetailsPage listingId={route.id} onBack={() => go('home')} onRequestComplete={() => go('requests')} />;
  else if (auth.profile.role === 'volunteer' && page === 'pickup-details' && route.id) content = <PickupDetailsPage pickupId={route.id} onBack={() => go('home')} onUpdate={() => go('home')} />;
  else if (auth.profile.role === 'volunteer' && page === 'pickups') content = dashboard();

  return <AppLayout activePage={page} onNavigate={go}>{content}</AppLayout>;
}

function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}

export default App;
