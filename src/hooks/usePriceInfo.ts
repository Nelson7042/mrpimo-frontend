import { useState, useEffect } from 'react';
import { ProductType, VariantType } from '@/types/product.type';

interface PriceInfo {
  unitPrice: number;
  totalPrice: number;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
}

export const usePriceInfo = (
  productData: ProductType,
  selectedOptions: { [variantId: string]: string },
  quantity: number
) => {
  const [priceInfo, setPriceInfo] = useState<PriceInfo>({
    unitPrice: 0,
    totalPrice: 0,
    currency: 'USD',
    currencySymbol: '$',
    exchangeRate: 1,
  });

  useEffect(() => {
    if (!productData?.variants?.[0]) return;

    const variant = productData.variants[0];
    const optionId = selectedOptions[variant._id || variant.id];
    const option = variant.options?.find(
      (opt: any) => (opt.id || opt._id) === optionId && opt.value
    );

    if (option) {
      const basePrice = option.salePrice || option.price || 0;
      const exchangeRate = (productData as any)?.priceInfo?.exchangeRate || 1;
      const unitPrice = basePrice * exchangeRate;
      const totalPrice = unitPrice * quantity;
      const currencySymbol = (productData as any)?.priceInfo?.currencySymbol || '$';
      const currency = (productData as any)?.priceInfo?.currency || 'USD';

      setPriceInfo({
        unitPrice,
        totalPrice,
        currency,
        currencySymbol,
        exchangeRate,
      });
    }
  }, [productData, selectedOptions, quantity]);

  return priceInfo;
};