import { useEffect, useMemo, useState } from 'react';
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
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'CONFIRMED', label: 'Confirmed' },
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
  const { getAuthHeaders, user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [savingReviewId, setSavingReviewId] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    scope: user?.role === 'ADMIN' ? 'all' : 'mine',
    model: 'all',
    reviewStatus: 'all',
    username: '',
    date: '',
  });
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [emailDrafts, setEmailDrafts] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const canReviewAll = user?.role === 'ADMIN';

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const searchParams = new URLSearchParams({ page: '0', size: '50', scope: filters.scope });
      if (filters.model !== 'all') {
        searchParams.set('model', filters.model);
      }
      if (filters.reviewStatus !== 'all') {
        searchParams.set('reviewStatus', filters.reviewStatus);
      }
      if (canReviewAll && filters.scope === 'all' && filters.username && filters.username.trim() !== '') {
        searchParams.set('username', filters.username.trim());
      }

      const endpoint = (canReviewAll && filters.scope === 'all') ? `${API_BASE_URL}/admin/predictions` : `${API_BASE_URL}/predictions`;

      const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.scope, filters.model, filters.reviewStatus, filters.username, getAuthHeaders, canReviewAll]);

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

  const handleReviewDraftChange = (predictionId, field, value) => {
    setReviewDrafts((current) => ({
      ...current,
      [predictionId]: {
        reviewStatus: current[predictionId]?.reviewStatus || 'REVIEWED',
        reviewNotes: current[predictionId]?.reviewNotes || '',
        [field]: value,
      },
    }));
  };

  const handleReviewSave = async (predictionId) => {
    const draft = reviewDrafts[predictionId] || { reviewStatus: 'REVIEWED', reviewNotes: '' };
    setSavingReviewId(predictionId);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/predictions/${predictionId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error(`Review update failed with status ${response.status}`);
      }

      const updated = await response.json();
      setHistory((current) => current.map((item) => (item.id === predictionId ? updated : item)));
    } catch (reviewError) {
      setError(reviewError.message || 'Unable to update review');
    } finally {
      setSavingReviewId(null);
    }
  };

  const handleEmailDraftChange = (predictionId, field, value) => {
    setEmailDrafts((current) => ({
      ...current,
      [predictionId]: {
        subject: current[predictionId]?.subject || 'Your diabetic retinopathy report',
        message: current[predictionId]?.message || '',
        [field]: value,
      },
    }));
  };

  const handleSendEmail = async (predictionId) => {
    const draft = emailDrafts[predictionId] || {
      subject: 'Your diabetic retinopathy report',
      message: '',
    };
    setSendingEmailId(predictionId);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/predictions/${predictionId}/email-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        let message = `Email send failed with status ${response.status}`;
        try {
          const body = await response.json();
          if (body?.message) {
            message = body.message;
          }
        } catch {
        }
        throw new Error(message);
      }
    } catch (emailError) {
      setError(emailError.message || 'Unable to send report email');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDownloadReport = async (predictionId) => {
    setDownloadingId(predictionId);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/predictions/${predictionId}/report`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `prediction-${predictionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredHistory = history.filter((item) => matchesDateFilter(item.createdAt, filters.date));
  const summary = useMemo(() => ({
    total: filteredHistory.length,
    pending: filteredHistory.filter((item) => item.reviewStatus === 'PENDING_REVIEW').length,
    reviewed: filteredHistory.filter((item) => item.reviewStatus === 'REVIEWED').length,
    confirmed: filteredHistory.filter((item) => item.reviewStatus === 'CONFIRMED').length,
  }), [filteredHistory]);

  return (
    <div className={canReviewAll
      ? 'min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,_#f7fcfb_0%,_#edf7ff_50%,_#f8fbff_100%)] dark:bg-[linear-gradient(180deg,_#0b1220_0%,_#111827_52%,_#0f172a_100%)]'
      : 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className={canReviewAll
          ? 'mb-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]'
          : 'mb-10'}>
          <div className={canReviewAll ? 'grid gap-8 lg:grid-cols-[1.3fr_1fr]' : ''}>
            <div>
              <span className="inline-flex rounded-full bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200">
                {canReviewAll ? 'Admin Option 2' : 'Saved predictions'}
              </span>
              <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
                {canReviewAll ? 'All Users History' : 'Prediction History'}
              </h1>
              <p className="mt-3 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
                {canReviewAll
                  ? 'Review all users history here, add review notes, and send report emails to users.'
                  : 'Review your saved prediction history.'}
              </p>
            </div>

            {canReviewAll && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Records</p>
                  <p className="mt-2 text-3xl font-bold">{summary.total}</p>
                </div>
                <div className="rounded-3xl bg-emerald-500 px-5 py-4 text-white shadow-lg shadow-emerald-500/20">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">Pending</p>
                  <p className="mt-2 text-3xl font-bold">{summary.pending}</p>
                </div>
                <div className="rounded-3xl bg-sky-500 px-5 py-4 text-white shadow-lg shadow-sky-500/20">
                  <p className="text-xs uppercase tracking-[0.22em] text-sky-100">Reviewed</p>
                  <p className="mt-2 text-3xl font-bold">{summary.reviewed}</p>
                </div>
                <div className="rounded-3xl bg-amber-500 px-5 py-4 text-white shadow-lg shadow-amber-500/20">
                  <p className="text-xs uppercase tracking-[0.22em] text-amber-100">Confirmed</p>
                  <p className="mt-2 text-3xl font-bold">{summary.confirmed}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`mb-8 grid gap-4 rounded-[1.75rem] border p-6 shadow-lg ${canReviewAll ? 'border-slate-200/80 bg-white/85 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'} md:grid-cols-4`}>
          {canReviewAll && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scope</span>
              <select
                name="scope"
                value={filters.scope}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
              >
                <option value="mine">My predictions</option>
                <option value="all">All patients</option>
              </select>
            </label>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</span>
            <select
              name="model"
              value={filters.model}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {canReviewAll && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</span>
              <input
                type="text"
                name="username"
                value={filters.username}
                onChange={handleFilterChange}
                placeholder="Optional: filter by username"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
              />
            </label>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Review status</span>
            <select
              name="reviewStatus"
              value={filters.reviewStatus}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-950"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setFilters({ scope: user?.role === 'ADMIN' ? 'all' : 'mine', model: 'all', reviewStatus: 'all', username: '', date: '' })}
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
                className={`overflow-hidden rounded-[1.8rem] border shadow-lg ${canReviewAll ? 'border-slate-200/80 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_18px_45px_rgba(2,6,23,0.35)]' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={`Prediction ${item.id}`} className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    No image available
                  </div>
                )}

                <div className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.className || 'Unknown result'}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Prediction ID: {item.id}</p>
                      {canReviewAll && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Patient: {item.patientName || item.username} {item.patientAge ? `| Age ${item.patientAge}` : ''} {item.patientEmail ? `| ${item.patientEmail}` : ''}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200">
                      {item.reviewStatus || 'N/A'}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                      <p><span className="font-semibold">Model:</span> {item.modelName || 'N/A'}</p>
                      <p className="mt-2"><span className="font-semibold">Class ID:</span> {item.classId ?? 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                      <p><span className="font-semibold">Confidence:</span> {formatConfidence(item.confidence)}</p>
                      <p className="mt-2"><span className="font-semibold">Created:</span> {formatDate(item.createdAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800/70 dark:text-slate-300 sm:col-span-2">
                      <p><span className="font-semibold">Reviewed by:</span> {item.reviewedBy || 'Not reviewed'}</p>
                      <p className="mt-2"><span className="font-semibold">Notes:</span> {item.reviewNotes || 'No notes added'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {item.imageUrl && (
                      <a
                        href={item.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        Open image
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownloadReport(item.id)}
                      disabled={downloadingId === item.id}
                      className="inline-flex items-center rounded-xl border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-white dark:text-white dark:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingId === item.id ? 'Downloading...' : 'Download PDF'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  {canReviewAll && (
                    <div className="mt-4 space-y-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-900/40">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin Review</p>
                      <select
                        value={reviewDrafts[item.id]?.reviewStatus || item.reviewStatus || 'REVIEWED'}
                        onChange={(event) => handleReviewDraftChange(item.id, 'reviewStatus', event.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="REVIEWED">Reviewed</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <textarea
                        rows="3"
                        value={reviewDrafts[item.id]?.reviewNotes ?? item.reviewNotes ?? ''}
                        onChange={(event) => handleReviewDraftChange(item.id, 'reviewNotes', event.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Add clinical review notes"
                      />
                      <button
                        type="button"
                        onClick={() => handleReviewSave(item.id)}
                        disabled={savingReviewId === item.id}
                        className="inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingReviewId === item.id ? 'Saving...' : 'Save review'}
                      </button>
                      <input
                        type="text"
                        value={emailDrafts[item.id]?.subject || 'Your diabetic retinopathy report'}
                        onChange={(event) => handleEmailDraftChange(item.id, 'subject', event.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Email subject"
                      />
                      <textarea
                        rows="4"
                        value={emailDrafts[item.id]?.message || ''}
                        onChange={(event) => handleEmailDraftChange(item.id, 'message', event.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Add suggestions for the user"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendEmail(item.id)}
                        disabled={sendingEmailId === item.id}
                        className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingEmailId === item.id ? 'Sending...' : 'Send report email'}
                      </button>
                    </div>
                  )}
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
