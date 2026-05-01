import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function NavLink({ to, label, active, admin = false }) {
  const activeClass = admin
    ? 'bg-white text-slate-900 shadow-[0_10px_30px_rgba(255,255,255,0.18)]'
    : 'bg-white text-slate-900 shadow-[0_10px_30px_rgba(255,255,255,0.18)]';
  const idleClass = admin
    ? 'bg-slate-950/25 text-white hover:bg-white/18 hover:text-white'
    : 'bg-slate-950/20 text-white hover:bg-white/20 hover:text-white';

  return (
    <Link
      to={to}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? activeClass : idleClass}`}
    >
      {label}
    </Link>
  );
}

function ThemeToggle({ theme, onToggle, label }) {
  const isLight = theme === 'light';

  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/20 px-2 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      aria-label={label}
    >
      <span className={`rounded-full px-3 py-1 transition ${isLight ? 'bg-white text-slate-900' : 'text-white/70'}`}>
        Light
      </span>
      <span className={`rounded-full px-3 py-1 transition ${!isLight ? 'bg-white text-slate-900' : 'text-white/70'}`}>
        Dark
      </span>
    </button>
  );
}

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const themeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  const patientLinks = [
    { to: '/cnn-retinanet', label: 'CNN' },
    { to: '/resnet-classifier', label: 'ResNet' },
    { to: '/efficientnet-classifier', label: 'EfficientNet' },
    ...(isAuthenticated ? [
      { to: '/predictions-history', label: 'History' },
      { to: '/models', label: 'Models' },
      { to: '/profile', label: 'Profile' },
    ] : []),
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/users', label: 'All Users' },
    { to: '/admin/history', label: 'All History' },
    { to: '/admin/model-usage', label: 'Model Usage' },
    { to: '/profile', label: 'Profile' },
  ];

  return (
    <header className={isAdmin
      ? 'border-b border-white/10 bg-[linear-gradient(135deg,_#06131f_0%,_#0f172a_40%,_#0b4a5f_100%)] shadow-[0_18px_50px_rgba(2,6,23,0.38)]'
      : 'border-b border-white/10 bg-[linear-gradient(135deg,_#0f766e_0%,_#0284c7_45%,_#1d4ed8_100%)] shadow-[0_18px_50px_rgba(14,116,144,0.22)] dark:bg-[linear-gradient(135deg,_#0f172a_0%,_#0c4a6e_45%,_#082f49_100%)]'}>
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
            <Link
              to="/"
              className="flex items-center gap-3 text-white transition-colors duration-200 hover:text-cyan-100"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${isAdmin ? 'border-white/30 bg-white text-slate-900' : 'border-white/20 bg-white text-sky-700'} shadow-lg`}>
                <span className="text-lg font-black">{isAdmin ? 'AD' : 'DR'}</span>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight sm:text-2xl">
                  {isAdmin ? 'Diabetes Detector Admin' : 'Diabetes Detector'}
                </p>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">
                  {isAdmin ? 'Clinical Review Console' : 'Retinopathy Screening Platform'}
                </p>
              </div>
            </Link>

            {isAuthenticated && (
              <div className={`inline-flex items-center gap-3 rounded-full border px-3 py-2 ${isAdmin ? 'border-white/12 bg-white/8 text-white' : 'border-white/15 bg-white/10 text-white'} backdrop-blur`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${isAdmin ? 'bg-white text-slate-900' : 'bg-white/20 text-white'}`}>
                  {(user?.fullName || user?.username || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{user?.fullName || user?.username}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">{user?.role || 'PATIENT'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="rounded-full bg-slate-950/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-50"
                >
                  Register
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isAdmin ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-950/20 text-white hover:bg-white/20'}`}
              >
                Logout
              </button>
            )}

            <ThemeToggle theme={theme} onToggle={toggleTheme} label={themeLabel} />
          </div>
        </div>

        <div className={`mt-4 rounded-[1.6rem] border px-3 py-3 ${isAdmin ? 'border-white/15 bg-black/20 backdrop-blur' : 'border-white/20 bg-white/12 backdrop-blur'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
              {isAdmin ? 'Admin Navigation' : 'Navigation'}
            </span>
            {(isAdmin ? adminLinks : patientLinks).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                label={link.label}
                admin={isAdmin}
                active={link.to === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(link.to)}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
