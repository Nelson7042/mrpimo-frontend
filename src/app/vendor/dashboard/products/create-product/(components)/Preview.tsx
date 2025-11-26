import React from "react";
import { ArrowLeft, Heart, Star } from "lucide-react";
import Image from "next/image";
import { useProductListing } from "@/contexts/ProductLisitngContext";
import { useUserStore } from "@/stores/useUserStore";
import CategoryInfo from "./CategoryInfo";
import { useVendorStore } from "@/stores/useVendorStore";

type Props = {
  onHide: () => void;
};

const previewData = {
  product: {
    name: "Samsung 98 inch Crystal UHD DU9000 4k Tizen OS Smart TV 2424 - Black, 98",
    description:
      "Samsung 98 inch Crystal Smart TV delivers stunning, vibrant visuals with smart connectivity, providing an immersive home entertainment experience for you and your family.",
    seller: {
      name: "Mr Johnson Ebuka",
      category: "TV",
      quantity_left: 12,
      total_offers: 17,
      price: "₦1,700,000",
      sale_method: "Auction",
      business_kind: "Wholesale",
      colors_available: ["red", "blue", "black", "white"],
    },
    specifications: {
      key_features: {
        display: "Crystal UHD Display: Enjoy lifelike colours",
        picture_enhancer:
          "Supersize Picture Enhancer: Optimize picture quality",
        motion_accelerator: "Motion Xcelerator: Smooth motion",
        sound_enhancement: "Q-Symphony: Sound enhancement",
        operating_system: "Samsung Tizen OS: Access to Applications",
      },
      display_and_audio: {
        screen_size: "98 inches",
        resolution: "4K Ultra HD (3840 × 2160)",
        refresh_rate: "124Hz (Motion Xcelerator)",
        sound_output: "24W (2 Channel)",
        adaptive_sound: true,
      },
      smart_features: {
        smart_things_compatible: "SmartThings Compatible: Smart device control",
        voice_assistant: "Built-in Voice Assistant: Voice command",
        multi_view: "Multi-View: Two video watch",
        apple_airplay: "Apple Airplay: Good for streaming",
        adaptive_sound: true,
      },
    },
    images: [
      "/images/smart-watch.png",
      "/images/smart-watch.png",
      "/images/smart-watch.png",
      "/images/smart-watch.png",
      "/images/smart-watch.png",
      "/images/smart-watch.png",
    ],
    brand: "samsung",
  },
};

type ImageProps = {
  containerStyle: string;
  height: number;
  width: number;
  imageStyle: string;
  imageSrc: string;
};

const ImageComp = ({
  containerStyle,
  height,
  width,
  imageStyle,
  imageSrc,
}: ImageProps) => {
  return (
    <div className={containerStyle}>
      <Image
        src={imageSrc}
        alt="product image"
        width={width}
        height={height}
        style={{ width: 'auto', height: 'auto' }}
        className={imageStyle}
      />
    </div>
  );
};

const StarRating = ({ rating }: { rating: number }) => {
  // Calculate the decimal part for the partially filled star
  const decimalPart = rating % 1;

  return (
    <div className="flex items-center gap-1 mb-2">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, index) => {
          // Fully filled stars
          if (index < Math.floor(rating)) {
            return (
              <Star
                key={index}
                size={24}
                className="fill-yellow-400 text-yellow-400"
              />
            );
          }
          // Partially filled star (for the decimal part)
          else if (index === Math.floor(rating) && decimalPart > 0) {
            return (
              <div key={index} className="relative">
                <Star size={24} className="text-gray-300" />
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${decimalPart * 100}%` }}
                >
                  <Star size={24} className="fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            );
          }
          // Empty stars
          else {
            return <Star key={index} size={24} className="text-gray-300" />;
          }
        })}
      </div>
      <span className="text-xs ml-1 text-gray-600">
        {rating.toFixed(1)} Seller Star Rating
      </span>
    </div>
  );
};

export const ProductInfo = ({
  title,
  value,
  colour,
}: {
  title: string;
  value?: string | number;
  colour?: string
}) => {
  return (
    <div className="flex gap-x-2">
      <p>{title}:</p>
      {value && <p className="primary">{value}</p>}
      {colour && (<div className="border border-gray-300 size-4" style={{ backgroundColor: colour }} />)}
    </div>
  );
};

const Button = ({
  backgroundColor,
  text,
  borderColor,
  textColor,
}: {
  backgroundColor: string;
  text: string;
  borderColor: string;
  textColor: string;
}) => {
  return (
    <button
      className={`px-4 py-2 rounded-sm text-xs ${backgroundColor} border-${borderColor}-500 text-${textColor}-500 text-${textColor} w-full`}
    >
      {text}
    </button>
  );
};

const Preview = (props: Props) => {
  const [activeTab, setActiveTab] = React.useState("Specifications");

  const { productDetails } = useProductListing();
  const { vendor } = useVendorStore();

  return (
    <div className="bg-white rounded-xl pb-4">
      <div className="p-4 flex justify-between items-center border-b border-gray-300">
        <div className="flex gap-x-2 items-center text-gray-500">
          <ArrowLeft
            size={16}
            className="cursor-pointer hover:text-red-800"
            onClick={props.onHide}
          />
          <p className="text-sm">Preview product</p>
        </div>
      </div>
      {/* Preview */}
      <div className="px-2 py-0.5 pb-4 flex flex-col w-full gap-y-0.25">
        <div className="grid grid-cols-2 lg:gap-x-10 xl:gap-15 border border-gray-300 p-4 pb-15 gap-y-5 ">
          <div className="col-span-2 lg:col-span-1 ">
            <div className="flex-col">
              {productDetails.images && productDetails.images.length > 0 && (
                <ImageComp
                  containerStyle="h-auto w-full bg-white border border-gray-100 p-2 flex items-center justify-center shadow-md"
                  height={300}
                  width={300}
                  imageStyle="object-contain w-full h-auto max-h-[300px]"
                  imageSrc={productDetails.images[0]}
                />
              )}
              <div className="flex flex-wrap mt-1"></div>
              <div className="flex flex-wrap mt-1 gap-2">
                {productDetails.images &&
                  productDetails.images.length > 0 &&
                  productDetails.images.map((image: string, index: number) => (
                    <div key={index}>
                      {index > 0 && (
                        <ImageComp
                          containerStyle="h-auto w-24 bg-white border border-gray-300 p-2 flex items-center justify-center"
                          height={60}
                          width={60}
                          imageStyle="object-contain w-full h-auto max-h-[80px]"
                          imageSrc={image}
                          key={index}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <StarRating rating={4.5} />
            <div className="mt-5">
              <h1 className="text-xl font-semibold">
                {productDetails?.productName}
              </h1>
              <p className="text-xs font-light mt-4">
                {productDetails?.description}
              </p>
              <div className="flex flex-col gap-y-4 mt-4">
                <div className="flex text-xs justify-between items-center">
                  <ProductInfo
                    title={"Seller"}
                    value={vendor?.businessInfo?.name || "Not specified"}
                  />
                  <ProductInfo
                    title={"Brand"}
                    value={productDetails?.brandName || "Not specified"}
                  />
                </div>
                <div className="flex text-xs justify-between items-center">
                  <ProductInfo
                    title={"Color"}
                    colour={productDetails?.color || ""}
                  />
                  <ProductInfo
                    title={"Condition"}
                    value={productDetails?.condition || "Not specified"}
                  />
                </div>
                <div className="flex text-xs justify-between items-center">
                  <CategoryInfo subCategory={productDetails?.subCategory5 || productDetails?.subCategory4 || productDetails?.subCategory3 || productDetails?.subCategory2 || productDetails?.subCategory} />
                </div>
                <div className="flex text-xs justify-between items-center">
                  {productDetails?.pricingInformation?.instantSale && (
                    <div className="flex flex-col">
                      {productDetails.pricingInformation.instantSale.salePrice > 0 ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-2xl text-primary">
                              ₦{productDetails.pricingInformation.instantSale.salePrice}
                            </p>
                            <p className="text-lg line-through text-gray-500">
                              ₦{productDetails.pricingInformation.instantSale.price}
                            </p>
                            {productDetails.pricingInformation.instantSale.price > 0 && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                {Math.round((1 - productDetails.pricingInformation.instantSale.salePrice / 
                                  productDetails.pricingInformation.instantSale.price) * 100)}% OFF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">Sale price</p>
                        </>
                      ) : productDetails.pricingInformation.instantSale.price > 0 && (
                        <>
                          <p className="text-2xl">
                            ₦{productDetails.pricingInformation.instantSale.price}
                          </p>
                          <p className="text-xs text-gray-500">Buy now</p>
                        </>
                      )}
                    </div>
                  )}
                  {productDetails?.pricingInformation?.auction?.startPrice > 0 && (
                    <div className="flex flex-col">
                      <p className="text-2xl">
                        ₦{productDetails.pricingInformation.auction.startPrice}
                      </p>
                      <p className="text-xs text-gray-500">Starting bid</p>
                    </div>
                  )}
                  <div className="bg-orange-50 flex justify-center items-center px-2 py-1 rounded-lg">
                    <Heart size={28} className="text-orange-400" />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 md:col-span-3">
                      <button
                        className={`px-4 py-2 rounded-sm text-xs border border-[#F6B76F] text-[#F6B76F] w-full`}
                      >
                        Message
                      </button>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <Button
                        backgroundColor="bg-primary"
                        text="Buy Now"
                        textColor="white"
                        borderColor=""
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <Button
                        backgroundColor="bg-secondary"
                        text="Add To Cart"
                        textColor="black"
                        borderColor=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border border-gray-300 mt-0.5">
          <div className="flex justify-center items-center gap-x-2 border-b border-gray-300 py-2 text-sm text-gray-400">
            <button
              onClick={() => setActiveTab("Description")}
              className={`px-2 py-1 ${
                activeTab === "Description"
                  ? "border-b-2 border-[#F6B76F] text-[#211F1F]"
                  : ""
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("Specifications")}
              className={`px-2 py-1 ${
                activeTab === "Specifications"
                  ? "border-b-2 border-[#F6B76F] text-[#211F1F]"
                  : ""
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab("Additional Information")}
              className={`px-2 py-1 ${
                activeTab === "Additional Information"
                  ? "border-b-2 border-[#F6B76F] text-[#211F1F]"
                  : ""
              }`}
            >
              Additional Information
            </button>
          </div>
          <div className="grid grid-cols-12 mt-4 p-4 gap-2">
            {activeTab === "Description" && (
              <div className="col-span-12 p-2">
                <p className="text-sm whitespace-pre-line">
                  {productDetails?.description}
                </p>
                {productDetails?.conditionDescription && (
                  <>
                    <h4 className="text-sm font-semibold mt-4">
                      Condition Description
                    </h4>
                    <p className="text-sm whitespace-pre-line">
                      {productDetails.conditionDescription}
                    </p>
                  </>
                )}
              </div>
            )}

            {activeTab === "Specifications" && (
              <>
                <div className="col-span-12 md:col-span-6 lg:col-span-4 p-2 md:[&:not(:nth-child(2n))]:border-r lg:[&:not(:nth-child(3n))]:border-r border-gray-200">
                  <h4 className="text-sm font-semibold">
                    Product Specifications
                  </h4>
                  <>
                    {productDetails?.productSpecifications &&
                      Object.entries(productDetails.productSpecifications).map(
                        ([key, value], index) => (
                          <div key={index} className="flex gap-x-2 mt-2">
                            <p className="text-xs text-gray-500">
                              <span className="text-gray-800 font-semibold">
                                {key}:
                              </span>{" "}
                              <span className="text-[10px] ml-2">
                                {String(value)}
                              </span>
                            </p>
                          </div>
                        )
                      )}
                    {(!productDetails?.productSpecifications ||
                      Object.keys(productDetails.productSpecifications)
                        .length === 0) && (
                      <p className="text-xs text-gray-500 mt-2">
                        No specifications added
                      </p>
                    )}
                  </>
                </div>
                <div className="col-span-12 md:col-span-6 lg:col-span-4 p-2 md:[&:not(:nth-child(2n))]:border-r lg:[&:not(:nth-child(3n))]:border-r border-gray-200">
                  <h4 className="text-sm font-semibold">
                    Additional Specifications
                  </h4>
                  <>
                    {productDetails?.additionalSpecifications &&
                      Object.entries(
                        productDetails.additionalSpecifications
                      ).map(([key, value], index) => (
                        <div key={index} className="flex gap-x-2 mt-2">
                          <p className="text-xs text-gray-500">
                            <span className="text-gray-800 font-semibold ">
                              {key}:
                            </span>{" "}
                            <span className="text-[10px] ml-2">
                              {String(value)}
                            </span>
                          </p>
                        </div>
                      ))}
                    {(!productDetails?.additionalSpecifications ||
                      Object.keys(productDetails.additionalSpecifications)
                        .length === 0) && (
                      <p className="text-xs text-gray-500 mt-2">
                        No additional specifications added
                      </p>
                    )}
                  </>
                </div>
                <div className="col-span-12 md:col-span-6 lg:col-span-4 p-2">
                  <h4 className="text-sm font-semibold">Variants</h4>
                  <>
                    {productDetails?.variants &&
                    productDetails.variants.length > 0 ? (
                      productDetails.variants.map(
                        (variant: any, index: number) => (
                          <div key={index} className="mt-2">
                            <p className="text-xs font-semibold">
                              {variant.name}
                            </p>
                            <div className="ml-2">
                              {variant.options.map(
                                (option: any, optIndex: number) => (
                                  <div
                                    key={optIndex}
                                    className="text-[10px] text-gray-500 mt-1"
                                  >
                                    {option.value}: ₦{option.price} (Stock:{" "}
                                    {option.inventory})
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        No variants specified
                      </p>
                    )}
                  </>
                </div>
              </>
            )}

            {activeTab === "Additional Information" && (
              <div className="col-span-12 p-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold">Shipping Details</h4>
                    {productDetails?.shippingDetails ? (
                      <div className="mt-2">
                        {Object.entries(productDetails.shippingDetails).map(
                          ([key, value], index) => (
                            <div key={index} className="flex gap-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                <span className="text-gray-800 font-semibold">
                                  {key}:
                                </span>{" "}
                                <span className="text-[10px] ml-2">
                                  {typeof value === "object" &&
                                  value !== null ? (
                                    <div className="ml-2">
                                      {Object.entries(value).map(
                                        ([subKey, subValue], subIndex) =>
                                          subValue !== null &&
                                          subValue !== undefined &&
                                          subValue !== "" && (
                                            <div
                                              key={subIndex}
                                              className="text-[10px] text-gray-500"
                                            >
                                              {subKey}: {String(subValue)}
                                            </div>
                                          )
                                      )}
                                    </div>
                                  ) : (
                                    String(value)
                                  )}
                                </span>
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        No shipping details added
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">SEO Information</h4>
                    {productDetails?.seoSettings ? (
                      <div className="mt-2">
                        {Object.entries(productDetails.seoSettings).map(
                          ([key, value], index) => (
                            <div key={index} className="flex gap-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                <span className="text-gray-800 font-semibold">
                                  {key}:
                                </span>{" "}
                                <span className="text-[10px] ml-2">
                                  {String(value)}
                                </span>
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        No SEO information added
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-center md:text-end w-full">
        <button
          className="w-1/2 border border-secondary p-1 text-sm text-[#F6B76F] mx-2 hover:cursor-pointer hover:text-gray-50 hover:bg-[#F6B76F] "
          onClick={props.onHide}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default Preview;
