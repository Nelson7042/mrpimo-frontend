import { PopulatedCategory, ProductType } from "@/types/product.type";
import React, { useState } from "react";

interface Props {
  products: ProductType[];
  onSelect: (product: ProductType) => void;
}

const ProductSelector: React.FC<Props> = ({ products, onSelect }) => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = products?.filter((p) =>
    p?.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheckbox = (productId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  function getCategoryName(product: ProductType): string {
    const sub = product.category?.sub;

    if (
      Array.isArray(sub) &&
      sub.length > 0 &&
      typeof sub[0] !== "string" &&
      typeof sub[0] === "object" &&
      "name" in sub[0]
    ) {
      return (sub[0] as PopulatedCategory).name;
    }

    const main = product.category?.main;

    if (typeof main === "object" && "name" in main) {
      return (main as PopulatedCategory).name;
    }

    return typeof main === "string" ? main : "Unknown";
  }

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="relative">
      <div className="absolute top-1 right-0 z-30 bg-white p-2 rounded-md">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
        />

        <table className="w-full">
          <thead className="bg-[#e2e8f0] text-sm">
            <tr>
              <th className="p-2 w-12">SN</th>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product, index) => {
              const isChecked = checkedItems[product?._id!] || false;
              return (
                <tr
                  key={product._id}
                  className={`cursor-pointer transition hover:bg-gray-50 ${
                    selectedId === product._id ? "bg-gray-100" : ""
                  }`}
                  onClick={() => {
                    toggleCheckbox(product?._id!);
                    setSelectedId(product?._id!);
                    onSelect(product);
                  }}
                >
                  <td
                    className=" p-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheckbox(product?._id!)}
                      className="cursor-pointer"
                    />
                  </td>

                  <td className=" p-2">{product.name || 'N/A'}</td>
                  <td className=" p-2">{getCategoryName(product)}</td>
                  <td className=" p-2 font-medium">
                    {(() => {
                      if (product.inventory?.listing?.type === "auction") {
                        return product.inventory.listing.auction?.startBidPrice 
                          ? `${product.inventory.listing.auction.startBidPrice}` 
                          : 'N/A';
                      }
                      // For instant products, show variant prices
                      const hasVariants = product.variants && product.variants.length > 0;
                      if (hasVariants) {
                        const allOptions = product.variants.flatMap((v: any) => v.options) || [];
                        const prices = allOptions
                          .map((o: any) => (o.salePrice && o.salePrice > 0) ? o.salePrice : o.price)
                          .filter((p: any) => p > 0);
                        if (prices.length === 0) return 'N/A';
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max ? `${min}` : `${min} - ${max}`;
                      }
                      return product.inventory?.listing?.instant?.price?.toLocaleString() || 'N/A';
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">{page}</span>
          <button
            disabled={page * pageSize >= filtered.length}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSelector;
