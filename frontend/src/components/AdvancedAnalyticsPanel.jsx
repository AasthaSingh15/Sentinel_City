import React, { useEffect, useState } from 'react';
import { getAnalyticsOverview } from '../api';

const AdvancedAnalyticsPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getAnalyticsOverview();
        setAnalytics(res.data || null);
      } catch (err) {
        console.error(err);
        setError('Unable to load city-wide analytics.');
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const wards = analytics?.wards || [];

  const anomalies = wards
    .filter((w) => w.situationOfConcern)
    .sort((a, b) => b.baselineDeltaPct - a.baselineDeltaPct)
    .slice(0, 5);

  const topSpread = [...wards]
    .sort((a, b) => b.spreadRiskScore - a.spreadRiskScore)
    .slice(0, 3);

  const topVulnerable = [...wards]
    .sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex)
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-gray-200">
            Citywide Intelligence
          </h2>
          <p className="text-xs text-gray-400">
            Anomaly detection, spread prediction and vulnerability scoring across all wards.
          </p>
        </div>
        {analytics && (
          <div className="text-[11px] text-gray-400 text-right">
            Baseline respiratory load:{' '}
            <span className="font-semibold text-gray-200">
              {analytics.baseline.respiratoryBaseline}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          Computing city-wide analytics…
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs">
          <div className="text-danger border border-danger/50 bg-danger/10 rounded px-3 py-2 text-center w-full">
            {error}
          </div>
        </div>
      ) : !analytics ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-500 text-center">
          No analytics available yet. Configure signals and disease data for wards to unlock insights.
        </div>
      ) : (
        <div className="flex-1 grid grid-rows-3 gap-3 text-xs overflow-y-auto pr-1">
          <section className="border border-amber-500/40 bg-amber-500/5 rounded-md px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                Anomaly Detection
              </h3>
              <span className="text-[10px] text-amber-100">
                5%+ respiratory increase → Situation of Concern
              </span>
            </div>
            {anomalies.length === 0 ? (
              <p className="text-[11px] text-amber-100/80">
                No wards currently exceed the 5% respiratory baseline threshold.
              </p>
            ) : (
              <ul className="space-y-1">
                {anomalies.map((w) => (
                  <li
                    key={w.wardId}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-100">
                      {w.wardName}
                    </span>
                    <span className="text-[11px] text-amber-200 font-semibold">
                      +{w.baselineDeltaPct.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-cyan-500/40 bg-cyan-500/5 rounded-md px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
                Spread Prediction (Spatial)
              </h3>
              <span className="text-[10px] text-cyan-100">
                Combines mobility + respiratory load
              </span>
            </div>
            {topSpread.length === 0 ? (
              <p className="text-[11px] text-cyan-100/80">
                No spread hotspots detected yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {topSpread.map((w) => (
                  <li key={w.wardId}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-gray-100">
                        {w.wardName}
                      </span>
                      <span className="text-[11px] text-cyan-200 font-semibold">
                        {w.spreadRiskScore}/100
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-cyan-500/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{ width: `${w.spreadRiskScore}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border border-rose-500/40 bg-rose-500/5 rounded-md px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-rose-200">
                Vulnerability Index
              </h3>
              <span className="text-[10px] text-rose-100">
                Higher = more fragile zone
              </span>
            </div>
            {topVulnerable.length === 0 ? (
              <p className="text-[11px] text-rose-100/80">
                Vulnerability scores will appear as signals accumulate.
              </p>
            ) : (
              <ul className="space-y-1">
                {topVulnerable.map((w) => (
                  <li
                    key={w.wardId}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-100">
                      {w.wardName}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-100 text-[11px] font-semibold">
                      {w.vulnerabilityIndex}/100
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalyticsPanel;

