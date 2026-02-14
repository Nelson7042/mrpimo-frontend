'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { useVendorStore } from '@/stores/useVendorStore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';
import Image from 'next/image';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();
  const { setVendor } = useVendorStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);

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

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

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

            setProgress(100);
            clearInterval(progressInterval);
            setStatus('success');
            
            // Redirect to home after successful login
            setTimeout(() => router.push('/home'), 1500);
          } else {
            clearInterval(progressInterval);
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

            setProgress(100);
            clearInterval(progressInterval);
            setStatus('success');
            setTimeout(() => router.push('/home'), 1500);
          } else {
            clearInterval(progressInterval);
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
    <div className="font-roboto min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden" style={{ fontFamily: 'var(--font-roboto)' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary opacity-5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary opacity-5 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <div className="relative z-10 text-center p-8 sm:p-10 md:p-12 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl max-w-lg w-full mx-4 border border-gray-100">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/mprimo-logo2.png"
            alt="Mprimo"
            width={140}
            height={45}
            className="h-10 w-auto"
            priority
          />
        </div>

        {status === 'loading' && (
          <div className="space-y-6">
            {/* Modern loader */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin-smooth"
                style={{ animationDuration: '1s' }}
              ></div>
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Authenticating
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Securely signing you in...
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </div>
              <span>Verifying credentials</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-fade-in">
            {/* Success checkmark with animation */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-scale-in"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600 animate-check-draw" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Successfully authenticated
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
              <span>Taking you to your dashboard</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-fade-in">
            {/* Error icon with animation */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-shake"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                {errorMessage || 'Unable to complete sign in'}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600 text-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <span>Redirecting to homepage</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-30px, 30px) rotate(-120deg); }
          66% { transform: translate(20px, -20px) rotate(-240deg); }
        }

        @keyframes spin-smooth {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes check-draw {
          0% {
            stroke-dasharray: 0, 100;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dasharray: 100, 0;
            opacity: 1;
          }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }

        .animate-spin-smooth {
          animation: spin-smooth 1s linear infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-check-draw {
          animation: check-draw 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
