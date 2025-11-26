export type WishlistItem = {
  _id: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
    variants: Array<{
      options: Array<{
        price: number;
        salePrice?: number;
      }>;
    }>;
  };
  priceWhenAdded: number;
  addedAt: string;
}

export interface WishlistResponse {
  success: boolean;
  data: Wishlist[];
}

export interface Wishlist  {
  productId : string,
    _id?: string;

  name: string,
  images: string[],
  price: number,
  variantId: string,
  addedAt: string
    priceWhenAdded?: number;

            
        }
