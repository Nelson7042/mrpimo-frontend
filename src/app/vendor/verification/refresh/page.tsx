"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

const RefreshVerificationPage = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const router = useRouter();

  const checkVerificationStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetchWithAuth('/api/v1/verification/status');

      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }
      const data = await response.json();
      setVerificationStatus(data);
      
      if (data.status === 'verified') {
        router.push('/vendor/verification/complete');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const handleContinueVerification = () => {
    const country = verificationStatus?.country || 'NG';
    router.push(`/vendor/verification/${country}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Incomplete
          </h1>
          
          <p className="text-gray-600 mb-6">
            It looks like you didn't finish your verification process. 
            You can continue where you left off.
          </p>

          {verificationStatus && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Current Status:</h3>
              <p className="text-sm text-gray-600">
                Status: <span className="font-medium">{verificationStatus.status}</span>
              </p>
              {verificationStatus.requirements_pending?.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Pending: {verificationStatus.requirements_pending.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleContinueVerification}
              disabled={isChecking}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue Verification
            </button>
            
            <button
              onClick={checkVerificationStatus}
              disabled={isChecking}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Check Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefreshVerificationPage;