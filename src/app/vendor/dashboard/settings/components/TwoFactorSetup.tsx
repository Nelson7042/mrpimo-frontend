"use client";

import React, { useState } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

const API_BASE = API_BASE_URL;

interface TwoFactorSetupProps {
  onComplete: (user: any) => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const initSetup = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_BASE}/two-factor/setup`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log(data);
      
      if (!data.success) {
        setError(data.message);
        return;
      }
      setSetupData(data.data);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_BASE}/two-factor/enable`, {
        method: 'POST',
        body: JSON.stringify({ token: verificationCode })
      });
      
      const data = await response.json();
      console.log(data);
      
      if (!data.success) {
        setError(data.message);
        return;
      }
      setBackupCodes(data.backupCodes);
      onComplete({ twoFactorAuth: { enabled: true } });
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    initSetup();
  }, []);

  if (backupCodes.length > 0) {
    return (
      <div className="p-4 border rounded font-roboto">
        <h3 className="font-roboto text-sm font-semibold mb-3">Save Your Backup Codes</h3>
        <p className="font-roboto text-xs text-gray-600 mb-3">Store these codes in a safe place. Each code can be used once if you lose access to your authenticator app.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {backupCodes.map((code, i) => (
            <div key={i} className="p-2 border rounded text-center font-roboto text-xs">{code}</div>
          ))}
        </div>
        <button
          className="w-full py-2 bg-blue-500 text-white rounded font-roboto text-xs"
          onClick={() => onComplete({ twoFactorAuth: { enabled: true } })}
        >
          I've saved these codes
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded font-roboto mt-4">
      <h3 className="font-roboto text-sm font-semibold mb-3">Setup Two-Factor Authentication</h3>

      {step === 'setup' && (
        <div className="text-center">
          {error ? (
            <div>
              <p className="font-roboto text-xs text-red-500 mb-3">{error}</p>
              <div className="flex justify-center gap-2">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded font-roboto text-xs"
                  onClick={() => { setError(''); initSetup(); }}
                  disabled={loading}
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </button>
                <button
                  className="px-4 py-2 border rounded font-roboto text-xs"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="font-roboto text-xs text-gray-500">{loading ? 'Setting up 2FA...' : 'Initializing...'}</p>
          )}
        </div>
      )}

      {step === 'verify' && setupData && (
        <>
          <div className="text-center mb-4">
            <img src={setupData.qrCode} alt="QR Code" className="mx-auto max-w-[200px]" />
          </div>
          <p className="font-roboto text-xs text-gray-600 mb-1">Scan this QR code with your authenticator app.</p>
          <p className="font-roboto text-xs text-gray-600 mb-4">Or enter this code manually: <strong>{setupData.secret}</strong></p>

          <div className="mb-4">
            <label className="font-roboto text-xs text-gray-600 block mb-1">Enter verification code:</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full p-2 border-0 rounded font-roboto text-xs bg-[#E2E8F0]"
              maxLength={6}
              placeholder="6-digit code"
            />
          </div>

          {error && <p className="font-roboto text-xs text-red-500 mb-4">{error}</p>}

          <div className="flex justify-between">
            <button
              className="px-4 py-2 border rounded font-roboto text-xs"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded font-roboto text-xs"
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify and Enable'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};


export default TwoFactorSetup;
