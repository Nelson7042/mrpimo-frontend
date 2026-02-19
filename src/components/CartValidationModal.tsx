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
  const hasErrors = !validationData.success && validationData.errors;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md font-roboto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
            {(checkout?.canProceed && validationData.success) ? (
              <CheckCircle className="w-4 h-4 text-blue-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            Cart Validation
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {hasErrors ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-red-800 font-medium text-xs mb-2">Validation Issues</h3>
              <div className="space-y-1">
                {validationData.errors.map((error: string, index: number) => (
                  <div key={index} className="text-red-600 text-xs">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <CartValidation unavailableItems={checkout?.unavailableItems || []} />
              {checkout?.warnings && checkout.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                  <h3 className="text-amber-800 font-medium text-xs mb-1">Warnings</h3>
                  <div className="space-y-1">
                    {checkout.warnings.map((warning: string, index: number) => (
                      <div key={index} className="text-amber-700 text-xs">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!hasErrors && (
            <div className="mt-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="font-medium text-xs text-gray-700 mb-2">Order Summary</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.shipping?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-900 border-t border-gray-200 pt-2 mt-2">
                    <span>Total</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 text-xs h-9 bg-secondary text-black border-orange-200 hover:bg-orange-200"
            >
              {hasErrors ? "Close" : "Cancel"}
            </Button>
            {checkout?.canProceed && validationData.success && (
              <Button 
                onClick={onProceed} 
                className="flex-1 text-xs h-9 bg-blue-600 hover:bg-blue-700"
              >
                Proceed to Checkout
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
