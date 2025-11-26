"use client"

import { useProductListing } from "@/contexts/ProductLisitngContext";
import { FaArrowLeft } from "react-icons/fa";

type Props = {};

const Navigator = (props: Props) => {
  const { step, setStep } = useProductListing();

  const handleBack = () => {

    if (step > 1) {
      setStep(step - 1)
    }
  };

  return (
    <div>
      <button
        className="cursor-pointer"
        onClick={handleBack}
        disabled={step === 1}
      >
        <div className={`bg-white rounded-full size-10 p-3 flex items-center justify-center shadow-md hover:shadow-lg transition duration-300 ease-in-out ${step === 1 ? "opacity-50 cursor-not-allowed" : ""}`}>
          <FaArrowLeft className="text-gray-300" size={32} />
        </div>
      </button>
    </div>
  );
};

export default Navigator;