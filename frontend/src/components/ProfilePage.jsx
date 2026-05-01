import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, refreshProfile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    phoneNumber: '',
    address: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        age: user.age ?? '',
        gender: user.gender || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
      });
    }
  }, [user]);

  useEffect(() => {
    refreshProfile().catch(() => {});
  }, [refreshProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateProfile({
        fullName: formData.fullName,
        age: formData.age === '' ? null : Number(formData.age),
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      });
      setMessage('Profile updated successfully.');
    } catch (updateError) {
      setError(updateError.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
            Patient profile
          </span>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
            Manage the patient details used across reports and review workflows.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Account</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{user?.fullName || user?.username}</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p><span className="font-semibold">Username:</span> {user?.username}</p>
              <p><span className="font-semibold">Email:</span> {user?.email || 'N/A'}</p>
              <p><span className="font-semibold">Role:</span> {user?.role || 'PATIENT'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</span>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Age</span>
                <input
                  name="age"
                  type="number"
                  min="0"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</span>
                <input
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</span>
                <input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
                <textarea
                  name="address"
                  rows="4"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
            </div>

            {message && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                {message}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
