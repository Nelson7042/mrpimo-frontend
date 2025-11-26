import FullButton from "@/components/FullButton";
import Modal2 from "@/components/Modal2";
import { Button } from "@/components/ui/button";
import Assets from "@/constant/images.constant";
import { X } from "lucide-react";
import Image from "next/image";
import React from "react";

interface Card {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  logout: () => void;
}

const LogoutModal = ({ isOpen, onClose, isLoading, logout }: Card) => {
  return (
    <Modal2 isOpen={isOpen} onClose={onClose}>
      <div className="inline-block overflow-hidden text-left pb-4  px-3 md:px-6 lg:px-7 relative align-bottom transition-all transform bg-[white] rounded-[24px] shadow-xl sm:my-8 sm:align-middle sm:max-w-[587px] sm:w-full">
        <div className="py-4 md:py-8">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-base md:text-lg  mb-4">Logout</h3>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            <p className="text-lg md:text-xl font-semibold text-center">
              Are you sure that you want to Logout
            </p>

            <Image
              src={Assets.logout}
              alt="Logout Image"
              className="h-[120px] md:h-[220px] mx-auto"
            />

            <div className="flex flex-col space-y-2 mt-5">
              <FullButton
                action={logout}
                disabled={isLoading}
                name={"Yes Please"}
                color="blue"
              />
              <Button
                variant="ghost"
                onClick={() => onClose()}
                className="w-full py-2 md:py-3 border-[#F6B76F] text-[#F6B76F]  border bg-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal2>
  );
};

export default LogoutModal;
