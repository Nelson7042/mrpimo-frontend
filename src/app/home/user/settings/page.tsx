"use client";

import { useState } from "react";
import { useUpdateNotificationPreferences } from "@/hooks/useNotifications";
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/hooks/useAddress";
import {
  useUserProfile,
  useUserCards,
  useAddCard,
  useRemoveCard,
  useSetDefaultCard,
} from "@/hooks/useUser";
import { Country, State } from "country-state-city";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Edit, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter, useSearchParams } from "next/navigation";
import AddCardModal from "@/components/users/settings/AddCardModal";
import { toast } from "react-hot-toast";

type SettingsSection =
  | "main"
  | "account"
  | "shipping"
  | "payment"
  | "notifications"
  | "security";

const settingsNavigation = [
  { id: "account", label: "Account Information", hasBack: true },
  { id: "shipping", label: "Shipping Information", hasBack: true },
  { id: "payment", label: "Payment Information", hasBack: true },
  { id: "notifications", label: "Notifications", hasBack: true },
  { id: "security", label: "Security", hasBack: true },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') as SettingsSection || 'main';
  const [currentSection, setCurrentSection] = useState<SettingsSection>(initialSection);
  const [showPassword, setShowPassword] = useState(false);
  const updateNotificationPreferences = useUpdateNotificationPreferences();
  const { data: addressData } = useAddresses();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const { data: profileData } = useUserProfile();
  const { data: cardsData } = useUserCards();
  const addCardMutation = useAddCard();
  const removeCardMutation = useRemoveCard();
  const setDefaultCardMutation = useSetDefaultCard();

  const [preferences, setPreferences] = useState({
    stockAlert: true,
    orderStatus: true,
    pendingReviews: true,
    paymentUpdates: true,
    newsletter: true,
  });

  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    type: "shipping" as const,
    isDefault: false,
  });

  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCard, setNewCard] = useState({
    cardHolderName: "",
    last4: "",
    brand: "",
    expMonth: "",
    expYear: "",
    gateway: "stripe",
  });

  const addresses = addressData?.addresses || [];
  const shippingAddresses = addresses.filter(
    (addr) => addr.type === "shipping"
  );
  const cards = cardsData?.cards || [];

  const [formData, setFormData] = useState({
    firstName: "Dickson",
    middleName: "Dickson",
    lastName: "Dickson",
    email: "Thisismyemil@gmail.com",
  });

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [editSelectedCountry, setEditSelectedCountry] = useState("");
  const [editSelectedState, setEditSelectedState] = useState("");
  const countries = Country.getAllCountries();
  const states = selectedCountry
    ? State.getStatesOfCountry(selectedCountry)
    : [];
  const editStates = editSelectedCountry
    ? State.getStatesOfCountry(editSelectedCountry)
    : [];

  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "My Account", href: "/home/user/settings" },
    { label: "Dashboard", href: "/home" },
    { label: "Settings", href: null },
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    console.log("Breadcrumb clicked:", item);
    if (item.href) {
      router.push(item?.href);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewAddressChange = (field: string, value: string | boolean) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditAddressChange = (field: string, value: string | boolean) => {
    setEditingAddress((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleAddAddress = () => {
    addAddressMutation.mutate({ address: newAddress }, {
      onSuccess: () => {
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
        setShowAddForm(false);
        
        // Check if user came from buy now flow
        const buyNowReturn = localStorage.getItem('buyNowReturn');
        if (buyNowReturn) {
          const returnData = JSON.parse(buyNowReturn);
          localStorage.removeItem('buyNowReturn');
          toast.success('Address added! Redirecting back to product...');
          setTimeout(() => {
            router.push(returnData.path);
          }, 1500);
        }
      },
    });
  };

  const handleUpdateAddress = () => {
    if (editingAddress) {
      updateAddressMutation.mutate(editingAddress, {
        onSuccess: () => {
          setEditingAddress(null);
          setEditSelectedCountry("");
          setEditSelectedState("");
        },
      });
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    deleteAddressMutation.mutate(addressId);
  };

  const handleNewCardChange = (field: string, value: string) => {
    setNewCard((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCard = () => {
    const cardData = {
      gateway: newCard.gateway,
      cardDetails: {
        last4: newCard.last4,
        brand: newCard.brand,
        expMonth: parseInt(newCard.expMonth),
        expYear: parseInt(newCard.expYear),
        cardHolderName: newCard.cardHolderName,
      },
      billingAddress: {},
      metadata: {},
    };

    addCardMutation.mutate(cardData, {
      onSuccess: () => {
        setNewCard({
          cardHolderName: "",
          last4: "",
          brand: "",
          expMonth: "",
          expYear: "",
          gateway: "stripe",
        });
        setShowAddCardForm(false);
      },
    });
  };

  const handleRemoveCard = (last4: string) => {
    removeCardMutation.mutate(last4);
  };

  const handleSetDefaultCard = (last4: string) => {
    setDefaultCardMutation.mutate(last4);
  };

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setSelectedState(""); // Reset state when country changes
    const country = countries.find((c) => c.isoCode === countryCode);
    handleNewAddressChange("country", country?.name || "");
    handleNewAddressChange("state", ""); // Reset state when country changes
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode);
    const state = states.find((s) => s.isoCode === stateCode);
    handleNewAddressChange("state", state?.name || "");
  };

  const handleEditCountryChange = (countryCode: string) => {
    setEditSelectedCountry(countryCode);
    setEditSelectedState(""); // Reset state when country changes
    const country = countries.find((c) => c.isoCode === countryCode);
    handleEditAddressChange("country", country?.name || "");
    handleEditAddressChange("state", ""); // Reset state when country changes
  };

  const handleEditStateChange = (stateCode: string) => {
    setEditSelectedState(stateCode);
    const state = editStates.find((s) => s.isoCode === stateCode);
    handleEditAddressChange("state", state?.name || "");
  };

  const handleNotificationChange = (field: string, checked: boolean) => {
    const newPreferences = {
      ...preferences,
      [field]: checked,
    };
    setPreferences(newPreferences);
    updateNotificationPreferences.mutate(newPreferences);
  };

  const renderMainSettings = () => (
    <div className="flex gap-8">
      {/* Left Panel - Navigation */}
      <Card className="flex-1 bg-transparent border-0 shadow-none">
        <CardContent className="p-6 bg-transparent">
          <h2 className="text-xl font-bold mb-6">Settings</h2>
          <div className="space-y-2">
            {settingsNavigation.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-between text-left"
                onClick={() => setCurrentSection(item.id as SettingsSection)}
              >
                {item.label}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Quick View */}
      <Card className="flex-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Account Information</h3>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Name</Label>
                <p className="font-medium">
                  {profileData?.user?.profile?.firstName}{" "}
                  {profileData?.user?.profile?.lastName}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Phone</Label>
                <p className="font-medium">
                  {profileData?.user?.profile?.phoneNumber || "Not provided"}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Email Address</Label>
              <p className="font-medium">{profileData?.user?.email}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Credit Balance</Label>
              <p className="font-bold text-lg">
                ₦ {profileData?.fiatWallet?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccountSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSection("main")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Account Information</h2>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileData?.user?.profile?.firstName || ""}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="bg-[#E2E8F0] border-0 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileData?.user?.profile?.lastName || ""}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="bg-[#E2E8F0] border-0 mt-1 focus:border-[0.5px] focus:outline-0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profileData?.user?.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-[#E2E8F0] border-0 mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={profileData?.user?.profile?.phoneNumber || ""}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className="bg-[#E2E8F0] border-0 mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Shipping Address</Label>
              <div className="bg-[#E2E8F0] p-3 rounded mt-1">
                {profileData?.shippingDefaultAddress ? (
                  <div>
                    <p className="font-medium">
                      {profileData.user.profile.firstName}{" "}
                      {profileData.user.profile.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {profileData.shippingDefaultAddress.street},{" "}
                      {profileData.shippingDefaultAddress.city},{" "}
                      {profileData.shippingDefaultAddress.state}
                    </p>
                    <p className="text-sm text-gray-600">
                      {profileData.user.profile.phoneNumber}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No default address set
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label>Credit Balance</Label>
              <div className="bg-[#E2E8F0] p-3 rounded mt-1">
                <p className="font-bold text-lg">
                  ₦ {profileData?.fiatWallet?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderShippingSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSection("main")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Shipping Addresses</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            Add Address
          </Button>
        </div>

        <div className="space-y-4">
          {/* Existing Addresses */}
          {shippingAddresses.map((address) => (
            <div key={address._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  {address.isDefault && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2 inline-block">
                      Default
                    </span>
                  )}
                  <p className="font-medium">{address.street}</p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state}, {address.country}{" "}
                    {address.postalCode}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(address);
                      // Initialize country and state dropdowns for editing
                      const country = countries.find(
                        (c) => c.name === address.country
                      );
                      if (country) {
                        setEditSelectedCountry(country.isoCode);
                        const addressStates = State.getStatesOfCountry(
                          country.isoCode
                        );
                        const state = addressStates.find(
                          (s) => s.name === address.state
                        );
                        if (state) {
                          setEditSelectedState(state.isoCode);
                        }
                      }
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAddress(address._id!)}
                    // disabled={address.isDefault}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Address Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-4">Add New Address</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Street Address"
                  value={newAddress.street}
                  onChange={(e) =>
                    handleNewAddressChange("street", e.target.value)
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) =>
                      handleNewAddressChange("city", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Postal Code"
                    value={newAddress.postalCode}
                    onChange={(e) =>
                      handleNewAddressChange("postalCode", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Select
                      value={selectedCountry}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem
                            key={country.isoCode}
                            value={country.isoCode}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={selectedState}
                      onValueChange={handleStateChange}
                      disabled={!selectedCountry}
                    >
                      <SelectTrigger className="w-full bg-[#E2E8F0]">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddAddress}
                    disabled={addAddressMutation.isPending}
                  >
                    {addAddressMutation.isPending ? "Adding..." : "Add Address"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedCountry("");
                      setSelectedState("");
                      setNewAddress({
                        street: "",
                        city: "",
                        state: "",
                        country: "",
                        postalCode: "",
                        type: "shipping",
                        isDefault: false,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Address Form */}
          {editingAddress && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium mb-4">Edit Address</h3>
              <div className="space-y-4">
                <Input
                  value={editingAddress.street}
                  onChange={(e) =>
                    handleEditAddressChange("street", e.target.value)
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={editingAddress.city}
                    onChange={(e) =>
                      handleEditAddressChange("city", e.target.value)
                    }
                  />
                  <Input
                    value={editingAddress.postalCode}
                    onChange={(e) =>
                      handleEditAddressChange("postalCode", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Select
                      value={editSelectedCountry}
                      onValueChange={handleEditCountryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem
                            key={country.isoCode}
                            value={country.isoCode}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select
                      value={editSelectedState}
                      onValueChange={handleEditStateChange}
                      disabled={!editSelectedCountry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {editStates.map((state) => (
                          <SelectItem key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={editingAddress.isDefault}
                    onCheckedChange={(checked) =>
                      handleEditAddressChange("isDefault", checked as boolean)
                    }
                  />
                  <Label>Set as default address</Label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpdateAddress}
                    disabled={updateAddressMutation.isPending}
                  >
                    {updateAddressMutation.isPending
                      ? "Updating..."
                      : "Update Address"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingAddress(null);
                      setEditSelectedCountry("");
                      setEditSelectedState("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderPaymentSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSection("main")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Payment Information</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddCardForm(true)}
          >
            Add Card
          </Button>
        </div>
        <AddCardModal
          isOpen={showAddCardForm}
          onClose={() => setShowAddCardForm(false)}
          handleAddCard={() => handleAddCard()}
          newCard={newCard}
          handleNewCardChange={handleNewCardChange}
          addCardMutation={addCardMutation}

        />
        <div className="space-y-4">
          {/* Existing Cards */}
          {cards.map((card) => (
            <div
              key={card.last4}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  {card.brand.toUpperCase().slice(0, 2)}
                </div> */}

                <img src={"images/mastercard.svg"} alt="maste card" />
                <div>
                  <p className="font-medium">**** **** **** {card.last4}</p>
                  <p className="text-sm text-gray-500">
                    {card.cardHolderName} • {card.expMonth}/{card.expYear}
                  </p>
                  {card.isDefault && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1 inline-block">
                      Default
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                {!card.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefaultCard(card.last4)}
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCard(card.last4)}
                  disabled={card.isDefault && cards.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

      

          {cards.length === 0 && !showAddCardForm && (
            <div className="text-center py-8 text-gray-500">
              <p>No payment methods added yet</p>
              <Button
                variant="link"
                className="text-blue-600 mt-2"
                onClick={() => setShowAddCardForm(true)}
              >
                Add your first card
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSection("main")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold ml-4">Notifications</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Email Notification</h3>
            <Switch defaultChecked />
          </div>

          <div className="space-y-4">
            {[
              { key: "newStockAlert", label: "New Stock Alert" },
              { key: "lowStockAlert", label: "Low Stock Alert" },
              { key: "orderStatusAlert", label: "Order Status Alert" },
              { key: "pendingReviews", label: "Pending Reviews" },
              { key: "paymentAlert", label: "Payment Alert" },
            ].map((item) => (
              <div key={item.key} className="flex items-center space-x-3">
                <Checkbox
                  checked={preferences[item.key as keyof typeof preferences]}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(item.key, checked as boolean)
                  }
                />
                <Label className="text-sm">{item.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentSection("main")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">Security</h2>
          </div>
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
            Change
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value="*******"
                className="bg-[#E2E8F0] border-0 pr-10"
                readOnly
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "account":
        return renderAccountSettings();
      case "shipping":
        return renderShippingSettings();
      case "payment":
        return renderPaymentSettings();
      case "notifications":
        return renderNotificationSettings();
      case "security":
        return renderSecuritySettings();
      default:
        return renderMainSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={manualBreadcrumbs}
        onItemClick={handleBreadcrumbClick}
        className="mb-4"
      />
      <div>{renderCurrentSection()}</div>
    </div>
  );
}
