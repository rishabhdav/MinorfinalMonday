import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TOKEN_EXPIRY_BUFFER_MS = 5000;

function parseJwtPayload(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch (error) {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + TOKEN_EXPIRY_BUFFER_MS;
}

function getTokenExpiryDelay(token) {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return 0;
  }

  return Math.max(0, payload.exp * 1000 - Date.now() - TOKEN_EXPIRY_BUFFER_MS);
}

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
  getAuthHeaders: () => ({}),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    const storedToken = localStorage.getItem('authToken');

    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          localStorage.removeItem('authUser');
        }
      }
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }

    setIsInitialized(true);
  }, []);

  // Persist user to localStorage
  useEffect(() => {
    if (isInitialized) {
      if (user) {
        localStorage.setItem('authUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('authUser');
      }
    }
  }, [user, isInitialized]);

  // Persist token to localStorage
  useEffect(() => {
    if (isInitialized) {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }, [token, isInitialized]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    if (isTokenExpired(token)) {
      setUser(null);
      setToken(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setUser(null);
      setToken(null);
      setError('Your session has expired. Please log in again.');
    }, getTokenExpiryDelay(token));

    return () => window.clearTimeout(timeoutId);
  }, [token]);

  const isAuthenticated = Boolean(user && token);

  const login = useCallback(async ({ username, password }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid username or password');
        }
        throw new Error(`Login failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.accessToken) {
        throw new Error('No access token received from server');
      }

      if (isTokenExpired(data.accessToken)) {
        throw new Error('Received an expired access token');
      }

      setUser({ username });
      setToken(data.accessToken);

      return { success: true, user: { username }, token: data.accessToken };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during login';
      setError(errorMessage);
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('Username already exists');
        }
        throw new Error(`Registration failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.accessToken) {
        throw new Error('No access token received from server');
      }

      if (isTokenExpired(data.accessToken)) {
        throw new Error('Received an expired access token');
      }

      setUser({ username, email });
      setToken(data.accessToken);

      return { success: true, user: { username, email }, token: data.accessToken };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during registration';
      setError(errorMessage);
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAuthHeaders = useCallback(() => {
    if (!token || isTokenExpired(token)) {
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    logout,
    clearError,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
