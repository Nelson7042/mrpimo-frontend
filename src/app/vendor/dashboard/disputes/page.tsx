"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { disputeService } from "@/services/disputeService";
import { Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const STATUS_TABS = ["all", "open", "in-progress", "resolved", "closed"] as const;
const PRIORITY_OPTIONS = ["all", "low", "medium", "high"] as const;
const REASON_OPTIONS = [
  "all", "Product Defective", "Wrong Item Received", "Missing Items",
  "Damaged Package", "Late Delivery", "Poor Quality", "Not as Described", "Other",
] as const;
const limitOptions = [5, 10, 20, 50];

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "open": return "bg-red-100 text-red-800 hover:bg-red-100";
    case "in-progress": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "resolved": return "bg-green-100 text-green-800 hover:bg-green-100";
    case "closed": return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "high": return "bg-red-50 text-red-700 hover:bg-red-50";
    case "medium": return "bg-orange-50 text-orange-700 hover:bg-orange-50";
    case "low": return "bg-blue-50 text-blue-700 hover:bg-blue-50";
    default: return "bg-gray-50 text-gray-700 hover:bg-gray-50";
  }
};

export default function VendorDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [reason, setReason] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDisputes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (activeTab !== "all") params.status = activeTab;
      if (priority !== "all") params.priority = priority;
      if (reason !== "all") params.reason = reason;

      const data: any = await disputeService.getVendorDisputes(params);
      const items = data?.data?.issues || data?.issues || [];
      setDisputes(Array.isArray(items) ? items : []);
      const pag = data?.data?.pagination || data?.pagination;
      setTotal(pag?.total || 0);
      setTotalPages(pag?.pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [activeTab, priority, reason, currentPage, itemsPerPage]);

  const resetPage = () => setCurrentPage(1);
  const handleTabChange = (tab: string) => { setActiveTab(tab); resetPage(); };
  const handlePriorityChange = (val: string) => { setPriority(val); resetPage(); };
  const handleReasonChange = (val: string) => { setReason(val); resetPage(); };
  const handleLimitChange = (val: number) => { setItemsPerPage(val); resetPage(); };

  if (isLoading && disputes.length === 0) {
    return (
      <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 font-roboto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && disputes.length === 0) {
    return (
      <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 font-roboto flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDisputes}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f6f6] rounded-lg shadow-md p-2 md:p-4 lg:p-6 font-roboto min-h-screen">
      <div className="px-2 lg:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base md:text-lg font-semibold">Disputes</h1>
            <p className="text-xs text-gray-800">View and respond to disputes raised against your orders</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 mt-5 mb-4 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Priority & Reason Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Priority:</label>
            <select
              value={priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Reason:</label>
            <select
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              {REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{r === "all" ? "All" : r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b font-semibold text-xs text-gray-700 uppercase tracking-wide">
            <div className="col-span-2">Case ID</div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Reason</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Created</div>
          </div>

          <div className="divide-y divide-gray-100">
            {disputes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <AlertTriangle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No disputes found</h3>
                <p className="text-gray-500">
                  {activeTab === "all" ? "No disputes have been raised against your orders." : `No ${activeTab} disputes found.`}
                </p>
              </div>
            ) : (
              disputes.map((dispute: any) => (
                <div
                  key={dispute._id}
                  className="transition-all duration-200 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => router.push(`/vendor/dashboard/disputes/${dispute._id}`)}
                >
                  <div className="md:hidden p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {dispute.caseId || `#${dispute._id?.slice(-8)}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {dispute.createdAt ? format(new Date(dispute.createdAt), "MMM dd, yyyy") : "—"}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeClass(dispute.status)}>
                        <span className="capitalize text-xs">{dispute.status}</span>
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <span>Order: #{dispute.orderId?._id?.slice(-8) || dispute.orderId?.toString().slice(-8) || "—"}</span>
                      <Badge className={getPriorityBadgeClass(dispute.priority)}>
                        <span className="capitalize text-xs">{dispute.priority}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{dispute.reason}</p>
                  </div>

                  <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 items-center">
                    <div className="col-span-2">
                      <p className="font-semibold text-xs text-gray-900">
                        {dispute.caseId || `#${dispute._id?.slice(-8)}`}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600">
                        #{dispute.orderId?._id?.slice(-8) || dispute.orderId?.toString().slice(-8) || "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 truncate">{dispute.reason}</p>
                    </div>
                    <div className="col-span-2">
                      <Badge className={getStatusBadgeClass(dispute.status)}>
                        <span className="capitalize text-xs">{dispute.status}</span>
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Badge className={getPriorityBadgeClass(dispute.priority)}>
                        <span className="capitalize text-xs">{dispute.priority}</span>
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600">
                        {dispute.createdAt ? format(new Date(dispute.createdAt), "MMM dd, yyyy") : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={total}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}