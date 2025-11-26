import { ProductListingProvider } from "@/contexts/ProductLisitngContext";
import React from "react";

export default function EditProductLayout({ children }: { children: React.ReactNode }) {
  return <ProductListingProvider>{children}</ProductListingProvider>;
}
