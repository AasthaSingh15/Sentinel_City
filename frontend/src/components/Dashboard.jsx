import React, { useEffect, useState } from 'react';
import { getSignalsForWard } from '../api';

const Badge = ({ level }) => {
  let text = 'Normal';
  let color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  if (level === 'high') {
    text = 'Critical';
    color = 'bg-danger/20 text-danger border-danger/60';
  } else if (level === 'medium') {
    text = 'Elevated';
    color = 'bg-amber-500/20 text-amber-300 border-amber-500/60';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${color}`}
    >
      {text}
    </span>
  );
};

const Dashboard = ({ selectedWard }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSignals = async () => {
      if (!selectedWard) return;
      setLoading(true);
      setError('');
      try {
        const res = await getSignalsForWard(selectedWard.id);
        setData(res.data || null);
      } catch (err) {
        console.error(err);
        setError('Unable to retrieve signals for this ward.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, [selectedWard]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Ward Risk Console
          </h2>
          <p className="text-xs text-gray-400">
            Multi-signal fusion and alerting for the selected ward.
          </p>
        </div>
        <div className="text-right text-[11px] text-gray-400">
          <div>Mode: Analytics</div>
          <div>
            Scope:{' '}
            <span className="font-medium text-gray-200">
              {selectedWard ? selectedWard.name : 'No ward selected'}
            </span>
          </div>
        </div>
      </div>

      {!selectedWard ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
          Select a ward from the map to activate the risk console.
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          Pulling latest signals from backend…
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-red-400">
          {error}
        </div>
      ) : !data ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          No signal data available for this ward yet.
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-accent/10 border border-accent/40 rounded-lg px-3 py-2">
            <div className="text-xs flex-1">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wide text-[10px] text-gray-400">
                  System Assessment
                </span>
                <Badge level={data.alert?.level} />
              </div>
              <p className="mt-1 text-sm text-gray-100">
                {data.alert?.reason || 'No significant anomalies detected.'}
              </p>
              {data.alert?.disease && (
                <p className="mt-1 text-xs text-danger font-semibold">
                  ⚠️ {data.alert.disease} is spreading fast in {selectedWard?.name || 'this area'}. Please be careful.
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400">Model Confidence</div>
              <div className="text-lg font-semibold text-accentSoft">
                {data.alert?.confidence ?? 0}
                <span className="text-xs text-gray-400 ml-1">%</span>
              </div>
            </div>
          </div>

          {data.diseaseData && Object.keys(data.diseaseData).length > 0 && (
            <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">
                Disease-Specific Data
              </div>
              <div className="space-y-1">
                {Object.entries(data.diseaseData).map(([disease, info]) => (
                  <div key={disease} className="text-xs">
                    <span className="font-medium text-gray-200 capitalize">{disease}</span>
                    <span className="text-gray-400 ml-2">
                      Visits: {info.clinicVisits || 0} | Sales: {info.pharmacySales || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Clinic Visits
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-100">
                {data.signals?.clinicVisits ?? 0}
              </div>
            </div>
            <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Pharmacy Sales
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-100">
                {data.signals?.pharmacySales ?? 0}
              </div>
            </div>
            <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Pollution Index
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-100">
                {data.signals?.pollution ?? 0}
              </div>
            </div>
            <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Temperature
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-100">
                {data.signals?.temperature ?? 0}°C
              </div>
            </div>
            <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Mobility
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-100">
                {data.signals?.mobility ?? 0}
              </div>
            </div>
            <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-gray-400">
                Last Update
              </div>
              <div className="mt-1 text-[11px] text-gray-300">
                {data.signals?.updatedAt
                  ? new Date(data.signals.updatedAt).toLocaleString()
                  : 'No data'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

