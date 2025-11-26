import { useProductListing } from "@/contexts/ProductLisitngContext";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Edit, Trash2, Upload, Save } from "lucide-react";
import {
  toastConfigSuccess,
  toastConfigError,
} from "@/app/config/toast.config";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type DraftType = {
  draftId: string;
  _id?: string;
  productDetails: any;
  step: number;
  lastUpdated: string;
  title?: string;
  completionPercentage?: number;
};

type Props = {
  onEditDraft?: (draft: DraftType) => void;
};

const Drafts = ({ onEditDraft }: Props) => {
  const [drafts, setDrafts] = useState<DraftType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Function to fetch drafts from API
  const fetchDraftsFromApi = async () => {
    const response = await fetchWithAuth(
      "http://localhost:5800/api/v1/products/drafts",
      { method: "GET" }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch drafts from server");
    }

    const responseData = await response.json();
    return Array.isArray(responseData)
      ? responseData
      : responseData.drafts || responseData.data || [];
  };

  // Function to merge local and API drafts
  const mergeDrafts = (dbDrafts: any[]) => {
    const localDrafts = localStorage.getItem("productDrafts");
    const localDraftsList = localDrafts ? JSON.parse(localDrafts) : [];

    const draftMap = new Map();

    // Process DB drafts first
    dbDrafts.forEach((draft: any) => {
      if (!draft) return;

      const draftWithId = {
        ...draft,
        draftId: draft.draftId || draft._id,
      };

      const productName = draft.productDetails?.productName || "";
      if (productName) {
        draftMap.set(productName, draftWithId);
      } else {
        draftMap.set(draft.draftId || draft._id, draftWithId);
      }
    });

    // Then process local drafts
    localDraftsList.forEach((localDraft: DraftType) => {
      if (!localDraft) return;

      const productName = localDraft.productDetails?.productName || "";
      const draftKey = productName || localDraft.draftId;

      if (
        !draftMap.has(draftKey) ||
        (draftMap.get(draftKey)?.lastUpdated &&
          new Date(localDraft.lastUpdated).getTime() >
            new Date(draftMap.get(draftKey).lastUpdated).getTime())
      ) {
        draftMap.set(draftKey, localDraft);
      }
    });

    // Convert map back to array
    return Array.from(draftMap.values());
  };

  // TanStack Query for fetching drafts
  const {
    data: mergedDrafts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["drafts"],
    queryFn: async () => {
      try {
        const dbDrafts = await fetchDraftsFromApi();
        const merged = mergeDrafts(dbDrafts);

        // Update localStorage with merged drafts
        localStorage.setItem("productDrafts", JSON.stringify(merged));
        return merged;
      } catch (error) {
        console.error("Error fetching drafts:", error);
        // Fallback to local drafts
        const localDrafts = localStorage.getItem("productDrafts");
        return localDrafts ? JSON.parse(localDrafts) : [];
      }
    },
    staleTime: 60000, // 1 minute
  });

  // Set drafts state from query data
  useEffect(() => {
    if (mergedDrafts) {
      setDrafts(mergedDrafts);
    }
  }, [mergedDrafts]);

  // TanStack Mutation for deleting drafts
  const { mutate: deleteDraft } = useMutation({
    mutationFn: async (id: string) => {
      try {
        // Try to delete from server regardless of ID format
        const response = await fetchWithAuth(
          `http://localhost:5800/api/v1/products/drafts/${id}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          console.error(
            "Server deletion failed, removing from local storage only"
          );
        }
      } catch (error) {
        console.error("Error during deletion:", error);
        // Continue with local deletion even if server deletion fails
      }
      return id;
    },
    onMutate: (id) => {
      // Optimistic update
      const updatedDrafts = drafts.filter((draft) => draft.draftId !== id);
      localStorage.setItem("productDrafts", JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      toast.success("Draft deleted successfully", toastConfigSuccess);
    },
    onError: (error) => {
      console.error("Error deleting draft:", error);
      toast.error("Failed to delete draft", toastConfigError);
      // Refetch to restore correct state
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });

  const handleDeleteDraft = (id: string) => {
    deleteDraft(id);
  };

  // TanStack Mutation for saving all drafts
  const { mutate: saveAllDrafts } = useMutation({
    mutationFn: async () => {
      const localDrafts = localStorage.getItem("productDrafts");
      if (!localDrafts) {
        throw new Error("No drafts to save");
      }

      const draftsToSave = JSON.parse(localDrafts);
      let successCount = 0;

      // Process each draft individually
      for (const draft of draftsToSave) {
        try {
          // Skip drafts that are already in the database (have MongoDB ObjectId)
          if (draft.draftId && draft.draftId.match(/^[0-9a-fA-F]{24}$/)) {
            successCount++;
            continue;
          }

          // Create a new draft in the database
          const response = await fetchWithAuth(
            "http://localhost:5800/api/v1/products/draft",
            {
              method: "POST",
              body: JSON.stringify(draft),
            }
          );

          if (response.ok) {
            successCount++;
          }
        } catch (err) {
          console.error("Error saving draft:", err);
        }
      }

      return successCount;
    },
    onSuccess: (successCount) => {
      toast.success(
        `Saved ${successCount} drafts to your account`,
        toastConfigSuccess
      );
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
    onError: (error) => {
      console.error("Error saving drafts:", error);
      toast.error("Failed to save drafts", toastConfigError);
    },
  });

  const handlePublishDraft = (draft: DraftType) => {
    // Implement publish functionality
    toast.info("Publishing draft... This feature is coming soon.");
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Your Draft Products</h2>
        <button
          onClick={() => {
            // Use TanStack Query's mutation to save all drafts
            saveAllDrafts();
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-md text-sm"
        >
          <Save size={16} />
          <span>Save All</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading drafts...</p>
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-red-500">
            Error loading drafts. Using local drafts only.
          </p>
        </div>
      ) : drafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drafts.map((draft) => (
            <div
              key={draft.draftId}
              className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow ease-in-out"
            >
              {/* Product image */}
              <div className="h-60 bg-gray-100 flex items-center justify-center relative p-2">
                {draft.productDetails?.images &&
                draft.productDetails?.images?.length > 0 ? (
                  <img
                    src={draft.productDetails.images[0]}
                    alt={draft.title || "Draft product"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}

                {/* Completion badge */}
                <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-medium shadow-sm">
                  {(() => {
                    // Calculate completion based on filled fields
                    const requiredFields = [
                      "productName",
                      "description",
                      "brandName",
                      "category",
                      "images",
                      "productSpecifications",
                      "pricingInformation",
                    ];
                    const filledFields = requiredFields.filter(
                      (field) =>
                        draft.productDetails &&
                        draft.productDetails[field] &&
                        (Array.isArray(draft.productDetails[field])
                          ? draft.productDetails[field].length > 0
                          : Object.keys(draft.productDetails[field]).length > 0)
                    );
                    const completionPercent = Math.round(
                      (filledFields.length / requiredFields.length) * 100
                    );
                    return `${completionPercent}% complete`;
                  })()}
                </div>
              </div>

              {/* Product info */}
              <div className="p-3">
                <h3 className="font-medium truncate">
                  {draft.productDetails?.productName ||
                    draft.title ||
                    "Untitled Product"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated:{" "}
                  {new Date(draft.lastUpdated).toLocaleDateString()}
                </p>

                {/* Action buttons */}
                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => {
                      onEditDraft && onEditDraft(draft);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full cursor-pointer"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handlePublishDraft(draft)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full cursor-pointer"
                    title="Publish"
                  >
                    <Upload size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setSelectedDraftId(draft.draftId);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
          <p>You don't have any draft products yet.</p>
          <p className="mt-2 text-sm">
            Start creating a product and save it as a draft to see it here.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-md font-medium mb-4 border-b border-gray-200">
              Delete Draft
            </h3>
            <p className="text-gray-600 mb-6 text-xs ">
              Are you sure you want to delete this draft? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3 text-sm">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-secondary transition transform hover:scale-110 rounded-md text-tertiary cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedDraftId) {
                    handleDeleteDraft(selectedDraftId);
                    setIsModalOpen(false);
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-md cursor-pointer transition transform hover:scale-110"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drafts;
