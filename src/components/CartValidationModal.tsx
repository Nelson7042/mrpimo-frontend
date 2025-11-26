import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { CartValidationResponse } from "@/types/checkout.types";
import { CartValidation } from "./CartValidation";

interface CartValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationData: CartValidationResponse | null;
  onProceed: () => void;
}

export const CartValidationModal = ({
  isOpen,
  onClose,
  validationData,
  onProceed,
}: CartValidationModalProps) => {
  if (!validationData) return null;

  const { checkout } = validationData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {checkout.canProceed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            Cart Validation
          </DialogTitle>
        </DialogHeader>

        <div className="h-[70vh] overflow-y-scroll">
          <CartValidation unavailableItems={checkout.unavailableItems} />

          <div className="space-y-4 mt-4 md:mt-6">
           

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2">Order Summary:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${checkout.pricing.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${checkout.pricing.tax}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${checkout.pricing.shipping}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span>${checkout.pricing.total}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {checkout.canProceed && (
                <Button onClick={onProceed} className="flex-1">
                  Proceed to Checkout
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
