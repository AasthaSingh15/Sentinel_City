import React, { useEffect, useState } from 'react';
import { getSignalsForWard } from '../api';
import SignalTimeline from './SignalTimeline';

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
      {/* India-wide real-time outbreak and news timeline */}
      <SignalTimeline />
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-accent">Operational Dashboard</h2>
          <p className="text-xs text-gray-400">Live health signals, risk assessment, and policy impact for selected ward.</p>
        </div>
        <div className="text-right text-[11px] text-gray-400">
          <div>Mode: <span className="font-semibold text-accent">Analytics</span></div>
          <div>Scope: <span className="font-medium text-gray-200">{selectedWard ? selectedWard.name : 'No ward selected'}</span></div>
        </div>
      </div>
      {/* Summary Widget */}
      {selectedWard && data && (
        <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-accent/10 border border-accent/40 rounded-lg px-2 py-1 text-xs text-center">
            <div className="font-semibold text-accent">Confidence</div>
            <div className="text-lg font-bold text-accentSoft">{data.alert?.confidence ?? 0}%</div>
          </div>
          <div className="bg-emerald-900/10 border border-emerald-500/40 rounded-lg px-2 py-1 text-xs text-center">
            <div className="font-semibold text-emerald-300">Clinic Visits</div>
            <div className="text-lg font-bold text-emerald-200">{data.signals?.clinicVisits ?? 0}</div>
          </div>
          <div className="bg-amber-900/10 border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-center">
            <div className="font-semibold text-amber-300">Pharmacy Sales</div>
            <div className="text-lg font-bold text-amber-200">{data.signals?.pharmacySales ?? 0}</div>
          </div>
          <div className="bg-blue-900/10 border border-blue-500/40 rounded-lg px-2 py-1 text-xs text-center">
            <div className="font-semibold text-blue-300">Temperature</div>
            <div className="text-lg font-bold text-blue-200">{data.signals?.temperature ?? 0}°C</div>
          </div>
        </div>
      )}

      {!selectedWard ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center">
          Select a ward from the map to activate the risk console.
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          <svg className="animate-spin h-5 w-5 text-accent mr-2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
          Pulling latest signals from backend…
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-red-400">
          {error}
        </div>
      ) : !data ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          <div className="w-full flex flex-col gap-2 items-center">
            <div className="h-6 w-2/3 bg-gray-700/30 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-700/20 rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-gray-700/20 rounded animate-pulse" />
          </div>
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

