import React from "react";
import { ClipLoader } from "react-spinners";

interface FullButtonProps {
  action: () => void;
  name?: string;
  color?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
}

const FullButton = ({
  action,
  name,
  color = "blue",
  disabled = false,
  type,
  isLoading = false,
}: FullButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={action}
      className={`w-full flex items-center justify-center py-2 md:py-3 text-sm text-center px-4 ${
        color === "blue" ? "bg-primary" : "bg-[#F6B76F]"
      }  text-white rounded-md`}
    >
      {name}
      {isLoading && (
        <ClipLoader
          color="#ffffff"
          size={18}
          aria-label="Loading Spinner"
          data-testid="loader"
          className="inline-block ml-2"
        />
      )}
    </button>
  );
};

export default FullButton;
