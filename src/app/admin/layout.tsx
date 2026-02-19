"use client";

import React from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const router = useRouter();

  React.useEffect(() => {
    // Check if user is admin
    const adminRoles = ['superadmin', 'vendor_admin', 'compliance_admin'];
    if (!user || !adminRoles.includes(user.role || '')) {
      router.push('/');
    }
  }, [user, router]);

  const adminRoles = ['superadmin', 'vendor_admin', 'compliance_admin'];
  if (!user || !adminRoles.includes(user.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{user.role}</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
