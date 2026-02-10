import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import Charts from './components/Charts';
import Simulator from './components/Simulator';
import AdminPanel from './components/AdminPanel';
import RoleSelection from './components/RoleSelection';
import SignalToActionTimeline from './components/SignalToActionTimeline';
import GeminiPredictionPanel from './components/GeminiPredictionPanel';
import AdvancedAnalyticsPanel from './components/AdvancedAnalyticsPanel';

const App = () => {
  const [selectedWard, setSelectedWard] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('sentinel_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('sentinel_user');
      }
    }
    // Load seeded simulation history from backend so timeline shows fluctuations
    (async () => {
      try {
        const res = await (await import('./api')).getSimulationHistory();
        if (res && res.data) setSimulationHistory(res.data || []);
      } catch (e) {
        // ignore — timeline will start empty if backend unreachable
      }
    })();
  }, []);

  const handleRoleSelected = (user) => {
    setCurrentUser(user);
    localStorage.setItem('sentinel_user', JSON.stringify(user));
    // Citizens go to operational view, pharmacists/hospitals go to admin panel
    if (user.role === 'citizen') {
      navigate('/operational');
    } else {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sentinel_user');
    navigate('/');
  };

  const handleSimulationResult = (result) => {
    setSimulationHistory((prev) => [...prev, result]);
  };

  // Show role selection if no user is logged in
  if (!currentUser) {
    return <RoleSelection onRoleSelected={handleRoleSelected} />;
  }

  // Check if user has access to admin panel
  const hasAdminAccess = currentUser && ['pharmacist', 'hospital'].includes(currentUser.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 flex flex-col">
      <header className="border-b border-accent/40 bg-background/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accentSoft text-lg font-semibold shadow-lg shadow-cyan-500/30">
              SC
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold tracking-wide leading-tight">
                <span className="text-accentSoft">Sentinel City</span>{' '}
                <span className="text-gray-300 hidden sm:inline">Command Center</span>
              </h1>
              <p className="hidden md:block text-[10px] text-gray-500">
                Multi-signal public health early warning prototype
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
            <Link
              to="/operational"
              className={`px-3 py-1.5 rounded-md border transition ${
                location.pathname === '/operational'
                  ? 'border-accentSoft bg-accent/40'
                  : 'border-accent/40 hover:border-accentSoft/80'
              }`}
            >
              Operational View
            </Link>

            <Link
              to="/intervention"
              className={`px-3 py-1.5 rounded-md border transition ${
                location.pathname === '/intervention'
                  ? 'border-accentSoft bg-accent/40'
                  : 'border-accent/40 hover:border-accentSoft/80'
              }`}
            >
              Intervention
            </Link>

            <Link
              to="/signals"
              className={`px-3 py-1.5 rounded-md border transition ${
                location.pathname === '/signals'
                  ? 'border-accentSoft bg-accent/40'
                  : 'border-accent/40 hover:border-accentSoft/80'
              }`}
            >
              Signal Timeline
            </Link>

            <Link
              to="/city-intel"
              className={`px-3 py-1.5 rounded-md border transition ${
                location.pathname === '/city-intel'
                  ? 'border-accentSoft bg-accent/40'
                  : 'border-accent/40 hover:border-accentSoft/80'
              }`}
            >
              Citywide Intelligence
            </Link>

            {hasAdminAccess && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md border transition ${
                  location.pathname === '/admin'
                    ? 'border-accentSoft bg-accent/40'
                    : 'border-accent/40 hover:border-accentSoft/80'
                }`}
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md border border-accent/40 hover:border-accentSoft/80 text-[11px] md:text-xs"
            >
              Logout ({currentUser.name})
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 py-4 md:py-6">
        <Routes>
          {/* Root -> redirect to operational view */}
          <Route path="/" element={<Navigate to="/operational" replace />} />

          {/* Page 1 — Operational View
              Contains: MapView + Ward Risk Console (Dashboard) + GeminiPredictionPanel
              These three live together on a single dashboard layout. */}
          <Route
            path="/operational"
            element={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-1 bg-card/70 rounded-xl border border-accent/30 overflow-hidden flex flex-col shadow-lg shadow-black/40">
                  <MapView selectedWard={selectedWard} onSelectWard={setSelectedWard} currentUser={currentUser} />
                </div>

                <div className="lg:col-span-2 flex flex-col gap-5 md:gap-6">
                  <div className="bg-card/70 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden shadow-md shadow-black/30 min-h-[220px]">
                    <Dashboard selectedWard={selectedWard} />
                  </div>

                  <div className="bg-card/70 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden shadow-md shadow-black/30">
                    <GeminiPredictionPanel selectedWard={selectedWard} />
                  </div>
                </div>
              </div>
            }
          />

          {/* Page 2 — Intervention Simulator + Policy Impact Timeline */}
          <Route
            path="/intervention"
            element={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-1 bg-card/70 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden shadow-lg shadow-black/40">
                  <Simulator onResult={handleSimulationResult} />
                </div>
                <div className="lg:col-span-2 bg-card/70 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden shadow-md shadow-black/30">
                  <Charts simulationHistory={simulationHistory} />
                </div>
              </div>
            }
          />

          {/* Page 3 — Signal-to-Action Timeline (Real-Time) */}
          <Route
            path="/signals"
            element={
              <div className="bg-card/70 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden shadow-md shadow-black/30">
                <SignalToActionTimeline />
              </div>
            }
          />

          {/* Page 4 — Citywide Intelligence */}
          <Route
            path="/city-intel"
            element={
              <div className="bg-card/70 rounded-xl border border-accent/30 p-4 md:p-6 shadow-lg shadow-black/40">
                <AdvancedAnalyticsPanel />
              </div>
            }
          />

          {/* Admin panel remains isolated */}
          <Route
            path="/admin"
            element={
              hasAdminAccess ? (
                <div className="bg-card/70 rounded-xl border border-accent/30 p-4 md:p-6 shadow-lg shadow-black/40">
                  <AdminPanel user={currentUser} />
                </div>
              ) : (
                <Navigate to="/operational" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;

