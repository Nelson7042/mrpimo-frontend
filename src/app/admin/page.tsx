"use client";

import React from 'react';
import Link from 'next/link';
import { Users, FileCheck, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/kyc-review" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">KYC Review</h3>
                <p className="text-sm text-gray-500">Review pending identity verifications</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/kyb-review" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">KYB Review</h3>
                <p className="text-sm text-gray-500">Review pending business verifications</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/vendors" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">All Vendors</h3>
                <p className="text-sm text-gray-500">View and manage all vendors</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
