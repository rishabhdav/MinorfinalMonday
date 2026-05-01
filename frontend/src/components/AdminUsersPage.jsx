import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
}

function getInitials(name, username) {
  const source = name || username || 'U';
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default function AdminUsersPage() {
  const { getAuthHeaders } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: {
            ...getAuthHeaders(),
          },
        });

        if (!response.ok) {
          throw new Error(`Users request failed with status ${response.status}`);
        }

        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [getAuthHeaders]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [
        user.username,
        user.fullName,
        user.email,
        user.phoneNumber,
        user.address,
        user.gender,
        user.role,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [search, users]);

  const patientCount = users.filter((user) => user.role === 'PATIENT').length;
  const adminCount = users.filter((user) => user.role === 'ADMIN').length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(180deg,_#f8fcff_0%,_#eef7fb_50%,_#f4fbf8_100%)] dark:bg-[linear-gradient(180deg,_#0f172a_0%,_#111827_50%,_#0b1220_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                Admin Option 1
              </span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                All User Information
              </h1>
              <p className="mt-3 text-lg leading-8 text-slate-600 dark:text-slate-300">
                A cleaner overview of every registered user with profile details, contact data, and account role.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-lg dark:bg-slate-800">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Total Users</p>
                <p className="mt-2 text-3xl font-bold">{users.length}</p>
              </div>
              <div className="rounded-3xl bg-emerald-500 px-5 py-4 text-white shadow-lg shadow-emerald-500/20">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-50">Patients</p>
                <p className="mt-2 text-3xl font-bold">{patientCount}</p>
              </div>
              <div className="rounded-3xl bg-sky-500 px-5 py-4 text-white shadow-lg shadow-sky-500/20">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-50">Admins</p>
                <p className="mt-2 text-3xl font-bold">{adminCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Search Users</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Search by name, username, email, phone, role, gender, or address.
              </p>
            </div>
            <div className="w-full lg:max-w-md">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 dark:focus:bg-slate-800 dark:focus:ring-sky-950"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-10 text-center text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/90 p-10 text-center text-slate-500 shadow-lg dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
            No users found for this search.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <div
                key={user.username}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(14,165,233,0.16)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_18px_45px_rgba(2,6,23,0.35)]"
              >
                <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#0369a1_55%,_#10b981_100%)] p-6 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur">
                        {getInitials(user.fullName, user.username)}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{user.fullName || user.username}</h2>
                        <p className="text-sm text-white/80">@{user.username}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-white text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {user.role || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Email</p>
                      <p className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-white">{user.email || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{user.phoneNumber || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Age</p>
                      <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{user.age ?? 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Gender</p>
                      <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{user.gender || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Address</p>
                    <p className="mt-2 min-h-10 text-sm leading-6 text-slate-700 dark:text-slate-300">{user.address || 'N/A'}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Created</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{formatDate(user.createdAt)}</p>
                    </div>
                    <div className="rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                      Profile Active
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
