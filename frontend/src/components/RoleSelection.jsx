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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card/80 border border-accent/40 rounded-xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            <span className="text-accentSoft">Sentinel City</span>
          </h1>
          <p className="text-sm text-gray-400">
            Public Health Early Warning System
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Please select your role to continue
          </p>
        </div>

        {error && (
          <div className="mb-4 text-xs text-danger border border-danger/50 bg-danger/10 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs text-gray-400 mb-3">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-accent/40 rounded-md px-4 py-2.5 text-sm outline-none focus:border-accentSoft"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-3">
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
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    selectedRole === role.value
                      ? 'border-accentSoft bg-accent/20'
                      : 'border-accent/40 hover:border-accentSoft/60 bg-background/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <span className="text-sm font-medium text-gray-200">
                      {role.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRole || !name.trim()}
            className="w-full px-4 py-2.5 rounded-md bg-accent text-gray-100 border border-accentSoft/60 hover:bg-accentSoft/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Initializing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection;
