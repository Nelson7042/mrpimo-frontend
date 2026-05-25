"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ChevronRight, ChevronLeft, Edit, Eye, EyeOff, Plus, Upload, Shield, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs";
import { useRouter, useSearchParams } from "next/navigation";
import AddCardModal from "@/components/users/settings/AddCardModal";
import { toast } from "react-hot-toast";
import LocationPicker from "@/components/users/settings/LocationPicker";
import ShippingInfoBanner from "@/components/users/settings/ShippingInfoBanner";
import { useUserStore } from "@/stores/useUserStore";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";
import TwoFactorSetup from "@/app/vendor/dashboard/settings/components/TwoFactorSetup";
import DisableTwoFactor from "@/app/vendor/dashboard/settings/components/DisableTwoFactor";
import { useWalletDisplay } from "@/hooks/useWalletBalance";
import SessionManagement from "@/components/settings/SessionManagement";
import LoginHistory from "@/components/settings/LoginHistory";
import PhoneVerification from "@/components/settings/PhoneVerification";
import SecurityEventLog from "@/components/settings/SecurityEventLog";
import AccountDeletion from "@/components/settings/AccountDeletion";
import DataExport from "@/components/settings/DataExport";
import NotificationFrequency from "@/components/settings/NotificationFrequency";
import TrustedDevices from "@/components/settings/TrustedDevices";
import BiometricSetup from "@/components/settings/BiometricSetup";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

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
    push: true,
    sms: false,
    marketing: false,
  });
  const [preferencesInitialized, setPreferencesInitialized] = useState(false);

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

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Language preference state
  const SUPPORTED_LANGUAGES = [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
    { code: "pt", label: "Português" },
    { code: "ar", label: "العربية" },
    { code: "zh", label: "中文" },
    { code: "yo", label: "Yorùbá" },
    { code: "ig", label: "Igbo" },
    { code: "ha", label: "Hausa" },
  ];

  // Security section state
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  const { user, setUser } = useUserStore();
  const queryClient = useQueryClient();

  const { usdDisplay: balanceUSD, approxDisplay: balanceApprox } = useWalletDisplay(
    profileData?.fiatWallet?.balances?.available,
    user?.preferences?.currency
  );
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordChanging, setPasswordChanging] = useState(false);

  const addresses = addressData?.addresses || [];
  const shippingAddresses = addresses.filter(
    (addr) => addr.type === "shipping"
  );
  const cards = cardsData?.cards || [];

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Saved values for unsaved changes tracking
  const [savedFormData, setSavedFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  // Sync formData when profileData loads
  const profileLoaded = profileData?.user;
  if (profileLoaded && !formData.firstName && !isEditingProfile) {
    const initialData = {
      firstName: profileLoaded.profile?.firstName || "",
      middleName: profileLoaded.profile?.middleName || "",
      lastName: profileLoaded.profile?.lastName || "",
      email: profileLoaded.email || "",
      phoneNumber: profileLoaded.profile?.phoneNumber || "",
    };
    setFormData(initialData);
    setSavedFormData(initialData);
  }

  // Unsaved changes warning for profile form
  const { isDirty: isProfileDirty, isDialogOpen, confirmLeave, cancelLeave } = useUnsavedChanges({
    currentValues: formData,
    savedValues: savedFormData,
    enabled: isEditingProfile,
  });

  // Sync notification preferences when profileData loads
  if (profileLoaded && !preferencesInitialized) {
    const emailPrefs = profileLoaded.preferences?.notifications?.email;
    const notifPrefs = profileLoaded.preferences?.notifications;
    setPreferences({
      stockAlert: emailPrefs?.stockAlert ?? true,
      orderStatus: emailPrefs?.orderStatus ?? true,
      pendingReviews: emailPrefs?.pendingReviews ?? true,
      paymentUpdates: emailPrefs?.paymentUpdates ?? true,
      newsletter: emailPrefs?.newsletter ?? true,
      push: notifPrefs?.push ?? true,
      sms: notifPrefs?.sms ?? false,
      marketing: profileLoaded.preferences?.marketing ?? false,
    });
    setPreferencesInitialized(true);
  }

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
    { label: "Dashboard", href: "/home/user" },
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

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      // Only send fields that actually changed
      const payload: Record<string, string> = {};
      if (formData.firstName !== (profileData?.user?.profile?.firstName || "")) {
        payload.firstName = formData.firstName;
      }
      if (formData.lastName !== (profileData?.user?.profile?.lastName || "")) {
        payload.lastName = formData.lastName;
      }
      if (formData.phoneNumber !== (profileData?.user?.profile?.phoneNumber || "")) {
        payload.phoneNumber = formData.phoneNumber;
      }

      if (Object.keys(payload).length === 0) {
        toast.success("No changes to save");
        setIsEditingProfile(false);
        setProfileSaving(false);
        return;
      }

      const response = await fetchWithAuth(`${API_BASE_URL}/users/profile`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Profile updated successfully");
        setIsEditingProfile(false);
        setSavedFormData(formData);
        // Update the user store so other components see the change
        if (user) {
          setUser({
            ...user,
            profile: {
              ...user.profile,
              ...(payload.firstName && { firstName: payload.firstName }),
              ...(payload.lastName && { lastName: payload.lastName }),
              ...(payload.phoneNumber && { phoneNumber: payload.phoneNumber }),
            },
          });
        }
        // Invalidate the React Query cache so profileData refreshes
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
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

        // Check if user came from checkout flow
        const checkoutReturn = localStorage.getItem('checkoutReturn');
        if (checkoutReturn) {
          localStorage.removeItem('checkoutReturn');
          toast.success('Address added! Redirecting back to checkout...');
          setTimeout(() => {
            router.push('/home/checkout');
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

  const handleNotificationChange = async (field: string, checked: boolean) => {
    const previousPrefs = { ...preferences };
    const updated = { ...preferences, [field]: checked };
    setPreferences(updated);
    try {
      await updateNotificationPreferences.mutateAsync(updated);
    } catch {
      // Revert on failure — toast is handled by the mutation hook
      setPreferences(previousPrefs);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetchWithAuth(`${API_BASE_URL}/users/avatar`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.avatarUrl) {
        if (user) {
          setUser({ ...user, profile: { ...user.profile, avatar: data.avatarUrl } });
        }
        queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        toast.success("Avatar updated");
      } else {
        toast.error(data.message || "Failed to upload avatar");
      }
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLanguageChange = async (langCode: string) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/users/preferences/language`, {
        method: "PATCH",
        body: JSON.stringify({ language: langCode }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Language updated");
      }
    } catch {
      toast.error("Failed to update language");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPasswordChanging(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/users/change-password`, {
        method: "POST",
        body: JSON.stringify(passwordForm),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setPasswordChanging(false);
    }
  };

  const renderMainSettings = () => (
    <div className="flex gap-8 font-roboto">
      {/* Left Panel - Navigation */}
      <Card className="flex-1 bg-transparent border-0 shadow-none">
        <CardContent className="p-6 bg-transparent">
          <h2 className="text-xl font-semibold mb-6">Settings</h2>
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
            <h3 className="font-roboto text-base font-semibold">Account Information</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentSection("account")}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <Label className="font-roboto text-xs text-gray-600">Full Name</Label>
              <p className="font-roboto text-xs font-medium">
                {profileData?.user?.profile?.firstName}{" "}
                {profileData?.user?.profile?.lastName}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-roboto text-xs text-gray-600">Email Address</Label>
              <p className="font-roboto text-xs font-medium break-all">{profileData?.user?.email}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-roboto text-xs text-gray-600">Phone Number</Label>
              <p className="font-roboto text-xs font-medium">
                {profileData?.user?.profile?.phoneNumber || "Not provided"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="font-roboto text-xs text-gray-600">Credit Balance</Label>
              <p className="font-roboto font-semibold text-sm">
                {balanceUSD}
                {balanceApprox && <span className="font-normal text-xs text-gray-500 ml-1">{balanceApprox}</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAccountSettings = () => (
    <Card className="font-roboto">
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
            <h2 className="font-roboto text-base font-semibold">Account Information</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            if (!isEditingProfile) {
              setFormData({
                firstName: profileData?.user?.profile?.firstName || "",
                middleName: profileData?.user?.profile?.middleName || "",
                lastName: profileData?.user?.profile?.lastName || "",
                email: profileData?.user?.email || "",
                phoneNumber: profileData?.user?.profile?.phoneNumber || "",
              });
            }
            setIsEditingProfile(!isEditingProfile);
          }}>
            <Edit className="w-4 h-4" />
            <span className="font-roboto text-xs">{isEditingProfile ? "Cancel" : "Edit"}</span>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {profileData?.user?.profile?.avatar ? (
                <img
                  src={profileData.user.profile.avatar}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-xl">
                  {profileData?.user?.profile?.firstName?.[0] || "?"}
                </span>
              )}
            </div>
            <div>
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Upload className="w-4 h-4" />
                {avatarUploading ? "Uploading..." : "Change Photo"}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
              <p className="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP. Max 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="font-roboto text-xs">First Name</Label>
              <Input
                id="firstName"
                value={isEditingProfile ? formData.firstName : (profileData?.user?.profile?.firstName || "")}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="font-roboto text-xs bg-[#E2E8F0] border-0 mt-1"
                readOnly={!isEditingProfile}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="font-roboto text-xs">Last Name</Label>
              <Input
                id="lastName"
                value={isEditingProfile ? formData.lastName : (profileData?.user?.profile?.lastName || "")}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="font-roboto text-xs bg-[#E2E8F0] border-0 mt-1 focus:border-[0.5px] focus:outline-0"
                readOnly={!isEditingProfile}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="font-roboto text-xs">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profileData?.user?.email || ""}
              className="font-roboto text-xs bg-[#E2E8F0] border-0 mt-1 cursor-not-allowed opacity-70"
              readOnly
              aria-readonly="true"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <Label htmlFor="phoneNumber" className="font-roboto text-xs">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={isEditingProfile ? formData.phoneNumber : (profileData?.user?.profile?.phoneNumber || "")}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              className="font-roboto text-xs bg-[#E2E8F0] border-0 mt-1"
              readOnly={!isEditingProfile}
            />
          </div>

          {isEditingProfile && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {profileSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Language Preference */}
          <div>
            <Label className="font-roboto text-xs flex items-center gap-1">
              <Globe className="w-3 h-3" /> Language
            </Label>
            <Select
              defaultValue={profileData?.user?.preferences?.language || "en"}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="mt-1 bg-[#E2E8F0] border-0">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="font-roboto text-xs">Default Shipping Address</Label>
              <div className="bg-[#E2E8F0] p-3 rounded mt-1">
                {profileData?.shippingDefaultAddress ? (
                  <div>
                    <p className="font-roboto text-xs font-medium">
                      {profileData.user.profile.firstName}{" "}
                      {profileData.user.profile.lastName}
                    </p>
                    <p className="font-roboto text-xs text-gray-600">
                      {profileData.shippingDefaultAddress.street},{" "}
                      {profileData.shippingDefaultAddress.city},{" "}
                      {profileData.shippingDefaultAddress.state}
                    </p>
                    <p className="font-roboto text-xs text-gray-600">
                      {profileData.user.profile.phoneNumber}
                    </p>
                  </div>
                ) : (
                  <p className="font-roboto text-xs text-gray-500">
                    No default address set
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label className="font-roboto text-xs">Credit Balance</Label>
              <div className="bg-[#E2E8F0] p-3 rounded mt-1">
                <p className="font-roboto font-semibold text-sm">
                  {balanceUSD}
                  {balanceApprox && <span className="font-normal text-xs text-gray-500 ml-1">{balanceApprox}</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="border-t pt-4">
            <DataExport />
          </div>

          {/* Account Deletion */}
          <div className="border-t pt-4">
            <AccountDeletion />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderShippingSettings = () => (
    <Card className="font-roboto">
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
            <h2 className="text-xl font-semibold">Shipping Addresses</h2>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Address
          </Button>
        </div>

        {/* Info Banner */}
        <ShippingInfoBanner />

        <div className="space-y-4">
          {/* Empty State */}
          {shippingAddresses.length === 0 && !showAddForm && (
            <div className="text-center py-8 border rounded-lg bg-gray-50">
              <p className="text-gray-500 mb-2">No shipping addresses added yet</p>
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add your first address
              </Button>
            </div>
          )}

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
                  {address.hasExactLocation && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2 ml-2 inline-block">
                      📍 Home Delivery
                    </span>
                  )}
                  <p>{address.street}</p>
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
              
              {/* Location Picker for each address */}
              <LocationPicker
                addressId={address._id!}
                currentLocation={address.coordinates}
                hasExactLocation={address.hasExactLocation}
                onLocationUpdated={() => {
                  // Refresh addresses after location update
                }}
              />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
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
                    />
                  </div>
                  <div>
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
                      className="w-full bg-[#E2E8F0]"
                      emptyMessage="No states found"
                    />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <SearchableSelect
                      options={countries.map((country) => ({
                        value: country.isoCode,
                        label: country.name,
                      }))}
                      value={editSelectedCountry}
                      onValueChange={handleEditCountryChange}
                      placeholder="Select Country"
                      searchPlaceholder="Search country..."
                      emptyMessage="No countries found"
                    />
                  </div>
                  <div>
                    <SearchableSelect
                      options={editStates.map((state) => ({
                        value: state.isoCode,
                        label: state.name,
                      }))}
                      value={editSelectedState}
                      onValueChange={handleEditStateChange}
                      placeholder="Select State/Province"
                      searchPlaceholder="Search state/province..."
                      disabled={!editSelectedCountry}
                      emptyMessage="No states found"
                    />
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
    <Card className="font-roboto">
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
            <h2 className="text-xl font-semibold">Payment Information</h2>
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
                  <p>**** **** **** {card.last4}</p>
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
    <Card className="font-roboto">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSection("main")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="font-roboto text-base font-semibold ml-4">Notifications</h2>
        </div>

        <p className="text-xs text-gray-500 mb-4">Control which notifications you receive. Changes are saved automatically.</p>

        <div className="space-y-6">
          <h3 className="font-roboto text-sm font-medium">Email Notifications</h3>

          <div className="space-y-4">
            {[
              { key: "stockAlert", label: "New Stock Alert", description: "Get notified when products you follow are back in stock or have price drops" },
              { key: "orderStatus", label: "Order Status Alert", description: "Get notified when your order status changes (processing, shipped, delivered)" },
              { key: "pendingReviews", label: "Pending Reviews", description: "Get reminded about products you purchased that are awaiting your review" },
              { key: "paymentUpdates", label: "Payment Alert", description: "Get notified about wallet top-ups, payouts, and other payment activity" },
              { key: "newsletter", label: "Newsletter", description: "Receive our periodic newsletter with platform updates and featured products" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-roboto text-xs font-medium">{item.label}</p>
                  <p className="font-roboto text-xs text-gray-500">{item.description}</p>
                </div>
                <Switch
                  checked={preferences[item.key as keyof typeof preferences]}
                  onCheckedChange={(checked) =>
                    handleNotificationChange(item.key, checked)
                  }
                />
              </div>
            ))}
          </div>

          {/* Push & SMS Notifications */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-roboto text-sm font-medium">Other Channels</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-roboto text-xs font-medium">Push Notifications</p>
                <p className="font-roboto text-xs text-gray-500">Receive browser push notifications for real-time updates</p>
              </div>
              <Switch
                checked={preferences.push}
                onCheckedChange={(checked) =>
                  handleNotificationChange("push", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-roboto text-xs font-medium">SMS Notifications</p>
                <p className="font-roboto text-xs text-gray-500">Receive text message alerts for critical events</p>
              </div>
              <Switch
                checked={preferences.sms}
                onCheckedChange={(checked) =>
                  handleNotificationChange("sms", checked)
                }
              />
            </div>
          </div>

          {/* Marketing Opt-in */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-roboto text-xs font-medium">Marketing Communications</p>
                <p className="font-roboto text-xs text-gray-500">Receive promotional offers, deals, and platform updates</p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  handleNotificationChange("marketing", checked)
                }
              />
            </div>
            {!preferences.stockAlert && !preferences.orderStatus && !preferences.pendingReviews && !preferences.paymentUpdates && !preferences.newsletter && (
              <p className="text-xs text-amber-600 mt-2">
                Note: Critical emails (password reset, email verification) will still be sent.
              </p>
            )}
          </div>

          {/* Notification Frequency Preferences */}
          <div className="border-t pt-4">
            <NotificationFrequency />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card className="font-roboto">
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
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email Verification Status */}
          <div>
            <Label className="font-roboto text-xs text-gray-600">Email Verification</Label>
            <div className="flex items-center gap-2 mt-1">
              {profileData?.user?.isEmailVerified ? (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Verified</span>
              ) : (
                <>
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Unverified</span>
                  <Button variant="link" size="sm" className="text-xs text-blue-600 p-0 h-auto">
                    Resend verification email
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Linked Social Providers */}
          <div>
            <Label className="font-roboto text-xs text-gray-600">Linked Accounts</Label>
            <div className="flex gap-2 mt-1">
              {(profileData?.user?.socialLogins || []).map((login: any) => (
                <span key={login.provider} className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                  {login.provider}
                </span>
              ))}
              {(!profileData?.user?.socialLogins || profileData.user.socialLogins.length === 0) && (
                <span className="text-xs text-gray-500">No linked accounts</span>
              )}
            </div>
          </div>

          {/* Password Change */}
          <div className="border-t pt-4">
            <Label className="font-roboto text-sm font-medium">
              {(profileData?.user?.socialLogins?.length ?? 0) > 0 && !profileData?.user?.password
                ? "Set Password"
                : "Change Password"}
            </Label>
            <div className="space-y-3 mt-2">
              {!((profileData?.user?.socialLogins?.length ?? 0) > 0 && !profileData?.user?.password) && (
                <div>
                  <Label htmlFor="currentPassword" className="font-roboto text-xs">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="bg-[#E2E8F0] border-0 mt-1"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="newPassword" className="font-roboto text-xs">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="bg-[#E2E8F0] border-0 mt-1"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="font-roboto text-xs">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-[#E2E8F0] border-0 mt-1"
                />
              </div>
              <Button
                size="sm"
                onClick={handlePasswordChange}
                disabled={passwordChanging || !passwordForm.newPassword}
              >
                {passwordChanging ? "Changing..." : "Update Password"}
              </Button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" />
              <Label className="font-roboto text-sm font-medium">Two-Factor Authentication</Label>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Add an extra layer of security to your account.
            </p>
            {user?.twoFactorAuth?.enabled ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDisable2FA(true)}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowTwoFactorSetup(true)}
              >
                Enable 2FA
              </Button>
            )}

            {showTwoFactorSetup && (
              <TwoFactorSetup
                onComplete={(updatedUser) => {
                  setUser({ ...user, ...updatedUser });
                  setShowTwoFactorSetup(false);
                }}
                onCancel={() => setShowTwoFactorSetup(false)}
              />
            )}

            {showDisable2FA && (
              <DisableTwoFactor
                onComplete={(updatedUser) => {
                  setUser({ ...user, ...updatedUser });
                  setShowDisable2FA(false);
                }}
                onCancel={() => setShowDisable2FA(false)}
              />
            )}
          </div>

          {/* Last Login Info */}
          {profileData?.user?.activity?.lastLogin && (
            <div className="border-t pt-4">
              <Label className="font-roboto text-xs text-gray-600">Last Login</Label>
              <p className="text-xs mt-1">
                {new Date(profileData.user.activity.lastLogin).toLocaleString()}
              </p>
            </div>
          )}

          {/* Phone Verification */}
          <div className="border-t pt-4">
            <PhoneVerification
              phoneNumber={profileData?.user?.profile?.phoneNumber}
              isVerified={profileData?.user?.phoneVerified}
            />
          </div>

          {/* Session Management */}
          <div className="border-t pt-4">
            <SessionManagement />
          </div>

          {/* Trusted Devices */}
          <div className="border-t pt-4">
            <TrustedDevices />
          </div>

          {/* Biometric Authentication */}
          <div className="border-t pt-4">
            <BiometricSetup />
          </div>

          {/* Login History */}
          <div className="border-t pt-4">
            <LoginHistory />
          </div>

          {/* Security Event Log */}
          <div className="border-t pt-4">
            <SecurityEventLog />
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

      {/* Unsaved Changes Confirmation Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have unsaved changes. Leave anyway?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelLeave}>
                Stay
              </Button>
              <Button size="sm" onClick={confirmLeave} className="bg-red-600 hover:bg-red-700 text-white">
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
