"use client";

import React, { useState, useEffect } from 'react';
import { X, Bell, Shield } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

interface CountryLimits {
  autoTopUpThreshold: number;
  autoTopUpAmount: number;
  dailySpendingLimit: number;
}

interface WalletSettingsProps {
  onClose: () => void;
}

export default function WalletSettings({ onClose }: WalletSettingsProps) {
  const [settings, setSettings] = useState({
    autoTopUp: false,
    autoTopUpThreshold: 10,
    autoTopUpAmount: 50,
    dailySpendingLimit: 1000,
    notifications: true
  });
  const [countryLimits, setCountryLimits] = useState<CountryLimits | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCountryLimits();
  }, []);

  const fetchCountryLimits = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/wallet/country-limits`);
      const data = await response.json();
      if (data.success && data.limits) {
        setCountryLimits(data.limits);
      }
    } catch {
      // Country limits not available — validation will happen server-side
    }
  };

  const updateSetting = (key: string, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const validateSettings = (): boolean => {
    if (!countryLimits) return true;
    
    if (settings.autoTopUp) {
      if (settings.autoTopUpThreshold > countryLimits.autoTopUpThreshold) {
        setError(`Threshold cannot exceed ${countryLimits.autoTopUpThreshold}`);
        return false;
      }
      if (settings.autoTopUpAmount > countryLimits.autoTopUpAmount) {
        setError(`Top-up amount cannot exceed ${countryLimits.autoTopUpAmount}`);
        return false;
      }
    }
    if (settings.dailySpendingLimit > countryLimits.dailySpendingLimit) {
      setError(`Daily limit cannot exceed ${countryLimits.dailySpendingLimit}`);
      return false;
    }
    return true;
  };

  const saveSettings = async () => {
    if (!validateSettings()) return;
    
    setSaving(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/wallet/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        onClose();
      } else {
        setError(data.message || 'Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 transition-opacity bg-[#29292938] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Wallet Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-gray-600">Transaction alerts</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Auto Top-Up</p>
                <p className="text-sm text-gray-600">Automatic balance refill</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoTopUp}
                onChange={(e) => updateSetting('autoTopUp', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.autoTopUp && (
            <div className="space-y-3 pl-8">
              <div>
                <label className="block text-sm font-medium mb-1">Threshold ($)</label>
                <input
                  type="number"
                  value={settings.autoTopUpThreshold}
                  onChange={(e) => updateSetting('autoTopUpThreshold', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {countryLimits && (
                  <p className="text-xs text-gray-500 mt-1">Max: {countryLimits.autoTopUpThreshold}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Top-up Amount ($)</label>
                <input
                  type="number"
                  value={settings.autoTopUpAmount}
                  onChange={(e) => updateSetting('autoTopUpAmount', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {countryLimits && (
                  <p className="text-xs text-gray-500 mt-1">Max: {countryLimits.autoTopUpAmount}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Daily Spending Limit ($)</label>
            <input
              type="number"
              value={settings.dailySpendingLimit}
              onChange={(e) => updateSetting('dailySpendingLimit', parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {countryLimits && (
              <p className="text-xs text-gray-500 mt-1">Max: {countryLimits.dailySpendingLimit}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
