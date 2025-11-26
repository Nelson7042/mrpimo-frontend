import React from "react";
import Select from "./Select";
import Input from "./Input";
import NavigationButtons from "./NavigationButtons";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useResponsive } from "@/hooks/useResponsive";
import ColorPicker from "./ColorPicker";

type Props = {
  onSaveDraft?: () => void;
};

const PricingInformation = (props: Props) => {
  const { updateProductDetails, productDetails } = useProductListing();
  const [listingType, setListingType] = React.useState<
    "auction" | "instantSale" | null
  >(null);
  const [pricingInformation, setPricingInformation] = React.useState({
    listingType: productDetails?.pricingInformation?.listingType || null,
    storeQuantity: productDetails?.pricingInformation?.storeQuantity || "",
    auction: {
      startPrice: productDetails?.pricingInformation?.auction?.startPrice || 0,
      reservePrice: productDetails?.pricingInformation?.auction?.reservePrice || "",
      buyNowPrice: productDetails?.pricingInformation?.auction?.buyNowPrice || "",
      startTime: productDetails?.pricingInformation?.auction?.startTime || "",
      endTime: productDetails?.pricingInformation?.auction?.endTime || "",
      colors: productDetails?.pricingInformation?.auction?.colors || [],
    },
    instantSale: {
      price: productDetails?.pricingInformation?.instantSale?.price || "" as string | number,
      salePrice: productDetails?.pricingInformation?.instantSale?.salePrice || "" as string | number,
      acceptOffer: productDetails?.pricingInformation?.instantSale?.acceptOffer || false as boolean,
      colors: productDetails?.pricingInformation?.instantSale?.colors || [],
    },
  });
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const { isMobileOrTablet } = useResponsive();

  const handleAcceptOfferChange = (value: boolean) => {
    setPricingInformation((prev) => ({
      ...prev,
      instantSale: {
        ...prev.instantSale,
        acceptOffer: value,
      },
    }));
    updateProductDetails("pricingInformation", {
      ...pricingInformation,
      instantSale: {
        ...pricingInformation.instantSale,
        acceptOffer: value,
      },
    });
  };

  const validatePricingInformation = () => {
    const newErrors: { [key: string]: string } = {};
    const hasVariants = productDetails.variants && productDetails.variants.length > 0;

    if (pricingInformation.listingType === null) {
      newErrors.listingType = "Listing type is required";
    }

    if (pricingInformation.listingType === "auction") {
      if (pricingInformation.auction.startPrice <= 0) {
        newErrors.startPrice = "Start price must be greater than 0";
      }
      if (pricingInformation.auction.startTime === "") {
        newErrors.startTime = "Start time is required";
      }
      if (pricingInformation.auction.endTime === "") {
        newErrors.endTime = "End time is required";
      }
      if (!pricingInformation.auction.colors || pricingInformation.auction.colors.length === 0) {
        newErrors.colors = "Please select at least one color for auction";
      }
      if (!hasVariants && pricingInformation.storeQuantity === "") {
        newErrors.storeQuantity = "Store quantity is required";
      }
    } else if (pricingInformation.listingType === "instantSale") {
      if (!hasVariants) {
        // Only validate base pricing if no variants exist
        if (pricingInformation.instantSale.price === "") {
          newErrors.price = "Product price is required";
        }
        if (pricingInformation.instantSale.salePrice === "") {
          newErrors.salePrice = "Sale price is required";
        }
        if (pricingInformation.storeQuantity === "") {
          newErrors.storeQuantity = "Store quantity is required";
        }
        if (
          pricingInformation.instantSale.salePrice >
          pricingInformation.instantSale.price
        ) {
          newErrors.salePrice =
            "Sale price must be less than or equal to product price";
        }
        if (!pricingInformation.instantSale.colors || pricingInformation.instantSale.colors.length === 0) {
          newErrors.colors = "Please select at least one color for instant sale";
        }
      } else {
        // Validate that variants have pricing
        const allOptions = productDetails.variants.flatMap((v: any) => v.options);
        const hasValidPricing = allOptions.some((o: any) => o.price > 0);
        if (!hasValidPricing) {
          newErrors.variants = "Please add pricing to your product variants";
        }
      }
    }

    setErrors(newErrors);

    // Always update product details to ensure context is in sync
    updateProductDetails("pricingInformation", pricingInformation);

    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  React.useEffect(() => {
    // Initialize from productDetails when component mounts or productDetails changes
    if (productDetails?.pricingInformation) {
      setPricingInformation({
        listingType: productDetails.pricingInformation.listingType || null,
        storeQuantity: productDetails.pricingInformation.storeQuantity || "",
        auction: {
          startPrice: productDetails.pricingInformation.auction?.startPrice || 0,
          reservePrice: productDetails.pricingInformation.auction?.reservePrice || "",
          buyNowPrice: productDetails.pricingInformation.auction?.buyNowPrice || "",
          startTime: productDetails.pricingInformation.auction?.startTime || "",
          endTime: productDetails.pricingInformation.auction?.endTime || "",
          colors: productDetails.pricingInformation.auction?.colors || [],
        },
        instantSale: {
          price: productDetails.pricingInformation.instantSale?.price || "",
          salePrice: productDetails.pricingInformation.instantSale?.salePrice || "",
          acceptOffer: productDetails.pricingInformation.instantSale?.acceptOffer || false,
          colors: productDetails.pricingInformation.instantSale?.colors || [],
        },
      });
      setListingType(productDetails.pricingInformation.listingType);
    }
  }, [productDetails]);

  // Clear instant sale colors when variants are added
  React.useEffect(() => {
    const hasVariants = productDetails.variants && productDetails.variants.length > 0;
    if (hasVariants && pricingInformation.instantSale.colors && pricingInformation.instantSale.colors.length > 0) {
      setPricingInformation(prev => ({
        ...prev,
        instantSale: {
          ...prev.instantSale,
          colors: []
        }
      }));
      updateProductDetails("pricingInformation", {
        ...pricingInformation,
        instantSale: {
          ...pricingInformation.instantSale,
          colors: []
        }
      });
    }
  }, [productDetails.variants]);

  React.useEffect(() => {
    const handleValidateEvent = () => {
      const isValid = validatePricingInformation();
      console.log("isValid", isValid);
      document.dispatchEvent(
        new CustomEvent("pricingValidated", { detail: { isValid } })
      );
    };

    document.addEventListener("validatePricing", handleValidateEvent);

    return () => {
      document.removeEventListener("validatePricing", handleValidateEvent);
    };
  }, [pricingInformation, updateProductDetails, productDetails]);

  const renderAuctionFields = () => {
    return (
      <div className="flex flex-col gap-y-4">
        <Input
          label="Start Bid Price"
          type="number"
          id="startPrice"
          placeholder="Enter start bid price"
          value={pricingInformation.auction.startPrice}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                startPrice: parseFloat(e.target.value),
              },
            });
            setErrors((prev) => ({
              ...prev,
              startPrice:
                parseFloat(e.target.value) <= 0
                  ? "Start price must be greater than 0"
                  : "",
            }));
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                startPrice: parseFloat(e.target.value),
              },
            });
          }}
          error={errors.startPrice}
          required={true}
          helperText="The minimum price to start bidding. Must be greater than 0."
        />
        <Input
          label="Reserve Price"
          type="number"
          id="reservePrice"
          placeholder="Enter reserve price"
          value={pricingInformation.auction.reservePrice}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                reservePrice: e.target.value,
              },
            })
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                reservePrice: e.target.value,
              },
            });
          }}
          error={errors.reservePrice}
          helperText="The minimum price you're willing to accept. The item won't sell if bidding doesn't reach this price."
        />
        <Input
          label="Buy Now Price"
          type="number"
          id="buyNowPrice"
          placeholder="Enter buy now price"
          value={pricingInformation.auction.buyNowPrice || ""}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                buyNowPrice: e.target.value,
              },
            })
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                buyNowPrice: e.target.value,
              },
            });
          }}
          error={errors.buyNowPrice}
          helperText="Optional. If set, buyer can skip bidding and buy immediately at this price."
        />
        <Input
          label="Start Time"
          type="datetime-local"
          id="startTime"
          placeholder="Select start time"
          value={pricingInformation.auction.startTime}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                startTime: e.target.value,
              },
            })
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                startTime: e.target.value,
              },
            });
          }}
          error={errors.startTime}
          required={true}
          helperText="The time when the auction starts. Must be in the future."
          min={new Date().toISOString().slice(0, 16)}
        />
        <Input
          label="End Time"
          type="datetime-local"
          id="endTime"
          placeholder="Select end time"
          value={pricingInformation.auction.endTime}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                endTime: e.target.value,
              },
            })
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              auction: {
                ...pricingInformation.auction,
                endTime: e.target.value,
              },
            });
          }}
          error={errors.endTime}
          required={true}
          helperText="The time when the auction ends. Must be after the start time."
        />
        <Input
          label="Store quantity"
          type="number"
          id="storeQuantity"
          placeholder="200"
          value={pricingInformation.storeQuantity}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              storeQuantity: e.target.value,
            })
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              storeQuantity : e.target.value,
            });
            setErrors((prev) => ({
              ...prev,
              storeQuantity: e.target.value === "" ? "Store quantity is required" : "",
            }));
          }}
          error={errors.storeQuantity}
          required={true}
        />
        
        {/* Color picker for auction items */}
        <div className="mt-4">
          <ColorPicker
            selectedColors={pricingInformation.auction?.colors || []}
            onChange={(colors) => {
              setPricingInformation({
                ...pricingInformation,
                auction: {
                  ...pricingInformation.auction,
                  colors
                }
              });
              updateProductDetails("pricingInformation", {
                ...pricingInformation,
                auction: {
                  ...pricingInformation.auction,
                  colors
                }
              });
            }}
          />
        </div>
        {errors.colors && (
          <div className="text-red-500 text-sm mt-1">{errors.colors}</div>
        )}
        
        {/* Show error for instant sale colors */}
        {pricingInformation.listingType === "instantSale" && errors.colors && (
          <div className="text-red-500 text-sm mt-1">{errors.colors}</div>
        )}
        
        {isMobileOrTablet && (
          <div className="mt-4">
            <NavigationButtons onNext={validatePricingInformation} onSaveDraft={props.onSaveDraft} />
          </div>
        )}
      </div>
    );
  };
  const renderInstantSaleFields = () => {
    const hasVariants = productDetails.variants && productDetails.variants.length > 0;
    
    if (hasVariants) {
      // Calculate price range and total quantity from variants
      const allOptions = productDetails.variants.flatMap((v: any) => v.options);
      const prices = allOptions.map((o: any) => o.salePrice || o.price).filter((p: any) => p > 0);
      const quantities = allOptions.map((o: any) => o.quantity);
      
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const totalQuantity = quantities.reduce((sum: number, qty: number) => sum + qty, 0);
      
      return (
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center gap-x-2">
            <span className="text-xs">Accept offer</span>
            <div
              className={`w-8 h-4 rounded-full flex items-center cursor-pointer transition-colors duration-200 ${
                pricingInformation.instantSale.acceptOffer
                  ? "bg-blue-600 justify-end"
                  : "bg-gray-300 justify-start"
              }`}
              onClick={() =>
                handleAcceptOfferChange(
                  !pricingInformation.instantSale.acceptOffer
                )
              }
            >
              <div className="w-3 h-3 bg-white rounded-full mx-0.5 transition-transform duration-200"></div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm  mb-2">Pricing Summary from Variants</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Price Range:</span>
                <span className="">
                  {minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Quantity:</span>
                <span className="">{totalQuantity}</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Pricing and inventory are managed through product variants. 
              {prices.length === 0 && "Please add variant options with prices."}
            </p>
          </div>
          {isMobileOrTablet && (
            <div className="mt-4">
              <NavigationButtons onNext={validatePricingInformation} onSaveDraft={props.onSaveDraft}/>
            </div>
          )}
        </div>
      );
    }
    
    // Fallback for products without variants (legacy support)
    return (
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center gap-x-2">
          <span className="text-xs">Accept offer</span>
          <div
            className={`w-8 h-4 rounded-full flex items-center cursor-pointer transition-colors duration-200 ${
              pricingInformation.instantSale.acceptOffer
                ? "bg-blue-600 justify-end"
                : "bg-gray-300 justify-start"
            }`}
            onClick={() =>
              handleAcceptOfferChange(
                !pricingInformation.instantSale.acceptOffer
              )
            }
          >
            <div className="w-3 h-3 bg-white rounded-full mx-0.5 transition-transform duration-200"></div>
          </div>
        </div>
        <Input
          label="Product Price"
          type="number"
          id="productPrice"
          placeholder="Enter product price"
          value={pricingInformation.instantSale.price}
          onChange={(e) => {
            const newPrice = parseFloat(e.target.value) || 0;
            setPricingInformation({
              ...pricingInformation,
              instantSale: {
                ...pricingInformation.instantSale,
                price: newPrice,
              },
            });
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              instantSale: {
                ...pricingInformation.instantSale,
                price: newPrice,
              },
            });
          }}
          required={true}
          helperText="The market price of the product."
        />
        <Input
          label="Sale Price"
          type="number"
          id="salePrice"
          placeholder="Enter sale price"
          value={pricingInformation.instantSale.salePrice}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              instantSale: {
                ...pricingInformation.instantSale,
                salePrice: parseFloat(e.target.value),
              },
            });
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              instantSale: {
                ...pricingInformation.instantSale,
                salePrice: parseFloat(e.target.value),
              },
            });
          }}
          error={errors.salePrice}
          required={true}
          helperText="The price at which you are willing to sell."
        />
        <Input
          label="Store quantity"
          type="number"
          id="storeQuantity"
          placeholder="200"
          value={pricingInformation.storeQuantity}
          onChange={(e) => {
            setPricingInformation({
              ...pricingInformation,
              storeQuantity: e.target.value,
            });
            updateProductDetails("pricingInformation", {
              ...pricingInformation,
              storeQuantity: e.target.value,
            });
          }}
          error={errors.storeQuantity}
          required={true}
          helperText="The number of items available for sale."
        />
        
        {/* Color picker for instant sale items without variants */}
        <div className="mb-2">
          <ColorPicker
            selectedColors={pricingInformation.instantSale?.colors || []}
            onChange={(colors) => {
              setPricingInformation({
                ...pricingInformation,
                instantSale: {
                  ...pricingInformation.instantSale,
                  colors
                }
              });
              updateProductDetails("pricingInformation", {
                ...pricingInformation,
                instantSale: {
                  ...pricingInformation.instantSale,
                  colors
                }
              });
            }}
          />
        </div>
        
        {isMobileOrTablet && (
          <div className="mt-4">
            <NavigationButtons onNext={validatePricingInformation} onSaveDraft={props.onSaveDraft}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 border border-gray-400 rounded-lg w-full">
      <h1 className="text-[16px] mb-4 xl:text-center">Pricing Information</h1>
      <Select
        label="Listing Type"
        options={["Auction", "Instant Sale"]}
        onChange={(value) => {
          console.log(value.toLocaleLowerCase());
          const type =
            value.toLowerCase() === "auction" ? "auction" : "instantSale";
          setPricingInformation({ ...pricingInformation, listingType: type });
          updateProductDetails("pricingInformation", {
            ...pricingInformation,
            listingType: type,
          });
          setListingType(type);
          setErrors((prev) => ({ ...prev, listingType: "" }));
        }}
        value={pricingInformation.listingType || ""}
        placeholder="Listing Type"
        error={errors.listingType}
        required={true}
        className="mb-4"
      />
      {pricingInformation.listingType === "auction" && renderAuctionFields()}
      {pricingInformation.listingType === "instantSale" && renderInstantSaleFields()}
    </div>
  );
};

export default PricingInformation;
