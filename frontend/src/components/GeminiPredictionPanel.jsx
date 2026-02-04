import React, { useEffect, useState } from 'react';
import { getAIAlert } from '../api';
import AIAlertBox from './AIAlertBox';

const GeminiPredictionPanel = ({ selectedWard }) => {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!selectedWard) {
        setAiData(null);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await getAIAlert(selectedWard.id);
        if (!data) {
          setError('Failed to fetch AI prediction.');
          setAiData(null);
        } else {
          setAiData(data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch AI prediction.');
        setAiData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [selectedWard]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Gemini AI Medical Predictions
          </h2>
          <p className="text-xs text-gray-400">
            Live AI-powered predictions for virus outbreaks and medical trends.
          </p>
        </div>
        <div className="text-[10px] text-gray-400 text-right">
          Engine:{' '}
          <span className="text-gray-200 font-medium">Gemini</span>
        </div>
      </div>

      {!selectedWard ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500 text-center">
          Select a ward from the map to request an AI prediction.
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          Requesting Gemini prediction for {selectedWard.name}…
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-danger border border-danger/50 bg-danger/10 rounded px-3 py-2 text-center w-full">
            {error}
          </div>
        </div>
      ) : !aiData ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500 text-center">
          No AI prediction available yet. Try again after updating signals.
        </div>
      ) : (
        <AIAlertBox data={aiData} />
      )}
    </div>
  );
};

export default GeminiPredictionPanel;

