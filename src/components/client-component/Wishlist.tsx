import { useWishlist } from "@/hooks/useWishlist";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { useUserStore } from "@/stores/useUserStore";
import { useWishlistStore } from "@/stores/useWishlistStore";
import { ProductType } from "@/types/product.type";
import { User } from "@/types/user.type";
import { Heart } from "lucide-react";
import React from "react";

interface WishlistCompnent {
  productData: ProductType;
  price: number;
}

const Wishlist = ({ productData, price }: WishlistCompnent) => {
  const { openModal } = useAuthModalStore();
  const { user } = useUserStore();

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isAddingToWishlist,
  } = useWishlist();

  const { items } = useWishlistStore();

  return (
    <button
      onClick={() => {
        if (!user) {
          openModal();
          return;
        }

        if (isInWishlist(productData?._id!)) {
          removeFromWishlist(productData?._id!);
        } else {
          addToWishlist({ productId: productData?._id!, price });
        }
      }}
      disabled={isAddingToWishlist}
      className={`p-1 rounded-sm transition-colors disabled:opacity-50 cursor-pointer ${
        isInWishlist(productData?._id!)
          ? "hover:bg-red-100 bg-red-50"
          : "hover:bg-gray-100 bg-gray-50"
      }`}
      aria-label="Add to wishlist"
    >
      <Heart
        size={24}
        className={`${
          isInWishlist(productData?._id!) ? "text-red-400" : "text-gray-300"
        } transition-colors`}
      />
    </button>
  );
};

export default Wishlist;
