// frontend/src/components/AIAlertBox.jsx
import React from 'react';

const AIAlertBox = ({ data }) => {
  if (!data) return null;

  // Visual cues based on urgency
  const riskColors = {
    High: 'bg-red-900 border-red-500 text-red-100',
    Medium: 'bg-yellow-900 border-yellow-500 text-yellow-100',
    Low: 'bg-green-900 border-green-500 text-green-100'
  };

  return (
    <div className={`mt-4 p-4 border-l-4 rounded-r shadow-lg ${riskColors[data.risk] || 'bg-card border-accent text-gray-100'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg underline">Gemini Outbreak Prediction</h3>
        <span className="text-xs font-mono uppercase bg-black px-2 py-1 rounded">Risk: {data.risk}</span>
      </div>
      
      <p className="text-sm italic mb-3">"{data.prediction}"</p>
      
      <h4 className="font-semibold text-sm mb-1 uppercase tracking-wider">Prevention Steps:</h4>
      <ul className="list-disc list-inside text-sm space-y-1">
        {data.prevention.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ul>
    </div>
  );
};

export default AIAlertBox;