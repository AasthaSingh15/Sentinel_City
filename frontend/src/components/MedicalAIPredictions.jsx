import React, { useEffect, useState } from 'react';

// Replace with your Gemini AI API endpoint and key
const GEMINI_API = 'https://api.gemini.medical/predict';
const API_KEY = 'YOUR_GEMINI_API_KEY';

function MedicalAIPredictions() {
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPrediction() {
      setLoading(true);
      setError('');
      try {
        // Example payload, adjust as needed
        const res = await fetch(GEMINI_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            prompt: 'Predict upcoming virus outbreaks and medical trends in India for the next 7 days.',
          }),
        });
        const data = await res.json();
        setPrediction(data.prediction || 'No prediction available.');
      } catch (err) {
        setError('Failed to fetch AI prediction.');
        setPrediction('');
      }
      setLoading(false);
    }
    fetchPrediction();
    // Poll every 5 minutes for new predictions
    const interval = setInterval(fetchPrediction, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background/60 border border-purple-400 rounded-md px-3 py-2 mb-4">
      <h2 className="text-base font-semibold text-purple-300 mb-1">Gemini AI Medical Predictions</h2>
      <div className="text-xs text-gray-400 mb-2">Live AI-powered predictions for virus outbreaks and medical trends.</div>
      {loading ? (
        <div className="flex items-center gap-2 text-purple-400">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
          Fetching latest prediction...
        </div>
      ) : error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : (
        <div className="text-sm text-purple-200 whitespace-pre-line">
          {prediction}
        </div>
      )}
    </div>
  );
}

export default MedicalAIPredictions;
