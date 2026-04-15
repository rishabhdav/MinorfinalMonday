import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const MODEL_OPTIONS = [
  { value: 'all', label: 'All models' },
  { value: 'cnn', label: 'CNN' },
  { value: 'resnet', label: 'ResNet' },
  { value: 'efficientnet', label: 'EfficientNet' },
];

const REVIEW_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
];

function formatConfidence(value) {
  return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : 'N/A';
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString();
}

function matchesDateFilter(value, dateFilter) {
  if (!dateFilter) {
    return true;
  }

  if (!value) {
    return false;
  }

  return new Date(value).toISOString().slice(0, 10) === dateFilter;
}

function PredictionHistory() {
  const { getAuthHeaders } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    model: 'all',
    reviewStatus: 'all',
    date: '',
  });

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const searchParams = new URLSearchParams({ page: '0', size: '50' });
      if (filters.model !== 'all') {
        searchParams.set('model', filters.model);
      }
      if (filters.reviewStatus !== 'all') {
        searchParams.set('reviewStatus', filters.reviewStatus);
      }

      const response = await fetch(`${API_BASE_URL}/predictions?${searchParams.toString()}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        let message = `History request failed with status ${response.status}`;
        try {
          const body = await response.json();
          if (body?.message) {
            message = body.message;
          }
        } catch {
          // Ignore parse errors and keep the fallback message.
        }
        throw new Error(message);
      }

      const data = await response.json();
      setHistory(Array.isArray(data?.predictions) ? data.predictions : []);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load prediction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters.model, filters.reviewStatus, getAuthHeaders]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleDelete = async (predictionId) => {
    setDeletingId(predictionId);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/predictions/${predictionId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        let message = `Delete failed with status ${response.status}`;
        try {
          const body = await response.json();
          if (body?.message) {
            message = body.message;
          }
        } catch {
          // Ignore parse errors and keep the fallback message.
        }
        throw new Error(message);
      }

      setHistory((current) => current.filter((item) => item.id !== predictionId));
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete prediction');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = history.filter((item) => matchesDateFilter(item.createdAt, filters.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <span className="inline-flex rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200">
            Saved predictions
          </span>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">Prediction History</h1>
          <p className="mt-3 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            Users can review their own uploaded images, ML results, and past prediction history here.
          </p>
        </div>

        <div className="mb-8 grid gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg md:grid-cols-4 dark:border-gray-700 dark:bg-gray-800">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</span>
            <select
              name="model"
              value={filters.model}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Review status</span>
            <select
              name="reviewStatus"
              value={filters.reviewStatus}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {REVIEW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</span>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFilters({ model: 'all', reviewStatus: 'all', date: '' })}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Reset filters
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Loading prediction history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            No saved predictions found for the selected filters.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={`Prediction ${item.id}`} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    No image available
                  </div>
                )}

                <div className="space-y-3 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.className || 'Unknown result'}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Prediction ID: {item.id}</p>
                    </div>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200">
                      {item.reviewStatus || 'N/A'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><span className="font-semibold">Model:</span> {item.modelName || 'N/A'}</p>
                    <p><span className="font-semibold">Class ID:</span> {item.classId ?? 'N/A'}</p>
                    <p><span className="font-semibold">Confidence:</span> {formatConfidence(item.confidence)}</p>
                    <p><span className="font-semibold">Created:</span> {formatDate(item.createdAt)}</p>
                    <p><span className="font-semibold">Reviewed by:</span> {item.reviewedBy || 'Not reviewed'}</p>
                    <p><span className="font-semibold">Notes:</span> {item.reviewNotes || 'No notes added'}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {item.imageUrl && (
                      <>
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          Open image
                        </a>
                        <a
                          href={item.imageUrl}
                          download={`prediction-${item.id}.jpg`}
                          className="inline-flex items-center rounded-xl border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white dark:text-white dark:hover:bg-white/10"
                        >
                          Download image
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
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

export default PredictionHistory;
