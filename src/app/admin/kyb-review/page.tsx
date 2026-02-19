"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Check, X, Eye, AlertCircle } from 'lucide-react';

interface Vendor {
  _id: string;
  userId: string;
  accountType: 'personal' | 'business';
  kybStatus: string;
  kybScore: string | null;
  kybRejectionReason: string | null;
  kybStatusIsVerified: boolean | null;
  status: string;
  createdAt: string;
  businessInfo?: {
    name?: string;
    registrationNumber?: string;
    shippingZone?: string;
  };
}

export default function KybReviewPage() {
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors-kyb-review', page],
    queryFn: async () => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/vendors/by-kyb-status/requires_review?page=${page}&limit=10`
      );
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/vendors/${vendorId}/accept-kyb`,
        { method: 'PATCH' }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept vendor KYB');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Vendor KYB approved successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors-kyb-review'] });
      setSelectedVendor(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve vendor KYB');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ vendorId, reason }: { vendorId: string; reason: string }) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/vendors/${vendorId}/reject-kyb`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject vendor KYB');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Vendor KYB rejected');
      queryClient.invalidateQueries({ queryKey: ['vendors-kyb-review'] });
      setSelectedVendor(null);
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject vendor KYB');
    },
  });

  const vendors = data?.data?.vendors || [];
  const pagination = data?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

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
        <h2 className="text-2xl font-bold text-gray-900">KYB Review Queue</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {pagination.total} pending review
        </span>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No vendors pending KYB review</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor: Vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{vendor.businessInfo?.name || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-600">{vendor.businessInfo?.registrationNumber || '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {vendor.businessInfo?.shippingZone || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedVendor(vendor)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => acceptMutation.mutate(vendor._id)}
                        disabled={acceptMutation.isPending}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setShowRejectModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
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
      )}

      {/* Detail Modal */}
      {selectedVendor && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-lg m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Business Details</h3>
                <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedVendor.businessInfo?.name || '-'}</p>
                    <p><span className="text-gray-500">Registration #:</span> {selectedVendor.businessInfo?.registrationNumber || '-'}</p>
                    <p><span className="text-gray-500">Region:</span> {selectedVendor.businessInfo?.shippingZone || '-'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Verification Status</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">KYB Status:</span> {selectedVendor.kybStatus}</p>
                    <p><span className="text-gray-500">Score:</span> {selectedVendor.kybScore || '-'}</p>
                    {selectedVendor.kybRejectionReason && (
                      <p><span className="text-gray-500">Issue:</span> {selectedVendor.kybRejectionReason}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => acceptMutation.mutate(selectedVendor._id)}
                    disabled={acceptMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-md m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Reject KYB Application</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this business verification.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full border rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectMutation.mutate({ vendorId: selectedVendor._id, reason: rejectReason })}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
