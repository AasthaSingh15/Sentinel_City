import React, { useEffect, useState } from 'react';
import { getUserData, saveUserData, addDiseaseData, getWards } from '../api';
import { fetchEnvironmentData } from '../utils/weatherApi';

const PharmacistDashboard = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showDiseaseForm, setShowDiseaseForm] = useState(false);
  const [diseaseForm, setDiseaseForm] = useState({
    disease: '',
    pharmacySales: '',
  });
  const [wards, setWards] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
    loadWards();
  }, [user]);

  const loadUserData = async () => {
    try {
      const res = await getUserData(user.id);
      setUserData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWards = async () => {
    try {
      const res = await getWards();
      setWards(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedWardId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrentLocation = async () => {
    setFetchingLocation(true);
    setError('');
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Fetch temperature data from API (pollution is entered manually)
      const { temperature } = await fetchEnvironmentData(latitude, longitude);

      const updatedData = {
        location: { lat: latitude, lng: longitude },
        pollution: userData?.pollution || null, // Keep existing pollution value
        temperature,
        diseases: userData?.diseases || [],
      };

      await saveUserData(user.id, updatedData);
      setUserData(updatedData);
      setFeedback('Location and environmental data updated successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch location. Please enable location permissions or enter manually.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSaveData = async () => {
    if (!userData) return;
    setError('');
    setFeedback('');
    try {
      await saveUserData(user.id, userData);
      setFeedback('Data saved successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save data');
    }
  };

  const handleAddDisease = async (e) => {
    e.preventDefault();
    if (!diseaseForm.disease.trim() || !selectedWardId) {
      setError('Please enter disease name and select a ward');
      return;
    }

    setError('');
    try {
      await addDiseaseData(selectedWardId, {
        disease: diseaseForm.disease,
        clinicVisits: 0, // Pharmacists don't report clinic visits
        pharmacySales: Number(diseaseForm.pharmacySales) || 0,
      });

      const updatedDiseases = [
        ...(userData?.diseases || []),
        {
          disease: diseaseForm.disease.trim(),
          pharmacySales: Number(diseaseForm.pharmacySales) || 0,
          wardId: selectedWardId,
          timestamp: new Date().toISOString(),
        },
      ];

      const updatedData = {
        ...userData,
        diseases: updatedDiseases,
      };

      await saveUserData(user.id, updatedData);
      setUserData(updatedData);
      setDiseaseForm({ disease: '', pharmacySales: '' });
      setShowDiseaseForm(false);
      setFeedback('Disease data added successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to add disease data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading your data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-200">
            Pharmacist Dashboard
          </h2>
          <p className="text-xs text-gray-400">Welcome, {user.name}</p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-danger border border-danger/50 bg-danger/10 rounded px-3 py-2">
          {error}
        </div>
      )}
      {feedback && (
        <div className="text-xs text-emerald-300 border border-emerald-500/50 bg-emerald-500/10 rounded px-3 py-2">
          {feedback}
        </div>
      )}

      <div className="bg-background/60 border border-accent/30 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-300 mb-3">
            Pharmacy Location & Environment
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={userData?.location?.lat || ''}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    location: {
                      ...userData?.location,
                      lat: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 outline-none focus:border-accentSoft"
                placeholder="Auto-filled"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={userData?.location?.lng || ''}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    location: {
                      ...userData?.location,
                      lng: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 outline-none focus:border-accentSoft"
                placeholder="Auto-filled"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Pollution Index</label>
              <input
                type="number"
                value={userData?.pollution || ''}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    pollution: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 outline-none focus:border-accentSoft"
                placeholder="Auto-filled"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Temperature (°C)</label>
              <input
                type="number"
                value={userData?.temperature || ''}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    temperature: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 outline-none focus:border-accentSoft"
                placeholder="Auto-filled"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={fetchCurrentLocation}
            disabled={fetchingLocation}
            className="mt-3 px-3 py-1.5 rounded bg-accent text-white text-xs hover:bg-accentSoft/90 transition disabled:opacity-50"
          >
            {fetchingLocation ? 'Fetching...' : '📍 Fetch Current Location'}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-300">
              Disease Sales Reports
            </h3>
            <button
              type="button"
              onClick={() => setShowDiseaseForm(!showDiseaseForm)}
              className="w-6 h-6 rounded-full bg-accent text-white text-lg flex items-center justify-center hover:bg-accentSoft/90 transition"
            >
              +
            </button>
          </div>

          {showDiseaseForm && (
            <form onSubmit={handleAddDisease} className="mb-3 p-3 bg-background rounded border border-accent/30 space-y-2">
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
                className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={diseaseForm.disease}
                onChange={(e) =>
                  setDiseaseForm({ ...diseaseForm, disease: e.target.value })
                }
                placeholder="Disease name (e.g., Flu, COVID-19)"
                className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
                required
              />
              <input
                type="number"
                value={diseaseForm.pharmacySales}
                onChange={(e) =>
                  setDiseaseForm({ ...diseaseForm, pharmacySales: e.target.value })
                }
                placeholder="Pharmacy sales for this disease"
                className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 rounded bg-accent text-white text-xs hover:bg-accentSoft/90"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiseaseForm(false);
                    setDiseaseForm({ disease: '', pharmacySales: '' });
                  }}
                  className="px-3 py-1.5 rounded border border-accent/40 text-xs hover:border-accentSoft"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {userData?.diseases && userData.diseases.length > 0 ? (
              userData.diseases.map((d, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-background rounded border border-accent/30 text-xs"
                >
                  <div className="font-medium text-gray-200">{d.disease}</div>
                  <div className="text-gray-400">
                    Pharmacy Sales: {d.pharmacySales}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    {new Date(d.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No disease sales reports yet</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveData}
          className="w-full px-4 py-2 rounded bg-accent text-white text-xs hover:bg-accentSoft/90 transition"
        >
          Save All Data
        </button>
      </div>
    </div>
  );
};

export default PharmacistDashboard;