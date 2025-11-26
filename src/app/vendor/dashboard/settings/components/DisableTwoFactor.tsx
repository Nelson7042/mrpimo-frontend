import React, { useState } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

type Props = {
  onComplete: (updatedUser: any) => void;
  onCancel: () => void;
};

const DisableTwoFactor = ({ onComplete, onCancel }: Props) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    if (!code) {
      setError('Please enter your verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth('http://localhost:5800/api/v1/two-factor/disable', {
        method: 'POST',
        body: JSON.stringify({ token: code })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to disable 2FA');
      }
      
      const data = await response.json();
      onComplete({ twoFactorAuth: { enabled: false } });
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Disable Two-Factor Authentication</h3>
        <p className="mb-4">Please enter your verification code to disable 2FA.</p>
        
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter verification code"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <div className="flex justify-end gap-2">
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleDisable}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            {loading ? 'Processing...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisableTwoFactor;
