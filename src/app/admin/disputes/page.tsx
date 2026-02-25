"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { disputeService } from "@/services/disputeService";
import {
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "open":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "in-progress":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "resolved":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "closed":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 hover:bg-red-50";
    case "medium":
      return "bg-orange-50 text-orange-700 hover:bg-orange-50";
    case "low":
      return "bg-blue-50 text-blue-700 hover:bg-blue-50";
    default:
      return "bg-gray-50 text-gray-700 hover:bg-gray-50";
  }
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const data: any = await disputeService.getDisputeMetrics();
      setMetrics(data?.data || data);
    } catch {
      // Metrics are non-critical, silently fail
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchDisputes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: 10,
      };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (assignedFilter) params.assignedTo = assignedFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data: any = await disputeService.getAllDisputes(params);
      const items = data?.data?.issues || data?.issues || [];
      setDisputes(Array.isArray(items) ? items : []);
      setTotalPages(data?.data?.pagination?.pages || data?.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, priorityFilter, assignedFilter, startDate, endDate, currentPage]);

  const handleFilterReset = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setAssignedFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const openCount = metrics?.byStatus?.open ?? 0;
  const inProgressCount = metrics?.byStatus?.["in-progress"] ?? 0;
  const avgResolutionHours = metrics?.avgResolutionTimeHours ?? 0;
  const avgResolutionDays = (avgResolutionHours / 24).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Disputes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and resolve platform disputes
          </p>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Open Disputes</p>
            {metricsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{openCount}</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">In Progress</p>
            {metricsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Resolution Time</p>
            {metricsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {avgResolutionHours > 0 ? `${avgResolutionDays}d` : "—"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assigned Admin</label>
            <input
              type="text"
              value={assignedFilter}
              onChange={(e) => { setAssignedFilter(e.target.value); setCurrentPage(1); }}
              placeholder="Admin ID"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
        {(statusFilter || priorityFilter || assignedFilter || startDate || endDate) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleFilterReset}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Disputes Table */}
      {isLoading && disputes.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error && disputes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchDisputes}>Try Again</Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Case ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <AlertTriangle className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No disputes found</h3>
                      <p className="text-gray-500">Try adjusting your filters.</p>
                    </td>
                  </tr>
                ) : (
                  disputes.map((dispute: any) => {
                    const buyerName =
                      dispute.userId?.profile?.firstName
                        ? `${dispute.userId.profile.firstName} ${dispute.userId.profile.lastName || ""}`.trim()
                        : dispute.userId?.email || "—";
                    const vendorName =
                      dispute.orderId?.shipments?.[0]?.vendorId?.businessInfo?.name ||
                      dispute.orderId?.shipments?.[0]?.vendorId?.userId?.email ||
                      "—";
                    const assignedName =
                      dispute.assignedTo?.profile?.firstName
                        ? `${dispute.assignedTo.profile.firstName} ${dispute.assignedTo.profile.lastName || ""}`.trim()
                        : dispute.assignedTo?.email || "Unassigned";

                    return (
                      <tr
                        key={dispute._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/disputes/${dispute._id}`)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">
                            {dispute.caseId || `#${dispute._id?.slice(-8)}`}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-600">
                            #{dispute.orderId?._id?.slice(-8) || dispute.orderId?.toString().slice(-8) || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-600 truncate max-w-[120px]">{buyerName}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-600 truncate max-w-[120px]">{vendorName}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-600 truncate max-w-[150px]">{dispute.reason}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={getStatusBadgeClass(dispute.status)}>
                            <span className="capitalize text-xs">{dispute.status}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={getPriorityBadgeClass(dispute.priority)}>
                            <span className="capitalize text-xs">{dispute.priority}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-600 truncate max-w-[100px]">{assignedName}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm text-gray-500">
                            {dispute.createdAt
                              ? format(new Date(dispute.createdAt), "MMM dd, yyyy")
                              : "—"}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
