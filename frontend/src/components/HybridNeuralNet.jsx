import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function HybridNeuralNet() {
  const { getAuthHeaders } = useAuth();
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
    }
  };

  const detectDisease = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('http://localhost:8080/api/hybrid-neural-net', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // If the API returns no usable payload, show a static fallback response
      if (!data || Object.keys(data).length === 0) {
        setResult({
          model: 'Hybrid Neural Net',
          className: 'No response',
          classId: -1,
          confidence: 0,
          probabilities: [[0, 0, 0, 0, 0]],
          timestamp: new Date().toLocaleString(),
          error: 'No response received from the model API',
        });
        return;
      }

      setResult({
        model: 'Hybrid Neural Net',
        className: data.class_name,
        classId: data.class_id,
        confidence: data.confidence,
        probabilities: data.probabilities,
        timestamp: new Date().toLocaleString(),
      });
    } catch (error) {
      setResult({
        model: 'Hybrid Neural Net',
        className: 'Error',
        classId: -1,
        confidence: undefined,
        probabilities: undefined,
        timestamp: new Date().toLocaleString(),
        error: `Failed to process image: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">

      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full mb-6 shadow-lg">
            <span className="text-3xl">🔗</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Hybrid Neural Net
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Advanced CNN + RNN hybrid architecture for comprehensive temporal diabetic retinopathy analysis
          </p>
          <div className="flex justify-center items-center space-x-6 mt-6">
            <div className="flex items-center space-x-2 bg-cyan-100 dark:bg-cyan-900/30 px-4 py-2 rounded-full">
              <span className="text-cyan-600 dark:text-cyan-400">🧠</span>
              <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">Hybrid Architecture</span>
            </div>
            <div className="flex items-center space-x-2 bg-teal-100 dark:bg-teal-900/30 px-4 py-2 rounded-full">
              <span className="text-teal-600 dark:text-teal-400">⏱️</span>
              <span className="text-sm font-medium text-teal-800 dark:text-teal-200">Temporal Analysis</span>
            </div>
            <div className="flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full">
              <span className="text-emerald-600 dark:text-emerald-400">🎯</span>
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">High Accuracy</span>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📸 Upload Eye Image
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 scale-105'
                  : 'border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl text-white">📤</span>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {image ? 'Image Selected!' : 'Drop your eye image here'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or <span className="text-teal-600 dark:text-teal-400 font-medium">browse files</span> to upload
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Supports JPG, PNG, GIF up to 10MB
                </p>
              </div>
            </div>

            {image && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-green-600 dark:text-green-400 text-lg">✅</span>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Image uploaded successfully</p>
                    <p className="text-sm text-green-600 dark:text-green-400">{image.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={detectDisease}
              disabled={!image || loading}
              className={`px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                !image || loading
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analyzing Image...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span>🔍</span>
                  <span>Analyze Image</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">📊 Analysis Results</h2>
              <p className="text-gray-600 dark:text-gray-300">Hybrid Neural Net analysis complete</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Prediction Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Prediction Summary
                </h3>

                {result.error ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
                ) : (
                  <div className="text-center mb-6">
                    <div className={`text-5xl font-bold mb-2 ${
                      result.className ? 'text-blue-700 dark:text-blue-200' : 'text-gray-600'
                    }`}>
                      {result.className ?? 'Unknown'}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Class ID: {typeof result.classId === 'number' ? result.classId : '—'}
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-2">
                      <div
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          typeof result.confidence === 'number'
                            ? result.confidence > 0.75
                              ? 'bg-green-500'
                              : result.confidence > 0.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : '0%' }}
                      ></div>
                    </div>

                    <div className={`text-sm font-medium ${
                      typeof result.confidence === 'number'
                        ? result.confidence > 0.75
                          ? 'text-green-600 dark:text-green-200'
                          : result.confidence > 0.5
                          ? 'text-yellow-600 dark:text-yellow-200'
                          : 'text-red-600 dark:text-red-200'
                        : 'text-gray-600'
                    }`}>
                      Confidence: {typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : 'N/A'}
                    </div>

                    {Array.isArray(result.probabilities) && result.probabilities[0] && (
                      <div className="mt-4 text-left">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Class Probabilities</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          {result.probabilities[0].map((p, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>Class {idx}</span>
                              <span>{(p * 100).toFixed(2)}%</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="mr-2">🔗</span>
                    Model Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Model:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{result.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Predicted Class:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{result.className ?? 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Class ID:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{typeof result.classId === 'number' ? result.classId : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Confidence:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{typeof result.confidence === 'number' ? `${(result.confidence * 100).toFixed(0)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Timestamp:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{result.timestamp}</span>
                    </div>
                  </div>
                </div>

                {result.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200">Analysis Error</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{result.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HybridNeuralNet;