"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { useVendorStore } from '@/stores/useVendorStore';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-toastify';
import { toastConfigError, toastConfigSuccess } from '@/app/config/toast.config';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider'); // "google", "apple", or null
  const { setUser } = useUserStore();
  const { setVendor } = useVendorStore();

  const getProviderLabel = () => {
    if (provider === 'google') return 'Complete your Google sign-in with 2FA';
    if (provider === 'apple') return 'Complete your Apple sign-in with 2FA';
    return 'Enter your 2FA code to continue';
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error(
        isUsingBackupCode ? 'Please enter a backup code' : 'Please enter the 2FA code',
        toastConfigError
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const body = isUsingBackupCode ? { backupCode: code, trustDevice } : { code, trustDevice };
      const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
          credentials: 'include'
        });

        if (profileResponse.ok) {
          const { user, vendor } = await profileResponse.json();
          setUser(user);
          if (vendor) {
            setVendor(vendor);
          }
          toast.success('Authentication successful!', toastConfigSuccess);
          router.push('/dashboard');
        } else {
          throw new Error('Failed to fetch profile');
        }
      } else {
        toast.error(data.message || 'Invalid code', toastConfigError);
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed', toastConfigError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getProviderLabel()}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handle2FASubmit}>
          <div>
            <label htmlFor="code" className="sr-only">
              {isUsingBackupCode ? 'Backup Code' : '2FA Code'}
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder={isUsingBackupCode ? 'Enter backup code' : 'Enter 6-digit code'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={isUsingBackupCode ? 20 : 6}
            />
          </div>

          {/* Trust this device checkbox */}
          <div className="flex items-center">
            <input
              id="trust-device-2fa"
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              aria-label="Trust this device for 30 days"
            />
            <label htmlFor="trust-device-2fa" className="ml-2 block text-sm text-gray-700">
              Trust this device for 30 days
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsUsingBackupCode(!isUsingBackupCode);
                setCode('');
              }}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              {isUsingBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
            </button>
            <br />
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
