
import React, { useEffect, useState } from 'react';

// Mock data for demonstration (replace with real API calls)
const mockLiveAlerts = [
  {
    ward: 'ward-7',
    status: 'WARNING',
    issues: 'issues',
    signalAction: '4 hr',
    timestamp: '2026-02-02T21:20:29',
    languages: ['Hindi', 'English'],
  },
];

const mockHistorical = [
  {
    title: 'Nipah Virus – Kolkata Corridor Backtest',
    year: 2023,
    description:
      'Retrospective simulation of a Nipah-like cluster in high-density wards of Kolkata. Early fusion of clinic visits, pharmacy sales, and mobility could have generated a red alert and multilingual public guidance within the first operational day.',
    signalAction: '2 hr',
    goldenHour: true,
    languages: ['Hindi', 'English'],
  },
];

function SignalTimeline() {

  const [liveAlerts, setLiveAlerts] = useState([]);
  const [historical, setHistorical] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLiveAlerts(mockLiveAlerts);
      setHistorical(mockHistorical);
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
    const interval = setInterval(() => {
      setRefreshing(true);
      setTimeout(() => {
        setLiveAlerts(mockLiveAlerts);
        setHistorical(mockHistorical);
        setLastUpdated(new Date());
        setRefreshing(false);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background/60 border border-accent/30 rounded-md px-3 py-2 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-200">Signal-to-Action Timeline (Real-Time)</h2>
        <span className="text-xs text-green-400 flex items-center gap-1">
          {refreshing ? (
            <svg className="animate-spin h-4 w-4 text-green-400" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
          ) : '●'} Updated {lastUpdated.toLocaleTimeString()}
        </span>
      </div>
      <div className="text-xs text-gray-400 mb-2">Live updates every 3 seconds. Signals trigger instant alerts across India.</div>
      <div className="mb-2 max-h-40 overflow-y-auto">
        <div className="font-semibold text-[13px] text-blue-300 mb-1">LIVE ALERTS (INDIA-WIDE)</div>
        {loading ? (
          <div>Loading live alerts...</div>
        ) : liveAlerts.length === 0 ? (
          <div className="text-gray-500">No current alerts.</div>
        ) : (
          liveAlerts.map((alert, idx) => (
            <div key={idx} className="mb-2 p-2 rounded bg-blue-900/20 border border-blue-700 flex flex-col gap-1 relative group">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-200">{alert.ward}</span>
                <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-xs font-semibold">{alert.status}</span>
                <span className="text-gray-300">{alert.issues}</span>
                <span className="ml-auto text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-bold text-green-300">Signal → Action: {alert.signalAction} (Real-time)</span>
                <span className="ml-2">{alert.languages.map(l => <span key={l} className="mx-1">{l}</span>)}</span>
                <span className="group-hover:block hidden absolute top-0 right-0 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg z-10">More details coming soon</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="max-h-32 overflow-y-auto">
        <div className="font-semibold text-[13px] text-orange-300 mb-1">HISTORICAL VERIFICATION</div>
        {historical.length === 0 ? (
          <div className="text-gray-500">No historical events.</div>
        ) : (
          historical.map((event, idx) => (
            <div key={idx} className="mb-2 p-2 rounded bg-orange-900/20 border border-orange-700 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-200">{event.title}</span>
                <span className="px-2 py-0.5 rounded bg-orange-400/20 text-orange-300 border border-orange-400/40 text-xs font-semibold">{event.year}</span>
              </div>
              <div className="text-xs text-gray-300 mb-1">{event.description}</div>
              <div className="flex items-center gap-2 text-xs text-orange-300">
                <span>Modeled Signal → Action: <span className="font-bold">{event.signalAction}</span> {event.goldenHour && <span className="ml-1">(Golden Hour estimate)</span>}</span>
                <span className="ml-2">{event.languages.map(l => <span key={l} className="mx-1">{l}</span>)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SignalTimeline;
