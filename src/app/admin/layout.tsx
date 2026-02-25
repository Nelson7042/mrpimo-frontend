"use client";

import React from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const adminNavItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Vendors', href: '/admin/vendors' },
    { name: 'KYB Review', href: '/admin/kyb-review' },
    { name: 'KYC Review', href: '/admin/kyc-review' },
    { name: 'Disputes', href: '/admin/disputes' },
  ];

  React.useEffect(() => {
    // Check if user is admin — backend stores sub-role in adminRole, not role
    const adminRoles = ['superadmin', 'vendor_admin', 'compliance_admin'];
    const userAdminRole = user?.adminRole || '';
    if (!user || (user.role !== 'admin' && !adminRoles.includes(userAdminRole))) {
      router.push('/');
    }
  }, [user, router]);

  const adminRoles = ['superadmin', 'vendor_admin', 'compliance_admin'];
  const userAdminRole = user?.adminRole || '';
  if (!user || (user.role !== 'admin' && !adminRoles.includes(userAdminRole))) {
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
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{user.adminRole || user.role}</span>
            </div>
          </div>
        </div>
      </nav>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto">
            {adminNavItems.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
