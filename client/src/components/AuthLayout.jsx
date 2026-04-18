/**
 * Shared shell for login / signup — dark “glass” aesthetic with soft gradients.
 */
const AuthLayout = ({ title, subtitle, children, footer }) => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(139, 92, 246, 0.2), transparent), radial-gradient(ellipse 50% 30% at 0% 100%, rgba(14, 165, 233, 0.15), transparent)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22none%22%20stroke%3D%22rgb(148%20163%20184%20%2F%200.06%29%22%3E%3Cpath%20d%3D%22M0%20.5H32M0%208.5H32M0%2016.5H32M0%2024.5H32M.5%200V32M8.5%200V32M16.5%200V32M24.5%200V32%22%2F%3E%3C%2Fsvg%3E')] opacity-40" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 text-center sm:mb-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-sm text-sm text-slate-400 sm:text-base">{subtitle}</p>}
        </div>

        <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-white/5">
          {children}
        </div>

        {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </div>
  );
};

export default AuthLayout;
