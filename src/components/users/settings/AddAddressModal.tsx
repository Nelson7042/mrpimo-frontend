"use client";

import { useState } from "react";
import { Country, State } from "country-state-city";
import { X } from "lucide-react";
import Modal2 from "@/components/Modal2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAddAddress } from "@/hooks/useAddress";
import { toast } from "react-hot-toast";

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddAddressModal = ({ isOpen, onClose, onSuccess }: AddAddressModalProps) => {
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    type: "shipping" as const,
    isDefault: false,
  });
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const addAddressMutation = useAddAddress();
  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];

  const handleNewAddressChange = (field: string, value: string | boolean) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState("");
    const country = countries.find((c) => c.isoCode === countryCode);
    handleNewAddressChange("country", country?.name || "");
    handleNewAddressChange("state", "");
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    const state = states.find((s) => s.isoCode === stateCode);
    handleNewAddressChange("state", state?.name || "");
  };

  const resetForm = () => {
    setNewAddress({
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      type: "shipping",
      isDefault: false,
    });
    setSelectedCountry("");
    setSelectedState("");
  };

  const handleAddAddress = () => {
    if (!newAddress.street || !newAddress.city || !newAddress.country || !newAddress.state) {
      console.error("[AddAddressModal] Missing fields:", { newAddress, selectedCountry, selectedState });
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("[AddAddressModal] Submitting:", newAddress);
    addAddressMutation.mutate(
      { address: newAddress },
      {
        onSuccess: () => {
          toast.success("Address added successfully!");
          resetForm();
          onClose();
          onSuccess?.();
        },
        onError: () => {
          toast.error("Failed to add address");
        },
      }
    );
  };

  return (
    <Modal2 isOpen={isOpen} onClose={onClose}>
      <div
        className="inline-block overflow-y-auto max-h-[90vh] text-left pb-4 px-3 md:px-6 lg:px-7 relative align-bottom transition-all transform bg-white rounded-[24px] shadow-xl sm:my-8 sm:align-middle sm:max-w-[587px] sm:w-full"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="py-4 md:py-8">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-base md:text-lg mb-4">
              Add Shipping Address
            </h3>
            <button onClick={onClose}>
              <X />
            </button>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Street Address"
              value={newAddress.street}
              onChange={(e) => handleNewAddressChange("street", e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => handleNewAddressChange("city", e.target.value)}
              />
              <Input
                placeholder="Postal Code"
                value={newAddress.postalCode}
                onChange={(e) => handleNewAddressChange("postalCode", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SearchableSelect
                options={countries.map((country) => ({
                  value: country.isoCode,
                  label: country.name,
                }))}
                value={selectedCountry}
                onValueChange={handleCountryChange}
                placeholder="Select Country"
                searchPlaceholder="Search country..."
                className="w-full"
                emptyMessage="No countries found"
                popoverClassName="z-[99999]"
                modal={true}
              />
              <SearchableSelect
                options={states.map((state) => ({
                  value: state.isoCode,
                  label: state.name,
                }))}
                value={selectedState}
                onValueChange={handleStateChange}
                placeholder="Select State/Province"
                searchPlaceholder="Search state/province..."
                disabled={!selectedCountry}
                className="w-full"
                emptyMessage="No states found"
                popoverClassName="z-[99999]"
                modal={true}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={newAddress.isDefault}
                onCheckedChange={(checked) =>
                  handleNewAddressChange("isDefault", checked as boolean)
                }
              />
              <Label>Set as default address</Label>
            </div>
            <div className="flex flex-col space-y-2 mt-5">
              <Button
                onClick={handleAddAddress}
                disabled={addAddressMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {addAddressMutation.isPending ? "Adding..." : "Add Address"}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full py-2 md:py-3 border-[#F6B76F] text-[#F6B76F] border bg-white"
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

export default AddAddressModal;
