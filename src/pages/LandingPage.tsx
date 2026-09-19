import { Package, ArrowRight, HeartHandshake, Truck, Utensils, Leaf, Sparkles } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: Props) {
  return (
    <div className="min-h-screen bg-ink-50 overflow-x-hidden">
      {/* Nav */}
      <nav className="absolute top-0 inset-x-0 z-10 px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Package className="h-5 w-5" />
          </div>
          <span className="font-bold text-ink-900 text-lg">FoodBridge</span>
        </div>
        <button onClick={onSignIn} className="btn-secondary text-sm">
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/80 via-ink-50 to-ink-50" />
        <div
          className="absolute top-20 right-10 -z-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute top-40 left-10 -z-10 h-64 w-64 rounded-full bg-accent-200/30 blur-3xl"
          aria-hidden
        />

        <div className="mx-auto max-w-4xl text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-ink-200 px-4 py-1.5 text-xs font-medium text-ink-600 shadow-sm mb-6">
            <Leaf className="h-3.5 w-3.5 text-brand-600" />
            Reducing food waste, one meal at a time
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-ink-900 tracking-tight leading-[1.1]">
            Share surplus.
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              Reduce waste.
            </span>
          </h1>
          <p className="mt-5 text-lg text-ink-600 max-w-xl mx-auto">
            Connect surplus food with communities that need it. FoodBridge links providers, NGOs, and
            volunteers in a single, simple flow.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onGetStarted} className="btn-primary text-base px-7 py-3 w-full sm:w-auto">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={onSignIn} className="btn-secondary text-base px-7 py-3 w-full sm:w-auto">
              I have an account
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-ink-900 mb-2">How it works</h2>
          <p className="text-center text-ink-500 mb-10">Three roles, one seamless journey.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Utensils,
                emoji: '🍱',
                title: 'Food Provider',
                desc: 'Post surplus food in minutes — quantity, type, pickup window, location.',
                color: 'brand',
              },
              {
                icon: HeartHandshake,
                emoji: '🤝',
                title: 'NGO / Community',
                desc: 'Browse available food nearby, request what fits, and track delivery.',
                color: 'accent',
              },
              {
                icon: Truck,
                emoji: '🚚',
                title: 'Volunteer',
                desc: 'Accept pickup tasks, collect from the provider, and deliver to the NGO.',
                color: 'blue',
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="card p-6 relative animate-fadeIn"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="absolute top-5 right-5 text-2xl">{step.emoji}</div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-ink-900 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-ink-500">{step.desc}</p>
                  <div className="mt-4 text-xs font-semibold text-ink-300">Step {i + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-5xl card p-8 bg-gradient-to-br from-brand-600 to-brand-700 border-0 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Meals rescued', value: '—' },
              { label: 'Active providers', value: '—' },
              { label: 'Pickups completed', value: '—' },
              { label: 'Communities reached', value: '—' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold">{s.value}</div>
                <div className="text-xs text-brand-100 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-brand-100/80 mt-6 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Stats update in real time as community members complete transactions.
          </p>
        </div>
      </section>

      <footer className="border-t border-ink-200 py-8 text-center text-sm text-ink-400">
        FoodBridge — built for a more sustainable, connected community.
      </footer>
    </div>
  );
}
