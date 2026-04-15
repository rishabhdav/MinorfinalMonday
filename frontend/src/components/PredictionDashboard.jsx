import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const ACCENT_STYLES = {
  blue: {
    page: 'from-sky-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    button: 'from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800',
    border: 'border-sky-400',
    drag: 'bg-sky-50 dark:bg-sky-900/20',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
  },
  green: {
    page: 'from-emerald-50 via-white to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    button: 'from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800',
    border: 'border-emerald-400',
    drag: 'bg-emerald-50 dark:bg-emerald-900/20',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
  },
  amber: {
    page: 'from-amber-50 via-white to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    button: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    border: 'border-amber-400',
    drag: 'bg-amber-50 dark:bg-amber-900/20',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  },
};

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

function PredictionDashboard({ modelKey, modelName, title, description, accent = 'blue' }) {
  const { getAuthHeaders } = useAuth();
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const styles = useMemo(() => ACCENT_STYLES[accent] || ACCENT_STYLES.blue, [accent]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/predictions?page=0&size=12`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`History request failed with status ${response.status}`);
      }

      const data = await response.json();
      setHistory(Array.isArray(data?.predictions) ? data.predictions : []);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
    }
  };

  const detectDisease = async () => {
    if (!image) {
      return;
    }

    setLoading(true);
    setResult(null);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('model', modelKey);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Prediction failed with status ${response.status}`);
      }

      const data = await response.json();
      setResult({
        ...data,
        modelName,
      });
      await fetchHistory();
    } catch (error) {
      setErrorMessage(error.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${styles.page}`}>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 text-center">
          <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${styles.badge}`}>
            Backend-synced model
          </span>
          <h1 className="mt-4 text-5xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-300">{description}</p>
          <div className="mt-5">
            <Link
              to="/predictions-history"
              className={`inline-flex items-center rounded-xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-lg transition ${styles.button}`}
            >
              View Full History
            </Link>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              dragOver ? `${styles.border} ${styles.drag}` : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {image ? image.name : 'Drop a retinal image here or click to browse'}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Supported formats: JPG, PNG, GIF</p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected retinal scan"
                className="h-64 w-full max-w-md rounded-2xl object-cover shadow-md"
              />
            )}

            <button
              type="button"
              onClick={detectDisease}
              disabled={!image || loading}
              className={`rounded-xl bg-gradient-to-r px-10 py-4 text-lg font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
            >
              {loading ? 'Analyzing...' : 'Run Prediction'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        {result && (
          <div className="mb-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prediction Result</h2>
              {result.imageUrl && (
                <img
                  src={result.imageUrl}
                  alt="Prediction result"
                  className="mt-5 h-72 w-full rounded-2xl object-cover"
                />
              )}
              <div className="mt-6 space-y-3 text-gray-700 dark:text-gray-200">
                <p><span className="font-semibold">Class:</span> {result.className || 'Unknown'}</p>
                <p><span className="font-semibold">Class ID:</span> {result.classId ?? 'N/A'}</p>
                <p><span className="font-semibold">Confidence:</span> {formatConfidence(result.confidence)}</p>
                <p><span className="font-semibold">Review status:</span> {result.reviewStatus || 'N/A'}</p>
                <p><span className="font-semibold">Created:</span> {formatDate(result.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Probabilities</h2>
              {Array.isArray(result.probabilities?.[0]) ? (
                <div className="mt-6 space-y-4">
                  {result.probabilities[0].map((value, index) => (
                    <div key={index}>
                      <div className="mb-1 flex justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>Class {index}</span>
                        <span>{formatConfidence(value)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-3 rounded-full bg-gray-900 dark:bg-white"
                          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-gray-500 dark:text-gray-400">No probability matrix returned for this prediction.</p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Prediction History</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest saved predictions from `/api/predictions`.</p>
            </div>
            {historyLoading && <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {!historyLoading && history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No saved predictions yet.
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={`Prediction ${item.id}`} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                      No image available
                    </div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-gray-900 dark:text-white">{item.className || 'Unknown'}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles.badge}`}>
                        {item.reviewStatus || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Confidence: {formatConfidence(item.confidence)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictionDashboard;
