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
  kycStatus: string;
  kycScore: string | null;
  status: string;
  createdAt: string;
  identityVerification?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    documentNumber?: string;
    documentType?: string;
    verifiedFirstName?: string;
    verifiedLastName?: string;
    verifiedMiddleName?: string;
    verifiedFullName?: string;
    reviewReason?: string;
    idFrontUrl?: string;
    idBackUrl?: string;
  };
}

export default function KycReviewPage() {
  const [page, setPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors-kyc-review', page],
    queryFn: async () => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/vendors/by-kyc-status/requires_review?page=${page}&limit=10`
      );
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/vendors/${vendorId}/accept`,
        { method: 'PATCH' }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept vendor');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Vendor KYC approved successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors-kyc-review'] });
      setSelectedVendor(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve vendor');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ vendorId, reason }: { vendorId: string; reason: string }) => {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/admin/vendors/${vendorId}/reject`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject vendor');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Vendor KYC rejected');
      queryClient.invalidateQueries({ queryKey: ['vendors-kyc-review'] });
      setSelectedVendor(null);
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject vendor');
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
        <h2 className="text-2xl font-bold text-gray-900">KYC Review Queue</h2>
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
          {pagination.total} pending review
        </span>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No vendors pending KYC review</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor: Vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {vendor.identityVerification?.firstName} {vendor.identityVerification?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{vendor.identityVerification?.documentNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      vendor.accountType === 'business' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">
                      {vendor.identityVerification?.reviewReason || 'Name mismatch detected'}
                    </p>
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
          <div className="bg-white rounded-lg w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Vendor Details</h3>
                <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Review Reason */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Review Reason</h4>
                  <p className="text-sm text-yellow-700">
                    {selectedVendor.identityVerification?.reviewReason || 'Name mismatch detected'}
                  </p>
                </div>

                {/* Name Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Provided Names</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">First:</span> {selectedVendor.identityVerification?.firstName || '-'}</p>
                      <p><span className="text-gray-500">Middle:</span> {selectedVendor.identityVerification?.middleName || '-'}</p>
                      <p><span className="text-gray-500">Last:</span> {selectedVendor.identityVerification?.lastName || '-'}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-700 mb-3">Verified Names (YouVerify)</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-blue-500">First:</span> {selectedVendor.identityVerification?.verifiedFirstName || '-'}</p>
                      <p><span className="text-blue-500">Middle:</span> {selectedVendor.identityVerification?.verifiedMiddleName || '-'}</p>
                      <p><span className="text-blue-500">Last:</span> {selectedVendor.identityVerification?.verifiedLastName || '-'}</p>
                      {selectedVendor.identityVerification?.verifiedFullName && (
                        <p><span className="text-blue-500">Full:</span> {selectedVendor.identityVerification.verifiedFullName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Document Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><span className="text-gray-500">Type:</span> {selectedVendor.identityVerification?.documentType || '-'}</p>
                    <p><span className="text-gray-500">Number:</span> {selectedVendor.identityVerification?.documentNumber || '-'}</p>
                  </div>
                </div>

                {/* ID Images */}
                {(selectedVendor.identityVerification?.idFrontUrl || selectedVendor.identityVerification?.idBackUrl) && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">ID Documents</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedVendor.identityVerification?.idFrontUrl && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Front</p>
                          <img 
                            src={selectedVendor.identityVerification.idFrontUrl} 
                            alt="ID Front" 
                            className="w-full rounded border"
                          />
                        </div>
                      )}
                      {selectedVendor.identityVerification?.idBackUrl && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Back</p>
                          <img 
                            src={selectedVendor.identityVerification.idBackUrl} 
                            alt="ID Back" 
                            className="w-full rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
              <h3 className="text-lg font-semibold mb-4">Reject KYC Application</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this vendor's KYC application.
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
