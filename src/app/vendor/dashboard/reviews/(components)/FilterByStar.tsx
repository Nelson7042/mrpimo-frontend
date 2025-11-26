import { Star } from "lucide-react";

type Props = {
  onFilterChange: (starRating: number | null) => void;
  selectedStar?: number | null;
};

const FilterByStar = ({ onFilterChange, selectedStar }: Props) => {
  const starRatings = [5, 4, 3, 2, 1];

  const handleStarClick = (star: number) => {
    // Toggle off if already selected
    if (selectedStar === star) {
      onFilterChange(null);
    } else {
      onFilterChange(star);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {starRatings.map((star) => (
        <button
          key={star}
          onClick={() => handleStarClick(star)}
          className={`flex items-center gap-1 px-3 py-1 rounded-md border transition-all duration-200
            ${selectedStar === star
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"}`}
        >
          <Star
            className={`w-4 h-4 ${
              selectedStar === star ? "text-white" : "text-yellow-400"
            }`}
            fill={selectedStar === star ? "currentColor" : "none"}
          />
          <span className="text-sm font-medium">{star}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterByStar;