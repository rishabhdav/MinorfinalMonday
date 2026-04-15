import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const themeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 shadow-xl transition-all duration-300">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link
            to="/"
            className="text-3xl font-bold text-white hover:text-blue-100 transition-colors duration-200 flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">D</span>
            </div>
            <span>Diabetes Detector</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-white/90 text-sm">Hi, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
                >
                  Register
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-110 shadow-lg"
              aria-label={themeLabel}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/cnn-retinanet"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              CNN
            </Link>
            <Link
              to="/resnet-classifier"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              ResNet
            </Link>
            <Link
              to="/efficientnet-classifier"
              className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              EfficientNet
            </Link>
            {isAuthenticated && (
              <Link
                to="/predictions-history"
                className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                History
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
