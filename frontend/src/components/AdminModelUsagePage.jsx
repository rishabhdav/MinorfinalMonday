import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const MODEL_COLORS = ['#0ea5e9', '#10b981', '#f59e0b'];

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString();
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ModelBarChart({ title, subtitle, data }) {
  const entries = Object.entries(data || {});
  const maxValue = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <svg width="100%" height="280" viewBox="0 0 640 280" className="min-w-[560px]">
          <line x1="60" y1="220" x2="600" y2="220" stroke="#cbd5e1" strokeWidth="2" />
          {entries.map(([model, count], index) => {
            const barWidth = 110;
            const gap = 60;
            const x = 80 + index * (barWidth + gap);
            const barHeight = maxValue === 0 ? 0 : Math.round((count / maxValue) * 150);
            const y = 220 - barHeight;
            const color = MODEL_COLORS[index % MODEL_COLORS.length];

            return (
              <g key={model}>
                <text x={x + barWidth / 2} y={y - 12} fontSize="16" fontWeight="700" textAnchor="middle" fill="#0f172a">
                  {count}
                </text>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="18" fill={color} />
                <text x={x + barWidth / 2} y="248" fontSize="15" fontWeight="600" textAnchor="middle" fill="#475569">
                  {model.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {entries.map(([model, count], index) => (
          <div key={model} className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/40">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length] }}
              />
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">{model}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminModelUsagePage() {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/admin/model-usage`, {
          headers: {
            ...getAuthHeaders(),
          },
        });

        if (!response.ok) {
          throw new Error(`Model usage request failed with status ${response.status}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load model usage');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getAuthHeaders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <span className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Admin Option 3
          </span>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">Model Usage</h1>
          <p className="mt-3 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            See how many predictions were made per model and how many users used each model.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Loading model usage...
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <MetricCard label="Total users" value={stats?.totalUsers ?? 0} />
              <MetricCard label="Total predictions" value={stats?.totalPredictions ?? 0} />
              <MetricCard label="Latest prediction" value={formatDate(stats?.latestPredictionAt)} />
            </div>

            <div className="grid gap-6">
              <ModelBarChart
                title="Total Predictions Per Model"
                subtitle="This graph shows the total number of predictions made by each model."
                data={stats?.predictionUsageByModel}
              />
              <ModelBarChart
                title="Total Users Per Model"
                subtitle="This graph shows how many unique users used each model."
                data={stats?.userUsageByModel}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
