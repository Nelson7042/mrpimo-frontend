"use client";

import React, { useState } from "react";
import {
  Package,
  Truck,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Check,
  X,
  CheckCircle2,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useShippingOrders, useConfirmHandoff, useRejectHandoff, useMarkDelivered, useOverrideStatus, useAuditLog } from "@/hooks/useShippingAdmin";
import { ShippingOrdersFilters, ShippingShipment } from "@/utils/shippingAdminService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SHIPMENT_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "preparing_shipment", label: "Preparing Shipment" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

const FULFILLMENT_METHODS = [
  { value: "all", label: "All Methods" },
  { value: "pickup", label: "Pickup" },
  { value: "dropoff", label: "Dropoff" },
];

function getHandoffStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "vendor_claimed":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getShipmentStatusColor(status: string) {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "shipped":
    case "in_transit":
      return "bg-blue-100 text-blue-800";
    case "out_for_delivery":
      return "bg-indigo-100 text-indigo-800";
    case "preparing_shipment":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "pending":
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const VALID_OVERRIDE_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "preparing_shipment", label: "Preparing Shipment" },
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

// Statuses that allow the "Mark Delivered" button
const MARK_DELIVERED_ELIGIBLE_STATUSES = ["shipped", "in_transit", "out_for_delivery"];

function ShipmentActions({
  orderId,
  shipment,
}: {
  orderId: string;
  shipment: ShippingShipment;
}) {
  const [showOverride, setShowOverride] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [deliveredNotes, setDeliveredNotes] = useState("");
  const [showDeliveredNotes, setShowDeliveredNotes] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  const markDelivered = useMarkDelivered();
  const overrideStatus = useOverrideStatus();
  const { data: auditLog, isLoading: auditLoading } = useAuditLog(
    orderId,
    shipment._id,
    showAuditLog
  );

  const currentStatus = shipment.shipping?.status || "pending";
  const canMarkDelivered = MARK_DELIVERED_ELIGIBLE_STATUSES.includes(currentStatus);

  const handleMarkDelivered = () => {
    markDelivered.mutate({
      orderId,
      shipmentId: shipment._id,
      notes: deliveredNotes || undefined,
    });
    setShowDeliveredNotes(false);
    setDeliveredNotes("");
  };

  const handleOverrideStatus = () => {
    if (!overrideTarget || overrideTarget === currentStatus) return;
    overrideStatus.mutate({
      orderId,
      shipmentId: shipment._id,
      status: overrideTarget,
      notes: overrideNotes || undefined,
    });
    setShowOverride(false);
    setOverrideTarget("");
    setOverrideNotes("");
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Shipment-level actions row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mark Delivered Button */}
        {canMarkDelivered && (
          <>
            {!showDeliveredNotes ? (
              <button
                onClick={() => setShowDeliveredNotes(true)}
                disabled={markDelivered.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                aria-label="Mark shipment as delivered"
              >
                {markDelivered.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Mark Delivered
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  placeholder="Add notes (optional)..."
                  value={deliveredNotes}
                  onChange={(e) => setDeliveredNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleMarkDelivered();
                  }}
                  className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  aria-label="Delivery notes"
                />
                <button
                  onClick={handleMarkDelivered}
                  disabled={markDelivered.isPending}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {markDelivered.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowDeliveredNotes(false);
                    setDeliveredNotes("");
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}

        {/* Status Override Toggle */}
        <button
          onClick={() => setShowOverride(!showOverride)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="Toggle status override"
        >
          {showOverride ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          Override Status
        </button>

        {/* Audit Log Toggle */}
        <button
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          aria-label="Toggle audit log"
        >
          <History className="h-3.5 w-3.5" />
          Audit Trail
        </button>
      </div>

      {/* Status Override Panel */}
      {showOverride && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">Override Shipment Status</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select
              value={overrideTarget}
              onValueChange={setOverrideTarget}
            >
              <SelectTrigger className="h-[32px] text-xs w-full sm:w-48">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {VALID_OVERRIDE_STATUSES.filter(
                  (s) => s.value !== currentStatus
                ).map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="text"
              placeholder="Reason / notes..."
              value={overrideNotes}
              onChange={(e) => setOverrideNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleOverrideStatus();
              }}
              className="flex-1 w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Override notes"
            />
            <button
              onClick={handleOverrideStatus}
              disabled={!overrideTarget || overrideTarget === currentStatus || overrideStatus.isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {overrideStatus.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Apply
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Current status: <span className="font-medium">{formatStatus(currentStatus)}</span>
          </p>
        </div>
      )}

      {/* Audit Log Panel */}
      {showAuditLog && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Audit Trail</p>
          {auditLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              <span className="text-xs text-gray-500">Loading audit log...</span>
            </div>
          ) : auditLog && auditLog.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {auditLog.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-0.5 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-800">
                      {formatStatus(entry.action)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {entry.metadata.previousStatus && (
                      <span>
                        {formatStatus(entry.metadata.previousStatus)} → {formatStatus(entry.metadata.newStatus)}
                      </span>
                    )}
                  </div>
                  {entry.metadata.notes && (
                    <p className="text-xs text-gray-500 italic">
                      &quot;{entry.metadata.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No overrides recorded for this shipment.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ShippingAdminDashboard() {
  const [filters, setFilters] = useState<ShippingOrdersFilters>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [confirmNotes, setConfirmNotes] = useState<Record<string, string>>({});
  const [showNotesInput, setShowNotesInput] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError, error, refetch } = useShippingOrders(filters);
  const confirmHandoff = useConfirmHandoff();
  const rejectHandoff = useRejectHandoff();

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      shipmentStatus: value === "all" ? undefined : value,
    }));
  };

  const handleFulfillmentFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      fulfillmentMethod: value === "all" ? undefined : value,
    }));
  };

  const handleDateFilter = () => {
    setFilters((prev) => ({
      ...prev,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }));
  };

  const handleVendorFilter = () => {
    setFilters((prev) => ({
      ...prev,
      vendor: vendorSearch || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setStartDate("");
    setEndDate("");
    setVendorSearch("");
  };

  const getItemKey = (orderId: string, shipmentId: string, itemIdx: number) =>
    `${orderId}-${shipmentId}-${itemIdx}`;

  const handleShowConfirmNotes = (key: string) => {
    setShowNotesInput((prev) => ({ ...prev, [key]: true }));
  };

  const handleConfirmHandoff = (orderId: string, shipmentId: string, itemIndex: number) => {
    const key = getItemKey(orderId, shipmentId, itemIndex);
    confirmHandoff.mutate({
      orderId,
      shipmentId,
      itemIndex,
      notes: confirmNotes[key] || undefined,
    });
    // Clean up notes state
    setShowNotesInput((prev) => ({ ...prev, [key]: false }));
    setConfirmNotes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRejectHandoff = (orderId: string, shipmentId: string, itemIndex: number) => {
    rejectHandoff.mutate({ orderId, shipmentId, itemIndex });
  };

  const handleCancelConfirm = (key: string) => {
    setShowNotesInput((prev) => ({ ...prev, [key]: false }));
    setConfirmNotes((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const summary = data?.summary || {
    pendingHandoff: 0,
    awaitingConfirmation: 0,
    inTransit: 0,
  };

  return (
    <div className="bg-[#f6f6f6] rounded-lg font-light shadow-md p-2 md:p-4 lg:p-6 min-h-screen font-roboto">
      <div className="px-2 lg:px-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base md:text-lg font-semibold">
              Shipping Admin Dashboard
            </h1>
            <p className="text-xs text-gray-600">
              Manage fulfillment pipeline and verify vendor handoffs
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Refresh orders"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Vendor Handoff</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.pendingHandoff}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Awaiting Confirmation</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.awaitingConfirmation}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">In Transit</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.inTransit}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Date Range */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={handleDateFilter}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-500">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={handleDateFilter}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Vendor Search */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Vendor</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendor..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  onBlur={handleVendorFilter}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVendorFilter();
                  }}
                  className="w-full border border-gray-200 rounded-md pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Shipment Status */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Shipment Status</label>
              <Select
                value={filters.shipmentStatus || "all"}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="h-[34px] text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {SHIPMENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fulfillment Method */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Fulfillment Method</label>
              <Select
                value={filters.fulfillmentMethod || "all"}
                onValueChange={handleFulfillmentFilter}
              >
                <SelectTrigger className="h-[34px] text-xs">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  {FULFILLMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.startDate ||
            filters.endDate ||
            filters.vendor ||
            filters.shipmentStatus ||
            filters.fulfillmentMethod) && (
            <button
              onClick={handleClearFilters}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading orders...</span>
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">
              Failed to load orders
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(error as Error)?.message || "Something went wrong"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : data?.orders && data.orders.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Showing {data.orders.length} of {data.total} orders
            </p>

            {data.orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-full font-medium",
                          getShipmentStatusColor(order.status)
                        )}
                      >
                        {formatStatus(order.status)}
                      </span>
                      {order.metadata?.isBidCheckout && (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-purple-100 text-purple-800">
                          Auction
                        </span>
                      )}
                      {order.user && (
                        <span className="text-xs text-gray-500">
                          Buyer: {order.user.firstName || order.user.email || "N/A"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipments and Items */}
                <div className="divide-y divide-gray-100">
                  {order.shipments.map((shipment, shipmentIdx) => (
                    <div key={shipment._id || shipmentIdx} className="px-4 py-3">
                      {/* Shipment Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">
                            Shipment {shipmentIdx + 1}
                          </span>
                          {shipment.vendorName && (
                            <span className="text-xs text-gray-500">
                              — {shipment.vendorName}
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs rounded-full font-medium",
                            getShipmentStatusColor(shipment.shipping?.status || "pending")
                          )}
                        >
                          {formatStatus(shipment.shipping?.status || "pending")}
                        </span>
                      </div>

                      {/* Shipment Meta */}
                      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
                        {shipment.shipping?.fulfillmentMethod && (
                          <span className="inline-flex items-center gap-1">
                            {shipment.shipping.fulfillmentMethod === "pickup" ? (
                              <Truck className="h-3 w-3" />
                            ) : (
                              <Package className="h-3 w-3" />
                            )}
                            {formatStatus(shipment.shipping.fulfillmentMethod)}
                          </span>
                        )}
                        {shipment.shipping?.waybill && (
                          <span>Waybill: {shipment.shipping.waybill}</span>
                        )}
                        {shipment.shipping?.tempCode && (
                          <span>TempCode: {shipment.shipping.tempCode}</span>
                        )}
                        {shipment.fulfillmentDeadline && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Deadline: {formatDate(shipment.fulfillmentDeadline)}
                          </span>
                        )}
                      </div>

                      {/* Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500">
                              <th className="px-3 py-2 text-left font-medium">
                                Product
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Vendor
                              </th>
                              <th className="px-3 py-2 text-center font-medium">
                                Qty
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Fulfillment
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Handoff Status
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {shipment.items.map((item, itemIdx) => {
                              const itemKey = getItemKey(order._id, shipment._id, itemIdx);
                              const isNotesVisible = showNotesInput[itemKey];

                              return (
                                <React.Fragment key={itemIdx}>
                                  <tr className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2 text-gray-900 font-medium">
                                      {item.productName || "Unknown Product"}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      {item.vendorName || "N/A"}
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-600">
                                      {item.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      {item.fulfillmentMethod
                                        ? formatStatus(item.fulfillmentMethod)
                                        : "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded-full text-xs font-medium",
                                          getHandoffStatusColor(item.handoffStatus)
                                        )}
                                      >
                                        {formatStatus(item.handoffStatus || "pending")}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      {item.handoffStatus === "vendor_claimed" && (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => handleShowConfirmNotes(itemKey)}
                                            disabled={confirmHandoff.isPending}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                                            aria-label={`Confirm handoff for ${item.productName}`}
                                          >
                                            <Check className="h-3 w-3" />
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => handleRejectHandoff(order._id, shipment._id, itemIdx)}
                                            disabled={rejectHandoff.isPending}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                                            aria-label={`Reject handoff for ${item.productName}`}
                                          >
                                            <X className="h-3 w-3" />
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                  {/* Notes input row for confirmation */}
                                  {item.handoffStatus === "vendor_claimed" && isNotesVisible && (
                                    <tr>
                                      <td colSpan={6} className="px-3 py-2 bg-green-50/50">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            placeholder="Add notes (optional)..."
                                            value={confirmNotes[itemKey] || ""}
                                            onChange={(e) =>
                                              setConfirmNotes((prev) => ({
                                                ...prev,
                                                [itemKey]: e.target.value,
                                              }))
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleConfirmHandoff(order._id, shipment._id, itemIdx);
                                              }
                                            }}
                                            className="flex-1 border border-gray-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                            aria-label="Confirmation notes"
                                          />
                                          <button
                                            onClick={() => handleConfirmHandoff(order._id, shipment._id, itemIdx)}
                                            disabled={confirmHandoff.isPending}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                                          >
                                            {confirmHandoff.isPending ? (
                                              <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <Check className="h-3 w-3" />
                                            )}
                                            Submit
                                          </button>
                                          <button
                                            onClick={() => handleCancelConfirm(itemKey)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Shipment-level Actions: Mark Delivered, Override Status, Audit Trail */}
                      <ShipmentActions orderId={order._id} shipment={shipment} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No orders found</p>
            <p className="text-xs text-gray-500 mt-1">
              There are no processing orders matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
