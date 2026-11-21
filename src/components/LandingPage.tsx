import React from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bug,
  ChartNoAxesCombined,
  Check,
  CircleCheck,
  Code2,
  Database,
  FileSearch,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Network,
  ScanLine,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { RuleDefinition } from '../engine/types';

interface LandingPageProps {
  rules: RuleDefinition[];
  onGetStarted: () => void;
  onViewDemo: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const capabilities: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}[] = [
  {
    icon: ScanLine,
    title: 'Detection engine',
    description:
      '12 deterministic DPDP rules inspect Node.js, Express and PostgreSQL. AI never decides whether a finding exists.',
    tone: 'violet',
  },
  {
    icon: Activity,
    title: 'Risk scoring',
    description:
      'A clear risk score is calculated from findings and recalculated after each verified fix.',
    tone: 'blue',
  },
  {
    icon: Network,
    title: 'Privacy Flow Graph',
    description:
      'Trace personal data from API route to controller, database field and logger or external sink.',
    tone: 'cyan',
  },
  {
    icon: GitBranch,
    title: 'Repository intake',
    description:
      'Connect a GitHub repository or upload a ZIP. Review source in the built-in viewer and start the first scan.',
    tone: 'blue',
  },
  {
    icon: FileSearch,
    title: 'Findings management',
    description:
      'Search, sort and filter findings, inspect source evidence, then triage with Admin or Security Analyst access.',
    tone: 'amber',
  },
  {
    icon: Wrench,
    title: 'AI fix generator',
    description:
      'Review bounded Gemini patch suggestions in a diff viewer, with deterministic offline templates as fallback.',
    tone: 'violet',
  },
  {
    icon: CircleCheck,
    title: 'Verified resolution',
    description:
      'A finding is resolved only after its patch is applied in a sandbox and a fresh scan passes.',
    tone: 'green',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Security dashboard',
    description:
      'See KPIs, scan history, severity charts and live filters together in one workspace.',
    tone: 'blue',
  },
  {
    icon: UserRound,
    title: 'Authentication & access',
    description:
      'Use login and registration with role-based access for Admins, Security Analysts and Developers.',
    tone: 'violet',
  },
  {
    icon: LockKeyhole,
    title: 'Security & governance',
    description:
      'Track 10 security controls, live runtime checks, audit logs and report exports.',
    tone: 'green',
  },
  {
    icon: Bug,
    title: 'Scanner tests',
    description:
      'Unit tests cover the deterministic scanner engine so rule behavior stays reviewable.',
    tone: 'amber',
  },
];

const flowSteps = [
  { icon: GitBranch, label: 'Connect a repository', detail: 'GitHub or ZIP upload' },
  { icon: ScanLine, label: 'Run deterministic rules', detail: 'Evidence at file and line' },
  { icon: Wrench, label: 'Review, patch, rescan', detail: 'Verify before resolution' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  rules,
  onGetStarted,
  onViewDemo,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-10">
          <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="PrivacyLint home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-700 text-white shadow-lg shadow-violet-200">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-950">
              Privacy<span className="text-violet-700">Lint</span>
            </span>
          </a>

          <nav aria-label="Primary navigation" className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#capabilities" className="transition hover:text-violet-700">Platform</a>
            <a href="#how-it-works" className="transition hover:text-violet-700">How it works</a>
            <a href="#trust" className="transition hover:text-violet-700">Security</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="group inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-800 sm:pl-1.5 sm:pr-3"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 transition group-hover:bg-violet-100">
                <UserRound className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">Admin login</span>
              <span className="sm:hidden">Login</span>
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-full bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-800 sm:px-5"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[660px] bg-[radial-gradient(ellipse_at_76%_18%,rgba(196,181,253,0.55),transparent_36%),linear-gradient(180deg,#fff_0%,#f7f8fc_100%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:pb-24 lg:pt-24">
            <div className="lg:col-span-6">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-violet-800 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Privacy risk, made visible
              </div>

              <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[3.65rem]">
                Find the data leaks hiding in your code.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Scan your application, trace personal data across its journey, and verify every fix before it is marked resolved.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onViewDemo}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-800"
                >
                  Open live dashboard <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-800"
                >
                  See how it works <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> {rules.length} deterministic rules</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Evidence-first findings</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> DPDP Act mapping</span>
              </div>
            </div>

            <div className="relative lg:col-span-6 lg:pl-3">
              <div aria-hidden="true" className="absolute -inset-7 -z-10 rounded-[3rem] bg-violet-200/50 blur-3xl" />
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_80px_-32px_rgba(50,35,90,0.35)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Shield className="h-5 w-5" /></span>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Privacy overview</div>
                      <div className="mt-0.5 text-xs text-slate-500">Demo workspace · payments-api</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Scan complete</span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 sm:p-6">
                  <div className="rounded-2xl bg-[#f7f5ff] p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      Risk score <ChartNoAxesCombined className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-950">68</span>
                      <span className="pb-1 text-xs font-medium text-slate-500">/ 100</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-violet-100">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
                    </div>
                    <div className="mt-2 text-xs font-semibold text-violet-800">Needs attention</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      Open findings <FileSearch className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-950">12</span>
                      <span className="pb-1 text-xs font-medium text-slate-500">across 4 levels</span>
                    </div>
                    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-200">
                      <span className="w-1/4 bg-rose-500" /><span className="w-1/4 bg-orange-400" /><span className="w-1/4 bg-amber-300" /><span className="w-1/4 bg-slate-300" />
                    </div>
                    <div className="mt-2 text-xs font-semibold text-slate-600">4 critical · 5 high</div>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">Personal data flow</div>
                        <div className="mt-1 text-xs text-slate-500">Trace the path. Find the risky sink.</div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800"><Network className="h-3.5 w-3.5" /> Flow graph</span>
                    </div>
                    <div className="mt-5 grid grid-cols-7 items-center gap-0.5 sm:gap-2">
                      {[
                        { icon: Code2, label: 'API route', value: '/checkout', color: 'text-blue-700 bg-blue-50' },
                        { icon: GitBranch, label: 'Controller', value: 'checkout.ts', color: 'text-violet-700 bg-violet-50' },
                        { icon: Database, label: 'Database', value: 'customer.pan', color: 'text-amber-700 bg-amber-50' },
                        { icon: LockKeyhole, label: 'Log sink', value: 'Unredacted', color: 'text-rose-700 bg-rose-50' },
                      ].map((node, index) => {
                        const Icon = node.icon;
                        return (
                          <React.Fragment key={node.label}>
                            <div className="min-w-0">
                              <div className={`mx-auto grid h-9 w-9 place-items-center rounded-xl ${node.color}`}><Icon className="h-4 w-4" /></div>
                              <div className="mt-2 truncate text-center text-[10px] font-semibold text-slate-500 sm:text-xs">{node.label}</div>
                              <div className="mt-0.5 truncate text-center text-[10px] font-bold text-slate-800 sm:text-[11px]">{node.value}</div>
                            </div>
                            {index < 3 && <span aria-hidden="true" className="-mt-7 text-center text-slate-300">→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 text-xs sm:px-6">
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-600"><Sparkles className="h-4 w-4 text-violet-600" /> Deterministic scan · 12 rules active</span>
                  <button type="button" onClick={onViewDemo} className="shrink-0 font-bold text-violet-700 hover:text-violet-900">Explore demo <span aria-hidden="true">↗</span></button>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-2 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-300/50 sm:flex lg:-left-8">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CircleCheck className="h-5 w-5" /></span>
                <span><span className="block text-xs font-bold text-slate-900">Fix verified</span><span className="block text-[11px] text-slate-500">Fresh scan passed</span></span>
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">One privacy workspace</div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Everything from first scan to verified fix</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">A focused toolkit for developers and security teams to find, understand and resolve privacy risks.</p>
            </div>

            <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((capability) => {
                const Icon = capability.icon;
                const toneClasses: Record<string, string> = {
                  violet: 'bg-violet-100 text-violet-700',
                  blue: 'bg-blue-100 text-blue-700',
                  cyan: 'bg-cyan-100 text-cyan-700',
                  amber: 'bg-amber-100 text-amber-700',
                  green: 'bg-emerald-100 text-emerald-700',
                };
                return (
                  <article key={capability.title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/60 sm:p-6">
                    <div className={`grid h-11 w-11 place-items-center rounded-2xl ${toneClasses[capability.tone]}`}><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-5 text-base font-bold text-slate-950">{capability.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{capability.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-[#111027] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-300">A clear review loop</div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">From repository to safer code.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">PrivacyLint keeps detection evidence-based and makes every resolution verifiable.</p>
              <button type="button" onClick={onViewDemo} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-violet-900 transition hover:bg-violet-100">
                Explore the workspace <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-8">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.label} className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-400/15 text-violet-200"><Icon className="h-5 w-5" /></span>
                      <span className="font-mono text-xs font-bold text-violet-300">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-sm font-bold text-white">{step.label}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{step.detail}</p>
                    {index < flowSteps.length - 1 && <ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-violet-300 sm:block" />}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="trust" className="scroll-mt-24 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-[1.75rem] border border-violet-100 bg-white p-6 shadow-sm sm:p-9 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span>
                <div className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">Built for trustworthy reviews</div>
              </div>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">AI can help with a fix. Evidence decides the finding.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">The scanner uses deterministic rules. Suggested patches stay reviewable, and a fresh sandbox scan must pass before a finding is resolved.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
              {[
                { icon: KeyRound, title: 'Role-based access', body: 'Admin, Security Analyst and Developer roles.' },
                { icon: LockKeyhole, title: 'Protected sessions', body: 'Hashed passwords and signed HttpOnly cookies.' },
                { icon: Upload, title: 'Practical intake', body: 'Connect GitHub or upload a source ZIP.' },
                { icon: Database, title: 'DPDP-aware workflow', body: 'Findings mapped for engineering triage.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                    <span className="mt-0.5 text-violet-700"><Icon className="h-4 w-4" /></span>
                    <div><h3 className="text-sm font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{item.body}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[1.75rem] bg-gradient-to-r from-violet-700 to-indigo-700 p-7 text-white shadow-xl shadow-violet-200 sm:flex-row sm:items-center sm:p-10">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-200">Start with a scan</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Know where personal data goes.</h2>
              <p className="mt-2 text-sm text-violet-100">Review a sample workspace or sign in to your team workspace.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onViewDemo} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-50">Open demo <ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => onOpenAuth('login')} className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Admin login</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <a href="#top" className="flex items-center gap-2 font-bold text-slate-800"><span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-700 text-white"><Shield className="h-4 w-4" /></span> PrivacyLint</a>
          <span>Privacy risk analysis for modern application teams · DPDP Act 2023 mapping</span>
          <button type="button" onClick={() => onOpenAuth('login')} className="font-bold text-violet-700 hover:text-violet-900">Sign in to workspace</button>
        </div>
      </footer>
    </div>
  );
};
