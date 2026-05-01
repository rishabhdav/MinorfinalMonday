import { Link } from 'react-router-dom';

const OPTIONS = [
  {
    title: 'All Users',
    description: 'See all user information including profile details and contact data.',
    path: '/admin/users',
    accent: 'from-sky-500 to-blue-600',
    kicker: 'Directory',
    detail: 'Profiles, contacts, roles, and account details in one place.',
  },
  {
    title: 'All Users History',
    description: 'Review all users predictions, add review notes, and send report emails.',
    path: '/admin/history',
    accent: 'from-emerald-500 to-green-600',
    kicker: 'Review Flow',
    detail: 'Open reports, add notes, confirm or reject predictions, and email users.',
  },
  {
    title: 'Model Usage',
    description: 'See how many users are using each model and total prediction usage by model.',
    path: '/admin/model-usage',
    accent: 'from-amber-500 to-orange-600',
    kicker: 'Analytics',
    detail: 'Compare prediction totals and unique-user counts for each model.',
  },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef8ff_45%,_#f5fbf8_100%)] dark:bg-[linear-gradient(180deg,_#0b1220_0%,_#111827_52%,_#0f172a_100%)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div>
              <span className="inline-flex rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200">
                Admin Panel
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Command Center</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Use the three admin sections to inspect all users, review complete history, and monitor how the prediction models are being used across the system.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white dark:bg-slate-800">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Option 1</p>
                <p className="mt-2 text-xl font-bold">All Users</p>
              </div>
              <div className="rounded-3xl bg-emerald-500 px-5 py-4 text-white shadow-lg shadow-emerald-500/20">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">Option 2</p>
                <p className="mt-2 text-xl font-bold">All History</p>
              </div>
              <div className="rounded-3xl bg-amber-500 px-5 py-4 text-white shadow-lg shadow-amber-500/20">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-100">Option 3</p>
                <p className="mt-2 text-xl font-bold">Model Usage</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {OPTIONS.map((option) => (
            <Link
              key={option.path}
              to={option.path}
              className="group overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_68px_rgba(14,165,233,0.14)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_rgba(2,6,23,0.35)]"
            >
              <div className={`h-2 w-full bg-gradient-to-r ${option.accent}`} />
              <div className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {option.kicker}
                    </span>
                    <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">{option.title}</h2>
                  </div>
                  <div className={`inline-flex rounded-2xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-lg ${option.accent}`}>
                    Open
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{option.description}</p>
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                  {option.detail}
                </div>
                <span className="mt-6 inline-flex text-sm font-semibold text-cyan-700 transition group-hover:translate-x-1 dark:text-cyan-300">
                  Open section
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
