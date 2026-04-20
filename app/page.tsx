import Link from 'next/link';
import { ArrowRight, CalendarDays, MessageSquare, Route, Sparkles } from 'lucide-react';

const CORE_FEATURES = [
  {
    title: 'AI Study Companion',
    description: 'Run focused chat sessions, keep context, and continue conversations anytime.',
    icon: MessageSquare,
    tone: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  },
  {
    title: 'Calendar + Recurrence',
    description: 'Manage classes and events with rich recurring schedules and timezone-safe rendering.',
    icon: CalendarDays,
    tone: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
  },
  {
    title: 'Routine Extraction',
    description: 'Upload schedule images, review extracted classes, and sync approved data instantly.',
    icon: Route,
    tone: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(6,182,212,0.16),transparent_35%),radial-gradient(circle_at_60%_80%,rgba(245,158,11,0.14),transparent_35%)]" />

        <main className="relative container mx-auto max-w-7xl px-4 md:px-6 py-8 md:py-12">
          <header className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-4 md:p-5 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">LearnSync</p>
                <p className="text-xs text-muted-foreground">Academic Mission Control</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Open App
              </Link>
            </div>
          </header>

          <section className="pt-12 md:pt-16 pb-10 md:pb-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Built For Students & Teams
              </p>
              <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-tight text-balance">
                Plan less,
                <span className="block text-primary">execute more.</span>
              </h1>
              <p className="mt-4 md:mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                LearnSync combines AI chat, calendar planning, routines, and messaging into one workspace so your study flow and schedule stay aligned.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 font-semibold hover:opacity-90 transition-opacity"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card/80 px-5 py-3 font-semibold hover:bg-accent transition-colors"
                >
                  Continue To Dashboard
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 pb-12 md:pb-16">
            {CORE_FEATURES.map((feature, idx) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-border/80 bg-card/75 backdrop-blur p-5 md:p-6 theme-shadow animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${120 + idx * 80}ms` }}
              >
                <div
                  className={`h-11 w-11 rounded-xl border bg-linear-to-br ${feature.tone} flex items-center justify-center`}
                >
                  <feature.icon className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
