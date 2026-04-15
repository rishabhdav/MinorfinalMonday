import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function SecurityCheck() {
  const { isVerified, verifyChallenge, generateChallenge } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isVerified) {
      const newChallenge = generateChallenge();
      setChallenge(newChallenge);
    }
  }, [isVerified, generateChallenge]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const isCorrect = verifyChallenge(answer);
      if (!isCorrect) {
        setError('Incorrect answer. Please try again.');
        // Generate new challenge
        const newChallenge = generateChallenge();
        setChallenge(newChallenge);
        setAnswer('');
      }
    } catch (err) {
      setError('Security verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return null; // Don't show anything if already verified
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        {/* Security Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <span className="text-2xl text-white">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Security Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please complete this simple verification to access the application
          </p>
        </div>

        {/* Security Challenge */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {challenge && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  🤖 Human Verification
                </h3>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  {challenge.num1} + {challenge.num2} = ?
                </div>
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter the answer"
                  className="w-full px-4 py-3 text-center text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !answer.trim()}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 transform ${
              isLoading || !answer.trim()
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <span>🔍</span>
                <span>Verify & Continue</span>
              </div>
            )}
          </button>
        </form>

        {/* Security Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 dark:text-blue-400 text-lg mt-0.5">ℹ️</span>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="font-medium mb-1">Security Features:</p>
              <ul className="space-y-1 text-xs">
                <li>• Rate limiting protection</li>
                <li>• Session-based access control</li>
                <li>• Automated threat detection</li>
                <li>• Encrypted data transmission</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityCheck;