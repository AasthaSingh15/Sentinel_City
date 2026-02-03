import React, { useEffect, useState } from 'react';
import {
  getWards,
  createWard,
  setSignalsForWard,
  getSignalsForWard,
  addDiseaseData
} from '../api';
import { fetchEnvironmentData } from '../utils/weatherApi';

const AdminPanel = ({ user }) => {
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(true);
  const [wardForm, setWardForm] = useState({ name: '', lat: '', lng: '' });
  const [signalForm, setSignalForm] = useState({
    wardId: '',
    clinicVisits: '',
    pharmacySales: '',
    pollution: '',
    temperature: '',
    mobility: ''
  });
  const [diseaseForm, setDiseaseForm] = useState({
    disease: '',
    clinicVisits: '',
    pharmacySales: ''
  });
  const [showDiseaseForm, setShowDiseaseForm] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const loadWards = async () => {
    setLoadingWards(true);
    setError('');
    try {
      const res = await getWards();
      setWards(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load wards from backend.');
    } finally {
      setLoadingWards(false);
    }
  };

  useEffect(() => {
    loadWards();
  }, []);

  const handleCreateWard = async (e) => {
    e.preventDefault();
    setFeedback('');
    setError('');
    try {
      const payload = {
        name: wardForm.name.trim(),
        lat: Number(wardForm.lat),
        lng: Number(wardForm.lng)
      };
      if (!payload.name || Number.isNaN(payload.lat) || Number.isNaN(payload.lng)) {
        setError('Provide a valid name and coordinates for the ward.');
        return;
      }
      const res = await createWard(payload);
      setFeedback(`Ward "${res.data.name}" registered in the system.`);
      setWardForm({ name: '', lat: '', lng: '' });
      await loadWards();
    } catch (err) {
      console.error(err);
      setError('Unable to create ward. Backend may be unreachable.');
    }
  };

  const handleSetSignals = async (e) => {
    e.preventDefault();
    setFeedback('');
    setError('');
    try {
      if (!signalForm.wardId) {
        setError('Select a ward to assign signals.');
        return;
      }
      const payload = {
        clinicVisits: Number(signalForm.clinicVisits),
        pharmacySales: Number(signalForm.pharmacySales),
        pollution: Number(signalForm.pollution),
        temperature: Number(signalForm.temperature),
        mobility: Number(signalForm.mobility)
      };
      const res = await setSignalsForWard(signalForm.wardId, payload);
      const ward = wards.find((w) => w.id === signalForm.wardId);
      setFeedback(
        `Signals updated for "${ward?.name || 'selected ward'}". Alert: ${
          res.data.alert?.reason || 'normal'
        } (confidence ${res.data.alert?.confidence ?? 0}%).`
      );
      setSignalForm((prev) => ({
        ...prev,
        clinicVisits: '',
        pharmacySales: '',
        pollution: '',
        temperature: '',
        mobility: ''
      }));
    } catch (err) {
      console.error(err);
      setError('Unable to update signals. Backend may be unreachable.');
    }
  };

  const handleWardSelectForSignals = async (wardId) => {
    // Store current pollution/temperature before loading ward data
    const currentPollution = signalForm.pollution;
    const currentTemperature = signalForm.temperature;
    
    setSignalForm((prev) => ({ ...prev, wardId }));
    if (!wardId) return;
    try {
      const res = await getSignalsForWard(wardId);
      const s = res.data?.signals || {};
      setSignalForm((prev) => ({
        ...prev,
        clinicVisits: s.clinicVisits ?? '',
        pharmacySales: s.pharmacySales ?? '',
        // Preserve fetched pollution/temperature if they exist, otherwise use ward data
        pollution: (currentPollution && currentPollution !== '') ? currentPollution : (s.pollution ?? ''),
        temperature: (currentTemperature && currentTemperature !== '') ? currentTemperature : (s.temperature ?? ''),
        mobility: s.mobility ?? ''
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrentLocationAndEnvironment = async () => {
    setFetchingLocation(true);
    setError('');
    setFeedback('');
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });

      // Fetch real pollution and temperature data from APIs
      const { pollution, temperature } = await fetchEnvironmentData(latitude, longitude);

      console.log('Fetched environment data:', { pollution, temperature, type: typeof pollution, typeTemp: typeof temperature });

      // Always auto-fill pollution and temperature fields (convert to string for input fields)
      setSignalForm((prev) => {
        const updated = {
          ...prev,
          pollution: String(pollution || ''),
          temperature: String(temperature || ''),
        };
        console.log('Updated signal form:', updated);
        return updated;
      });

      // Force a small delay to ensure state update
      await new Promise(resolve => setTimeout(resolve, 100));

      if (signalForm.wardId) {
        setFeedback(`✅ Location fetched: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Pollution: ${pollution}, Temperature: ${temperature}°C. Fields auto-filled!`);
      } else {
        setFeedback(`✅ Location fetched: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Pollution: ${pollution}, Temperature: ${temperature}°C. Fields auto-filled! Select a ward to submit.`);
      }
      setTimeout(() => setFeedback(''), 6000);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch location. Please enable location permissions.');
    } finally {
      setFetchingLocation(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Command Data Administration
          </h2>
          <p className="text-xs text-gray-400">
            Register wards and curate real-time signals powering the early
            warning engine.
          </p>
        </div>
        <div className="text-[11px] text-gray-400 text-right">
          Data Source: <span className="font-medium text-gray-200">Local JSON</span>
          <div>API: Sentinel City backend</div>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-danger border border-danger/50 bg-danger/10 rounded px-3 py-2">
          {error}
        </div>
      )}
      {feedback && (
        <div className="text-[11px] text-emerald-300 border border-emerald-500/50 bg-emerald-500/10 rounded px-3 py-2">
          {feedback}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 text-xs">
        <form
          onSubmit={handleCreateWard}
          className="space-y-3 bg-background/60 border border-accent/30 rounded-lg p-4"
        >
          <h3 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wide">
            1. Register Ward
          </h3>
          <p className="text-[11px] text-gray-400">
            Create a new administrative ward with map coordinates.
          </p>
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">
              Ward Name
            </label>
            <input
              type="text"
              value={wardForm.name}
              onChange={(e) =>
                setWardForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              placeholder="e.g. Ward 7 – Central Market"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={wardForm.lat}
                onChange={(e) =>
                  setWardForm((prev) => ({ ...prev, lat: e.target.value }))
                }
                className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={wardForm.lng}
                onChange={(e) =>
                  setWardForm((prev) => ({ ...prev, lng: e.target.value }))
                }
                className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-accent text-gray-100 border border-accentSoft/60 hover:bg-accentSoft/90 transition text-[11px]"
          >
            Add Ward to System
          </button>
        </form>

        <form
          onSubmit={handleSetSignals}
          className="space-y-3 bg-background/60 border border-accent/30 rounded-lg p-4"
        >
          <h3 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wide">
            2. Enter Ward Signals
          </h3>
          <p className="text-[11px] text-gray-400">
            Manually ingest key indicators for model-based alerting.
          </p>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">
              Target Ward
            </label>
            <select
              value={signalForm.wardId}
              onChange={(e) => handleWardSelectForSignals(e.target.value)}
              className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
            >
              <option value="">
                {loadingWards ? 'Loading wards…' : 'Select a ward'}
              </option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mb-2">
            <label className="block text-[11px] text-gray-400">
              Location & Environment Data
            </label>
            <button
              type="button"
              onClick={fetchCurrentLocationAndEnvironment}
              disabled={fetchingLocation}
              className="px-2 py-1 rounded bg-accent text-white text-[10px] hover:bg-accentSoft/90 transition disabled:opacity-50"
            >
              {fetchingLocation ? 'Fetching...' : '📍 Fetch Current Location'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                Clinic Visits
              </label>
              <input
                type="number"
                value={signalForm.clinicVisits}
                onChange={(e) =>
                  setSignalForm((prev) => ({
                    ...prev,
                    clinicVisits: e.target.value
                  }))
                }
                className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                Pharmacy Sales
              </label>
              <input
                type="number"
                value={signalForm.pharmacySales}
                onChange={(e) =>
                  setSignalForm((prev) => ({
                    ...prev,
                    pharmacySales: e.target.value
                  }))
                }
                className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                Pollution Index / AQI
              </label>
              <input
                type="number"
                value={signalForm.pollution}
                onChange={(e) =>
                  setSignalForm((prev) => ({
                    ...prev,
                    pollution: e.target.value
                  }))
                }
                className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
                placeholder="Auto-filled"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                value={signalForm.temperature}
                onChange={(e) =>
                  setSignalForm((prev) => ({
                    ...prev,
                    temperature: e.target.value
                  }))
                }
                className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
                placeholder="Auto-filled"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                Mobility Index
              </label>
              <input
                type="number"
                value={signalForm.mobility}
                onChange={(e) =>
                  setSignalForm((prev) => ({
                    ...prev,
                    mobility: e.target.value
                  }))
                }
                className="w-full bg-background border border-accent/40 rounded-md px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-accent text-gray-100 border border-accentSoft/60 hover:bg-accentSoft/90 transition text-[11px]"
          >
            Commit Signals to Engine
          </button>
        </form>
      </div>

      {/* Disease Data Entry Section */}
      <div className="bg-background/60 border border-accent/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-semibold text-gray-200 uppercase tracking-wide">
              3. Disease-Specific Data Entry
            </h3>
            <p className="text-[11px] text-gray-400">
              Add disease-specific clinic visits and pharmacy sales data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDiseaseForm(!showDiseaseForm)}
            className="w-8 h-8 rounded-full bg-accent text-white text-lg flex items-center justify-center hover:bg-accentSoft/90 transition"
          >
            +
          </button>
        </div>

        {showDiseaseForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!diseaseForm.disease.trim() || !signalForm.wardId) {
                setError('Please enter disease name and select a ward');
                return;
              }

              setError('');
              try {
                const res = await addDiseaseData(signalForm.wardId, {
                  disease: diseaseForm.disease,
                  clinicVisits: Number(diseaseForm.clinicVisits) || 0,
                  pharmacySales: Number(diseaseForm.pharmacySales) || 0,
                });
                setFeedback(
                  `Disease data added for "${diseaseForm.disease}" in ward. Alert: ${res.data.alert?.reason || 'updated'}`
                );
                setDiseaseForm({ disease: '', clinicVisits: '', pharmacySales: '' });
                setShowDiseaseForm(false);
                setTimeout(() => setFeedback(''), 5000);
              } catch (err) {
                console.error(err);
                setError('Failed to add disease data');
              }
            }}
            className="p-3 bg-background rounded border border-accent/30 space-y-2"
          >
            <select
              value={signalForm.wardId}
              onChange={(e) => handleWardSelectForSignals(e.target.value)}
              className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              required
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
              placeholder="Disease name (e.g., Flu, COVID-19, Dengue)"
              className="w-full bg-background border border-accent/40 rounded px-2 py-1.5 text-xs outline-none focus:border-accentSoft"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={diseaseForm.clinicVisits}
                onChange={(e) =>
                  setDiseaseForm({ ...diseaseForm, clinicVisits: e.target.value })
                }
                placeholder="Clinic visits for this disease"
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
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-1.5 rounded bg-accent text-white text-xs hover:bg-accentSoft/90"
              >
                Add Disease Data
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiseaseForm(false);
                  setDiseaseForm({ disease: '', clinicVisits: '', pharmacySales: '' });
                }}
                className="px-3 py-1.5 rounded border border-accent/40 text-xs hover:border-accentSoft"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-[10px] text-gray-500">
        All changes are persisted to the local JSON datastore and surfaced live
        to operational views. No ward or signal data is hardcoded in the
        frontend.
      </p>
    </div>
  );
};

export default AdminPanel;

