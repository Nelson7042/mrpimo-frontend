"use client";

import { Info, MapPin, Package, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ShippingInfoBanner() {
  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-2 text-blue-900">
              📦 GIGL Shipping - How It Works
            </h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Set Your Exact Location</p>
                  <p className="text-gray-600">
                    Enable home delivery by setting your exact location. Without it, you'll pick up from the nearest GIGL station.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Vendor Prepares Order</p>
                  <p className="text-gray-600">
                    Vendor drops off or requests pickup from their nearest GIGL station.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Truck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">GIGL Delivers to You</p>
                  <p className="text-gray-600">
                    With exact location: Delivered to your door. Without: Pick up at your nearest station.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
