import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MODEL_LIST = [
  { key: 'cnn', name: 'CNN', path: '/cnn-retinanet' },
  { key: 'resnet', name: 'ResNet', path: '/resnet-classifier' },
  { key: 'efficientnet', name: 'EfficientNet', path: '/efficientnet-classifier' },
];

export default function Models() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(user?.role === 'ADMIN');
  }, [user]);

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-4">ML Models</h1>
        <p className="mb-6 text-gray-600">Available ML models and quick links (admin view).</p>
        <div className="grid gap-4 md:grid-cols-3">
          {MODEL_LIST.map((m) => (
            <div key={m.key} className="rounded-2xl border p-6 bg-white shadow-sm dark:bg-gray-800">
              <h2 className="text-lg font-semibold">{m.name}</h2>
              <p className="text-sm text-gray-500 mb-4">Model key: {m.key}</p>
              <Link to={m.path} className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Open model page
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
