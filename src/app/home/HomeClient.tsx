"use client"

import AuctionedProduct from "@/components/Home/AuctionedProduct";
import BestDeals from "@/components/Home/BestDeals";
import ShopCategoriesComponent from "@/components/Home/ByCategory";
import ComputerAccessories from "@/components/Home/ComputerAccessories";
import Cta from "@/components/Home/Cta";
import PromotionalCollections from "@/components/Home/PromotionalCollections";
import MarketplaceSection from "@/components/Home/Hero";
import CustomerReviews from "@/components/Home/Review";
import React from "react";

export default function HomeClient() {
  return (
    <div className="font-roboto ">
      <MarketplaceSection />
      <BestDeals />
      <ShopCategoriesComponent />
      <PromotionalCollections />
      <AuctionedProduct />
      <ComputerAccessories />
      <CustomerReviews />
      <Cta />
    </div>
  );
}
