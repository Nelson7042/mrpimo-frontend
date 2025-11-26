import { ProductListingProvider } from "@/contexts/ProductLisitngContext";
import React from "react";

type Props = {};

const layout = ({ children }: { children: React.ReactNode }) => {
  return <ProductListingProvider>{children}</ProductListingProvider>;
};

export default layout;
