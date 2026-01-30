'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { useVendorStore } from '@/stores/useVendorStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();
  const { setVendor } = useVendorStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL
        const error = searchParams.get('error');
        if (error) {
          setStatus('error');
          setErrorMessage(error);
          setTimeout(() => router.push('/home'), 3000);
          return;
        }

        // Get tokens from URL params
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          // Fetch user profile using the same pattern as useAuth
          const response = await fetchWithAuth(`${API_BASE_URL}/users/profile`);
          
          if (response.ok) {
            const data = await response.json();
            
            // Set user in store
            if (data.user) {
              setUser(data.user);
            }
            
            // Set vendor if exists
            if (data.vendor) {
              setVendor(data.vendor);
            }

            setStatus('success');
            
            // Redirect to home after successful login
            setTimeout(() => router.push('/home'), 1000);
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } else {
          // No tokens in URL - might be using cookies
          // Try to fetch profile anyway
          const response = await fetchWithAuth(`${API_BASE_URL}/users/profile`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.user) {
              setUser(data.user);
            }
            
            if (data.vendor) {
              setVendor(data.vendor);
            }

            setStatus('success');
            setTimeout(() => router.push('/home'), 1000);
          } else {
            throw new Error('No tokens provided and profile fetch failed');
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        setTimeout(() => router.push('/home'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, setVendor]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600 text-sm">
              Please wait while we authenticate your account
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Sign in successful!
            </h2>
            <p className="text-gray-600 text-sm">
              Redirecting you to the homepage...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Authentication failed
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            <p className="text-gray-500 text-xs">
              Redirecting you back...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
