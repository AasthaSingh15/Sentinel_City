import React, { useEffect, useState } from 'react';
import { getAllAlerts } from '../api';

const levelStyles = {
  high: 'bg-danger/10 text-danger border-danger/60',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/60',
  normal: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/60'
};

const SignalToActionTimeline = () => {
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchAlerts = async () => {
      try {
        setError('');
        const res = await getAllAlerts();
        if (!cancelled) {
          setAlerts(res.data || []);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError('Unable to fetch latest alerts.');
        }
      }
    };

    // initial load
    fetchAlerts();

    // poll every 3 seconds to mirror the UI text
    const interval = setInterval(fetchAlerts, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const formattedTime =
    lastUpdated &&
    lastUpdated.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Signal-to-Action Timeline <span className="text-[10px] text-accentSoft">(Real-Time)</span>
          </h2>
          <p className="text-xs text-gray-400">
            Live updates every 3 seconds. Signals trigger instant alerts across all wards.
          </p>
        </div>
        <div className="text-right text-[11px] text-gray-400 whitespace-nowrap">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Updated</div>
          <div className="font-semibold text-accentSoft">
            {formattedTime || '--:--:--'}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-2 text-[11px] text-danger border border-danger/50 bg-danger/10 rounded px-2 py-1">
          {error}
        </div>
      )}

      <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
        Live Alerts (city-wide)
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500 text-center max-h-[20rem]">
          No active alerts yet. As signals are entered for wards, emerging issues will appear here.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 text-xs max-h-[20rem] sm:max-h-[22rem] lg:max-h-[24rem]">
          {alerts.map((entry) => {
            const level = entry.alert?.level || 'normal';
            const style = levelStyles[level] || levelStyles.normal;
            return (
              <div
                key={entry.wardId}
                className={`border rounded-md px-3 py-2 flex items-start justify-between ${style}`}
              >
                <div className="mr-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide">
                      {entry.wardName}
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-current text-[10px] capitalize">
                      {level}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-100">
                    {entry.alert?.reason || 'No significant anomalies detected.'}
                  </div>
                </div>
                <div className="text-right text-[10px] text-gray-300">
                  <div>Disease flags:</div>
                  <div className="font-mono">
                    {entry.diseaseData && Object.keys(entry.diseaseData).length > 0
                      ? Object.keys(entry.diseaseData)
                          .slice(0, 2)
                          .join(', ')
                      : 'None'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SignalToActionTimeline;

