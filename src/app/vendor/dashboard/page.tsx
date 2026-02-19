"use client";

import React, { useEffect, useState } from "react";
import AnalyticsCard from "./(components)/AnalyticsCard";
import AnalyticsCardSkeleton from "./(components)/skeletons/AnalyticsCardSkeleton";
import SalesOverview from "./(components)/SalesOverview";
import SalesOverviewSkeleton from "./(components)/skeletons/SalesOverviewSkeleton";
import SalesActivity from "./(components)/SalesActivity";
import SalesActivitySkeleton from "./(components)/skeletons/SalesActivitySkeleton";
import RecentOrders from "./(components)/RecentOrders";
import RecentOrdersSkeleton from "./(components)/skeletons/RecentOrdersSkeleton";
import { useSocket } from "@/hooks/useSocket";
import { useUserNotifications, useVendorAnalytics } from "@/hooks/queries";
import Link from "next/link";
import { useVendorStore } from "@/stores/useVendorStore";
import KycModal from "@/components/KycModal";
import KybModal from "@/components/KybModal";

type Props = {};

const Page = (props: Props) => {
  const { vendor } = useVendorStore();
  const socket = useSocket();
  const { data, isLoading } = useVendorAnalytics(vendor?._id!);
  const [showKybModal, setShowKybModal] = useState(false);
  const isPersonalAccount = vendor?.accountType === 'personal';
  
  // For business accounts, check both KYC and KYB status
  // For personal accounts, only check KYC status
  const needsKycVerification = vendor?.kycStatus !== "verified";
  const needsKybVerification = !isPersonalAccount && vendor?.kybStatus !== "verified";
  const needsVerification = isPersonalAccount ? needsKycVerification : (needsKycVerification || needsKybVerification);
  
  // Determine which verification is pending for business accounts
  const getVerificationStatus = () => {
    if (isPersonalAccount) {
      return vendor?.kycStatus || 'pending';
    }
    // For business accounts
    if (vendor?.kycStatus !== 'verified') {
      return vendor?.kycStatus || 'pending';
    }
    // KYC is verified, check KYB
    return vendor?.kybStatus || 'pending';
  };
  
  const verificationStatus = getVerificationStatus();

  const [vendorCurrency] = useState(
    data?.dashboard?.salesTotal?.currency || ""
  );

  useUserNotifications(true);

  useEffect(() => {
    if (!vendor || !socket) return;

    const handleConnect = () => {
      socket.emit("registerVendor", vendor._id);
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, vendor]);

  

  return (
    <div className="bg-[#f6f6f6] font-roboto">
      <div className="p-4 md:p-10">
        <h1 className="font-bold text-xl mb-2">Dashboard</h1>
        <p className="mb-3 md:mb-5 text-sm">
          {`Hey ${vendor?.businessInfo?.name}, welcome back! Let’s take a look at what’s going on in your store today.`}
        </p>
        
        {needsVerification && (
          <div className="">
            <div className={`border rounded-lg p-2 md:p-5 mb-4 md:mb-5 ${
              verificationStatus === 'requires_review' 
                ? 'bg-yellow-50 border-yellow-200' 
                : verificationStatus === 'rejected'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-[#f1f1f1] border-[#e1e1e1]'
            }`}>
              <h2 className="font-bold text-lg mb-2">
                {isPersonalAccount ? 'KYC' : (vendor?.kycStatus === 'verified' ? 'KYB (Business)' : 'KYC/KYB')} Verification
              </h2>
              <p className="text-sm mb-4">
                {verificationStatus === 'requires_review' 
                  ? 'Your verification is under review. An administrator will review your information shortly.'
                  : verificationStatus === 'rejected'
                    ? `Your ${!isPersonalAccount && vendor?.kycStatus === 'verified' ? 'business' : ''} verification was rejected. Please try again with correct information.`
                    : !isPersonalAccount && vendor?.kycStatus === 'verified'
                      ? `Your business verification is ${vendor?.kybStatus || 'pending'}. Please complete KYB verification to access all features.`
                      : `Your verification is ${verificationStatus}. Please complete the verification to be able to request payouts and access all features.`
                }
              </p>
              {verificationStatus !== 'requires_review' && (
                <button onClick={() => setShowKybModal(true)} className="text-blue-600 underline text-sm">
                  {verificationStatus === 'rejected' ? 'Retry' : verificationStatus === 'pending' ? 'Continue' : 'Start'} {isPersonalAccount ? 'KYC' : (vendor?.kycStatus === 'verified' ? 'KYB' : 'KYC/KYB')} Process
                </button>
              )}
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {isLoading ? (
            <>
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
              <AnalyticsCardSkeleton />
            </>
          ) : (
            <>
              <AnalyticsCard
                title="Sales Total"
                percentageIncrease={data?.dashboard?.salesTotal}
                amount={data?.dashboard?.salesTotal?.value}
                currency={data?.dashboard?.salesTotal?.currency}
              />
              <AnalyticsCard
                title="Total Orders"
                percentageIncrease={data?.dashboard?.totalOrders}
                value={data?.dashboard?.totalOrders?.value}
              />
              <AnalyticsCard
                title="Total Products"
                value={data?.dashboard?.totalProducts?.value}
              />
            </>
          )}
        </div>

        {/* Sales Overview & Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-5">
          <div className="col-span-1 xl:col-span-8">
            {isLoading ? (
              <SalesOverviewSkeleton />
            ) : (
              <SalesOverview vendorId={vendor?._id!} />
            )}
          </div>
          <div className="col-span-1 xl:col-span-4">
            {isLoading ? <SalesActivitySkeleton /> : <SalesActivity />}
          </div>
        </div>

        {/* Recent Orders */}
        <RecentOrders currency={vendorCurrency} />
      </div>

      {isPersonalAccount ? (
        <KycModal isOpen={showKybModal} onClose={() => setShowKybModal(false)} />
      ) : (
        <KybModal isOpen={showKybModal} onClose={() => setShowKybModal(false)} />
      )}
    </div>
  );
};

export default Page;
