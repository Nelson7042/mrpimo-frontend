"use client";

import React, { useEffect } from "react";
import { ProductType } from "@/types/product.type";

/** Promo pricing configuration */
export interface PromoConfig {
  mode: "none" | "flat" | "percentage" | "per_variant";
  flatPrice?: number;
  percentageDiscount?: number;
  variantPrices?: Array<{ optionId: string; price: number }>;
}

interface PromoConfigSelectorProps {
  product: ProductType | null;
  promoConfig: PromoConfig;
  onChange: (config: PromoConfig) => void;
  existingPromoWarning?: string | null;
}

/**
 * Get all variant options from a product, flattened across all variants.
 */
function getVariantOptions(product: ProductType | null) {
  if (!product?.variants) return [];
  return product.variants.flatMap((v) =>
    v.options.map((o) => ({
      _id: o._id,
      value: o.value,
      price: o.price,
      salePrice: o.salePrice,
      variantName: v.name,
    }))
  );
}

/**
 * Get the effective price for a variant option (salePrice if set, otherwise price).
 */
function getEffectivePrice(option: { price: number; salePrice?: number }) {
  return option.salePrice && option.salePrice > 0
    ? option.salePrice
    : option.price;
}

/**
 * Calculate promo price for a single option based on the config mode.
 */
function calculatePromoPrice(
  option: { price: number; salePrice?: number; _id: string },
  config: PromoConfig
): number | null {
  const effectivePrice = getEffectivePrice(option);

  switch (config.mode) {
    case "flat":
      return config.flatPrice ?? null;
    case "percentage":
      if (!config.percentageDiscount) return null;
      return Math.round(effectivePrice * (1 - config.percentageDiscount / 100) * 100) / 100;
    case "per_variant": {
      const entry = config.variantPrices?.find((vp) => vp.optionId === option._id);
      return entry?.price ?? null;
    }
    default:
      return null;
  }
}

const PromoConfigSelector: React.FC<PromoConfigSelectorProps> = ({
  product,
  promoConfig,
  onChange,
  existingPromoWarning,
}) => {
  // Reset config when product changes
  useEffect(() => {
    onChange({ mode: "none" });
  }, [product?._id]);

  const variantOptions = getVariantOptions(product);

  const handleModeChange = (mode: PromoConfig["mode"]) => {
    if (mode === "none") {
      onChange({ mode: "none" });
    } else if (mode === "flat") {
      onChange({ mode: "flat", flatPrice: undefined });
    } else if (mode === "percentage") {
      onChange({ mode: "percentage", percentageDiscount: undefined });
    } else if (mode === "per_variant") {
      onChange({
        mode: "per_variant",
        variantPrices: variantOptions.map((o) => ({ optionId: o._id, price: 0 })),
      });
    }
  };

  const handleFlatPriceChange = (value: string) => {
    const num = value === "" ? undefined : Number(value);
    onChange({ ...promoConfig, flatPrice: num });
  };

  const handlePercentageChange = (value: string) => {
    const num = value === "" ? undefined : Math.min(99, Math.max(1, Number(value)));
    onChange({ ...promoConfig, percentageDiscount: num });
  };

  const handleVariantPriceChange = (optionId: string, value: string) => {
    const num = value === "" ? 0 : Number(value);
    const updatedPrices = (promoConfig.variantPrices || []).map((vp) =>
      vp.optionId === optionId ? { ...vp, price: num } : vp
    );
    onChange({ ...promoConfig, variantPrices: updatedPrices });
  };

  const modes: { value: PromoConfig["mode"]; label: string }[] = [
    { value: "none", label: "No Promo" },
    { value: "flat", label: "Flat Price" },
    { value: "percentage", label: "Percentage Discount" },
    { value: "per_variant", label: "Per-Variant Pricing" },
  ];

  return (
    <div className="flex flex-col gap-y-4">
      {/* Warning Banner */}
      {existingPromoWarning && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 flex items-start gap-2">
          <span className="text-yellow-600 text-sm font-medium">⚠</span>
          <p className="text-xs text-yellow-800">{existingPromoWarning}</p>
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex flex-col gap-y-2">
        <label className="font-medium text-xs">Promo Pricing Mode</label>
        <div className="flex flex-wrap gap-3">
          {modes.map((m) => (
            <label
              key={m.value}
              className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer text-xs transition-colors ${
                promoConfig.mode === m.value
                  ? "border-[#004aad] bg-blue-50 text-[#004aad]"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="promoMode"
                value={m.value}
                checked={promoConfig.mode === m.value}
                onChange={() => handleModeChange(m.value)}
                className="accent-[#004aad]"
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      {/* Conditional Inputs */}
      {promoConfig.mode === "flat" && (
        <div className="flex flex-col gap-y-2">
          <label className="font-medium text-xs">Flat Promo Price</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={promoConfig.flatPrice ?? ""}
            onChange={(e) => handleFlatPriceChange(e.target.value)}
            placeholder="Enter flat promo price for all variants"
            className="w-full border border-gray-300 rounded-md p-2 text-xs"
          />
          <p className="text-[10px] text-gray-500">
            This price will apply to all variant options.
          </p>
        </div>
      )}

      {promoConfig.mode === "percentage" && (
        <div className="flex flex-col gap-y-2">
          <label className="font-medium text-xs">Percentage Discount</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              step="1"
              value={promoConfig.percentageDiscount ?? ""}
              onChange={(e) => handlePercentageChange(e.target.value)}
              placeholder="1-99"
              className="w-24 border border-gray-300 rounded-md p-2 text-xs"
            />
            <span className="text-xs text-gray-600 font-medium">%</span>
          </div>
          <p className="text-[10px] text-gray-500">
            Enter a discount percentage between 1 and 99.
          </p>
        </div>
      )}

      {promoConfig.mode === "per_variant" && variantOptions.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <label className="font-medium text-xs">Per-Variant Promo Prices</label>
          <div className="space-y-2">
            {variantOptions.map((option) => {
              const effectivePrice = getEffectivePrice(option);
              const currentEntry = promoConfig.variantPrices?.find(
                (vp) => vp.optionId === option._id
              );
              return (
                <div
                  key={option._id}
                  className="flex items-center gap-3 bg-gray-50 rounded-md p-2"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium">{option.value}</p>
                    <p className="text-[10px] text-gray-500">
                      Current: ₦{effectivePrice.toLocaleString()}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={currentEntry?.price || ""}
                    onChange={(e) =>
                      handleVariantPriceChange(option._id, e.target.value)
                    }
                    placeholder="Promo price"
                    className="w-32 border border-gray-300 rounded-md p-2 text-xs"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview Table */}
      {promoConfig.mode !== "none" && variantOptions.length > 0 && (
        <div className="flex flex-col gap-y-2">
          <label className="font-medium text-xs">Price Preview</label>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#e2e8f0]">
                <tr>
                  <th className="p-2 text-left">Option</th>
                  <th className="p-2 text-right">Current Price</th>
                  <th className="p-2 text-right">Promo Price</th>
                  <th className="p-2 text-right">Savings</th>
                </tr>
              </thead>
              <tbody>
                {variantOptions.map((option) => {
                  const effectivePrice = getEffectivePrice(option);
                  const promoPrice = calculatePromoPrice(option, promoConfig);
                  const savings =
                    promoPrice !== null ? effectivePrice - promoPrice : null;
                  const isValid = promoPrice !== null && promoPrice < effectivePrice && promoPrice > 0;

                  return (
                    <tr
                      key={option._id}
                      className="border-t border-gray-100"
                    >
                      <td className="p-2">
                        <span className="font-medium">{option.value}</span>
                        <span className="text-[10px] text-gray-400 ml-1">
                          ({option.variantName})
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        ₦{effectivePrice.toLocaleString()}
                      </td>
                      <td
                        className={`p-2 text-right font-medium ${
                          promoPrice === null
                            ? "text-gray-400"
                            : isValid
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {promoPrice !== null
                          ? `₦${promoPrice.toLocaleString()}`
                          : "—"}
                      </td>
                      <td
                        className={`p-2 text-right ${
                          savings !== null && savings > 0
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {savings !== null && savings > 0
                          ? `₦${savings.toLocaleString()} (${Math.round(
                              (savings / effectivePrice) * 100
                            )}%)`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No product selected message */}
      {promoConfig.mode !== "none" && variantOptions.length === 0 && (
        <p className="text-xs text-gray-500 italic">
          Select a product to configure promo pricing.
        </p>
      )}
    </div>
  );
};

export default PromoConfigSelector;
