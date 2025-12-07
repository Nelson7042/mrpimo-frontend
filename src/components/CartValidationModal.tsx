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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(checkout?.canProceed && validationData.success) ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            Cart Validation
          </DialogTitle>
        </DialogHeader>

        <div className="h-[70vh] overflow-y-scroll">
          {hasErrors ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold mb-4">Cart Validation Issues</h3>
              <div className="space-y-2">
                {validationData.errors.map((error: string, index: number) => (
                  <div key={index} className="text-red-600 text-sm">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <CartValidation unavailableItems={checkout?.unavailableItems || []} />
              {checkout?.warnings && checkout.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <h3 className="text-yellow-800 font-semibold mb-2">Warnings</h3>
                  <div className="space-y-1">
                    {checkout.warnings.map((warning: string, index: number) => (
                      <div key={index} className="text-yellow-700 text-sm">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!hasErrors && (
            <div className="space-y-4 mt-4 md:mt-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.tax?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.shipping?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>{checkout?.pricing.currency} {checkout?.pricing.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {hasErrors ? "Close" : "Cancel"}
            </Button>
            {checkout?.canProceed && validationData.success && (
              <Button onClick={onProceed} className="flex-1">
                Proceed to Checkout
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
