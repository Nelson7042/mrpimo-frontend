import FullButton from "@/components/FullButton";
import Modal2 from "@/components/Modal2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import React from "react";

interface Card {
  isOpen: boolean;
  onClose: () => void;
  newCard: {
    cardHolderName: string;
    last4: string;
    brand: string;
    expMonth: string;
    expYear: string;
  };
  handleNewCardChange: (field: string, value: string) => void;
  handleAddCard: () => void;
  addCardMutation: {
    mutate: (data: any) => void;
    isPending: boolean;
  };
}

const AddCardModal = ({
  isOpen,
  onClose,
  handleNewCardChange,
  newCard,
  handleAddCard,
  addCardMutation,
}: Card) => {
  return (
    <Modal2 isOpen={isOpen} onClose={onClose}>
      <div className="inline-block overflow-hidden text-left pb-4  px-3 md:px-6 lg:px-7 relative align-bottom transition-all transform bg-[white] rounded-[24px] shadow-xl sm:my-8 sm:align-middle sm:max-w-[587px] sm:w-full">
        <div className="py-4 md:py-8">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-base md:text-lg  mb-4">
              Add New Card
            </h3>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <p className="text-sm md:text-base font-roboto mb-6">
            Provide your card details to proceed
          </p>
          <div className="space-y-4 md:space-y-6">
            <Input
              placeholder="Card Holder Name"
              value={newCard.cardHolderName}
              onChange={(e) =>
                handleNewCardChange("cardHolderName", e.target.value)
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Last 4 digits"
                value={newCard.last4}
                onChange={(e) => handleNewCardChange("last4", e.target.value)}
                maxLength={4}
              />
              <Input
                placeholder="Brand (e.g., Visa)"
                value={newCard.brand}
                onChange={(e) => handleNewCardChange("brand", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Exp Month (MM)"
                value={newCard.expMonth}
                onChange={(e) =>
                  handleNewCardChange("expMonth", e.target.value)
                }
                maxLength={2}
              />
              <Input
                placeholder="Exp Year (YYYY)"
                value={newCard.expYear}
                onChange={(e) => handleNewCardChange("expYear", e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="flex items-center gap-1">
              <input type="checkbox" />
              <p className="text-xs md:text-sm">
                I have read and accept the terms of use, rules and privacy
                policy
              </p>
            </div>

            <div className="flex flex-col space-y-2 mt-5">
              <FullButton
                action={handleAddCard}
                disabled={addCardMutation.isPending}
                name={addCardMutation.isPending ? "Adding..." : "Add Card"}
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

export default AddCardModal;
