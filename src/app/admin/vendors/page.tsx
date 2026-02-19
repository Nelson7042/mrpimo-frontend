"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

interface Vendor {
  _id: string;
  userId: string;
  accountType: 'personal' | 'business';
  kycStatus: string;
  kybStatus: string | null;
  status: string;
  createdAt: string;
  businessInfo?: {
    name?: string;
  };
  identityVerification?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function VendorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-vendors', page],
    queryFn: async () => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/vendors?page=${page}&limit=20`
      );
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    },
  });

  const vendors = data?.data?.vendors || [];
  const pagination = data?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      requires_review: 'bg-orange-100 text-orange-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading vendors. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">All Vendors</h2>
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/kyc-review"
            className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm"
          >
            KYC Review Queue
          </Link>
          <Link 
            href="/admin/kyb-review"
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm"
          >
            KYB Review Queue
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYB Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors
              .filter((v: Vendor) => {
                if (!search) return true;
                const name = v.businessInfo?.name || `${v.identityVerification?.firstName || ''} ${v.identityVerification?.lastName || ''}`;
                return name.toLowerCase().includes(search.toLowerCase());
              })
              .map((vendor: Vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">
                      {vendor.businessInfo?.name || 
                       `${vendor.identityVerification?.firstName || ''} ${vendor.identityVerification?.lastName || ''}`.trim() || 
                       'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{vendor._id}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      vendor.accountType === 'business' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(vendor.kycStatus)}`}>
                      {vendor.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {vendor.kybStatus ? (
                      <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(vendor.kybStatus)}`}>
                        {vendor.kybStatus}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      vendor.status === 'active' ? 'bg-green-100 text-green-800' :
                      vendor.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
