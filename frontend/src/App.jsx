import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import Charts from './components/Charts';
import Simulator from './components/Simulator';
import AdminPanel from './components/AdminPanel';
import RoleSelection from './components/RoleSelection';
import MedicalAIPredictions from './components/MedicalAIPredictions';

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
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      <header className="border-b border-accent/40 bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-wide">
            <span className="text-accentSoft">Sentinel City</span>{' '}
            <span className="text-gray-300">Command Center</span>
          </h1>
          <nav className="flex items-center gap-3 text-sm">
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
              className="px-3 py-1.5 rounded-md border border-accent/40 hover:border-accentSoft/80 text-xs"
            >
              Logout ({currentUser.name})
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 md:py-6">
        <Routes>
          <Route
            path="/"
            element={
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100vh-6rem)]">
                <div className="lg:col-span-1 bg-card/60 rounded-xl border border-accent/30 overflow-hidden flex flex-col">
                  <MapView selectedWard={selectedWard} onSelectWard={setSelectedWard} currentUser={currentUser} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden">
                      <Dashboard selectedWard={selectedWard} />
                    </div>
                    <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden">
                      <Simulator onResult={handleSimulationResult} />
                    </div>
                  </div>
                  <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-5 flex-1 min-h-[220px]">
                    <Charts simulationHistory={simulationHistory} />
                  </div>
                </div>
                {/* Gemini AI Medical Predictions */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <MedicalAIPredictions />
                </div>
              </div>
            }
          />
          <Route
            path="/operational"
            element={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-6rem)]">
                <div className="lg:col-span-1 bg-card/60 rounded-xl border border-accent/30 overflow-hidden flex flex-col">
                  <MapView selectedWard={selectedWard} onSelectWard={setSelectedWard} currentUser={currentUser} />
                </div>
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden">
                      <Dashboard selectedWard={selectedWard} />
                    </div>
                    <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-5 overflow-hidden">
                      <Simulator onResult={handleSimulationResult} />
                    </div>
                  </div>
                  <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-5 flex-1 min-h-[220px]">
                    <Charts simulationHistory={simulationHistory} />
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/admin"
            element={
              hasAdminAccess ? (
                <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-6">
                  <AdminPanel user={currentUser} />
                </div>
              ) : (
                <div className="bg-card/60 rounded-xl border border-accent/30 p-4 md:p-6">
                  <div className="text-center text-gray-400">
                    Access denied. Admin Panel is only accessible to pharmacists and hospitals.
                  </div>
                </div>
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;

