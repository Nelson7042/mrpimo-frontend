"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { useVendorStore } from '@/stores/useVendorStore';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-toastify';
import { toastConfigError, toastConfigSuccess } from '@/app/config/toast.config';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider'); // "google" or null
  const { setUser } = useUserStore();
  const { setVendor } = useVendorStore();

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter the 2FA code', toastConfigError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ Critical: Send 2fa_token cookie
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (data.success) {
        // ✅ 2FA verified - now fetch full profile
        const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
          credentials: 'include'
        });

        if (profileResponse.ok) {
          const { user, vendor } = await profileResponse.json();
          setUser(user);
          if (vendor) setVendor(vendor);
          
          toast.success('Authentication successful!', toastConfigSuccess);
          router.push('/dashboard');
        } else {
          throw new Error('Failed to fetch profile');
        }
      } else {
        toast.error(data.message || 'Invalid 2FA code', toastConfigError);
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
            {provider === 'google' 
              ? 'Complete your Google sign-in with 2FA' 
              : 'Enter your 2FA code to continue'
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handle2FASubmit}>
          <div>
            <label htmlFor="code" className="sr-only">
              2FA Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
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

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}