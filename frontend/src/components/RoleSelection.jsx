import React, { useState } from 'react';
import { createOrGetUser } from '../api';

const RoleSelection = ({ onRoleSelected }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole || !name.trim()) {
      setError('Please select a role and enter your name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await createOrGetUser(selectedRole, name.trim());
      onRoleSelected(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-accent/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accentSoft/10 blur-3xl rounded-full" />
      </div>

      <div className="relative bg-card/90 border border-accent/40 shadow-2xl shadow-black/60 rounded-2xl p-8 md:p-10 max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
              <span className="text-accentSoft">Sentinel City</span>
            </h1>
            <p className="text-sm text-gray-300">
              Public Health Early Warning System
            </p>
            <p className="mt-3 text-xs text-gray-400 leading-relaxed">
              Run a multi-role command exercise that fuses clinic load, pharmacy
              signals, and environment data into an early warning view for your city.
            </p>
          </div>

          <div className="mt-6 hidden md:block">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
              Scenario Highlights
            </div>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-accentSoft" />
                <span>City-wide risk map with disease-specific alerts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Role-based data entry for citizens, pharmacists, and hospitals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-amber-300" />
                <span>Intervention simulator with impact timeline for briefings.</span>
              </li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs text-danger border border-danger/50 bg-danger/10 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background/80 border border-accent/40 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accentSoft focus:bg-background transition"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Select Your Role
            </label>
            <div className="space-y-2">
              {[
                { value: 'citizen', label: 'Common Citizen', icon: '👤' },
                { value: 'pharmacist', label: 'Pharmacist', icon: '💊' },
                { value: 'hospital', label: 'Hospital', icon: '🏥' },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`w-full text-left p-4 rounded-lg border transition group ${
                    selectedRole === role.value
                      ? 'border-accentSoft bg-accent/20 shadow-[0_0_0_1px_rgba(56,189,248,0.3)]'
                      : 'border-accent/40 hover:border-accentSoft/60 bg-background/60 hover:bg-background/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-100">
                        {role.label}
                      </div>
                      <div className="text-[11px] text-gray-400 group-hover:text-gray-300">
                        {role.value === 'citizen' && 'Neighbourhood view & self-reporting'}
                        {role.value === 'pharmacist' && 'Early pharmacy surge signals'}
                        {role.value === 'hospital' && 'Bed load & clinical escalation'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRole || !name.trim()}
            className="w-full px-4 py-2.5 rounded-lg bg-accent text-gray-100 border border-accentSoft/60 hover:bg-accentSoft/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-cyan-500/20"
          >
            {loading ? 'Initializing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection;
