"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {  Copy, Check, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useCreateOrder, useCreatePaymentIntent, useValidateCart } from "@/hooks/useCheckout";
import { useAddAddress, useAddresses } from "@/hooks/useAddress";
import { useCountries } from "@/hooks/useCountries";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { Country, State } from "country-state-city";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getCountryFromCurrency } from "@/utils/currency";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
import { toast } from "react-hot-toast";
import { useUserStore } from "@/stores/useUserStore";
import { API_BASE_URL } from "@/utils/config";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentCategory, setPaymentCategory] = useState<"fiat" | "crypto" | "">("");
  const [fiatProvider, setFiatProvider] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [shippingSelectedCountry, setShippingSelectedCountry] = useState("");
  const [shippingSelectedState, setShippingSelectedState] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    type: "shipping" as const,
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    isDefault: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useUserStore();
  const billingAddress = user?.addresses?.find(addr => addr.type === "billing");
  const { data: userCurrencyData } = useUserCurrency();
  
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || "",
    middleName: "",
    lastName: user?.profile?.lastName || "",
    email: user?.email || "",
    address: {
      type: "billing" as const,
      street: billingAddress?.street || "",
      city: billingAddress?.city || "",
      state: billingAddress?.state || "",
      country: billingAddress?.country || "",
      postalCode: billingAddress?.postalCode || "",
      isDefault: true,
    },
  });

  // Auto-populate country from user currency if no address exists
  useEffect(() => {
    if (!billingAddress && userCurrencyData?.currency) {
      const country = getCountryFromCurrency(userCurrencyData.currency);
      if (country) {
        setFormData(prev => ({
          ...prev,
          address: { ...prev.address, country }
        }));
      }
    }
  }, [userCurrencyData, billingAddress]);

  const { items: cartItems, summary: cartSummary, clearCart } = useCartStore();
  const { refetch: validateCart, data: validationData, isLoading: isValidating } = useValidateCart();
  const createOrderMutation = useCreateOrder();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const addAddressMutation = useAddAddress();
  const { data: addressData } = useAddresses();
  const { data: countries = [] } = useCountries();
  const allCountries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const shippingStates = shippingSelectedCountry ? State.getStatesOfCountry(shippingSelectedCountry) : [];

  useEffect(() => {
    if (cartItems.length > 0) {
      validateCart();
    }
  }, []);

  // Handle same as shipping checkbox
  useEffect(() => {
    if (sameAsShipping) {
      const addresses = addressData?.addresses || user?.addresses || [];
      const shippingAddr = addresses.find(addr => addr.type === "shipping" && addr.isDefault);
      if (shippingAddr) {
        const countryObj = allCountries.find(c => c.name === shippingAddr.country);
        if (countryObj) {
          setSelectedCountry(countryObj.isoCode);
          const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(s => s.name === shippingAddr.state);
          if (stateObj) {
            setSelectedState(stateObj.isoCode);
          }
        }
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: shippingAddr.street,
            city: shippingAddr.city,
            state: shippingAddr.state,
            country: shippingAddr.country,
            postalCode: shippingAddr.postalCode,
          }
        }));
      }
    }
  }, [sameAsShipping, addressData, user?.addresses]);

  const checkout = validationData?.checkout;
  const subtotal = checkout?.pricing?.subtotal || 0;
  const shipping = checkout?.pricing?.shipping || 0;
  const tax = checkout?.pricing?.tax || 0;
  const total = checkout?.pricing?.total || 0;
  const currency = checkout?.pricing?.currency || "USD";

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentIntentData, setPaymentIntentData] = useState<any>(null);
  const [showPaymentUI, setShowPaymentUI] = useState(false);
  const [orderProcessingStage, setOrderProcessingStage] = useState<'idle' | 'validating' | 'creating' | 'finalizing' | 'complete' | 'error'>('idle');
  const [showOrderProcessing, setShowOrderProcessing] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async () => {
    if (!formData.address.street || !formData.address.city || !formData.address.state || 
        !formData.address.country || !formData.address.postalCode) {
      toast.error("Please fill in all address fields");
      return;
    }

    try {
      if (sameAsShipping) {
        // Save as both billing and shipping
        await addAddressMutation.mutateAsync({
          address: { ...formData.address, type: "shipping" },
          duplicateForShipping: false
        });
        await addAddressMutation.mutateAsync({
          address: formData.address,
          duplicateForShipping: false
        });
      } else {
        // Save only billing address
        await addAddressMutation.mutateAsync({
          address: formData.address,
          duplicateForShipping: false
        });
      }
      toast.success("Address saved successfully");
    } catch (error) {
      // Error already handled by mutation
    }
  };

    const handleProceedToPayment = async () => {
    if (!user) {
      toast.error("You have to be logged in to proceed to checkout");
      return;
    }

    const addresses = addressData?.addresses || user?.addresses || [];
    const hasShippingAddress = addresses.some(addr => addr.type === "shipping");
    const hasBillingAddress = addresses.some(addr => addr.type === "billing");

    // Validate form
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.address.country ||
      !formData.address.street ||
      !formData.address.city ||
      !formData.address.postalCode
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if user needs to add addresses
    if (!hasShippingAddress) {
      toast.error("Please add a shipping address before proceeding");
      return;
    }

    if (!hasBillingAddress && !sameAsShipping) {
      toast.error("Please add a billing address or mark it as same as shipping");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Add billing address if needed
      if (!hasBillingAddress) {
        await addAddressMutation.mutateAsync({
          address: formData.address,
          duplicateForShipping: false
        });
      }

      const items = checkout?.items?.map((item: any) => {
        const itemData: any = {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        };
        if (item.variantId) itemData.variantId = item.variantId;
        if (item.optionId) itemData.optionId = item.optionId;
        if (item.priceInfo?.exchangeRate) itemData.exchangeRate = item.priceInfo.exchangeRate;
        return itemData;
      }) || [];

      let paymentData: any = {
        type: paymentCategory,
        amount: total,
      };

      if (paymentCategory === 'fiat') {
        if (fiatProvider === 'paystack') {
          // Handle Paystack payment - dynamic import to avoid SSR issues
          const { default: PaystackPop } = await import('@paystack/inline-js');
          
          const response = await fetchWithAuth(`
            ${API_BASE_URL}/payments/paystack/initialize`,
            {
              method: "POST",
              body: JSON.stringify({
                email: user.email,
                amount: total, // Send amount in major units (NGN)
                currency: currency,
                metadata: {
                  items: items.map((item: any) => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    optionId: item.optionId,
                    quantity: item.quantity,
                  })),
                },
              }),
            }
          );

          const data = await response.json();

          if (data.success && data.data.access_code) {
            const popup = new PaystackPop();
            popup.resumeTransaction(data.data.access_code);
            // Note: Order creation will be handled by webhook
          } else {
            toast.error("Failed to initialize Paystack payment");
          }
        } else {
          // Handle Stripe payment
          const response: any = await createPaymentIntentMutation.mutateAsync({
            items,
            paymentMethod: fiatProvider || 'stripe',
          });
          
          if (response.success) {
            setPaymentIntentData({
              clientSecret: response.paymentData.clientSecret,
              paymentIntentId: response.paymentData.paymentIntentId,
              provider: fiatProvider,
              items,
              pricing: { subtotal, shipping, tax, total, currency },
            });
            setShowPaymentUI(true);
          }
        }
      } else if (paymentCategory === 'crypto') {
        const response: any = await createPaymentIntentMutation.mutateAsync({
          items,
          paymentMethod: 'crypto',
          tokenType: 'USDC',
        });
        
        if (response.success) {
          // For crypto, proceed directly to order creation after wallet confirmation
          await handleCreateOrder({
            ...response.paymentData,
            type: 'crypto',
            items,
            pricing: { subtotal, shipping, tax, total, currency },
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to setup payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrder = async (paymentData: any) => {
    // Close Stripe modal immediately after payment success
    setShowPaymentUI(false);
    
    // Show order processing modal
    setShowOrderProcessing(true);
    setOrderProcessingStage('validating');
    
    try {
      // Stage 1: Validating payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const cleanedItems = paymentData.items.map((item: any) => {
        const cleaned: any = {
          productId: item.productId,
          quantity: item.quantity,
        };
        if (item.variantId) cleaned.variantId = item.variantId;
        if (item.optionId) cleaned.optionId = item.optionId;
        return cleaned;
      });

      const paymentType = paymentData.provider || paymentData.type;
      const orderPaymentData: any = {
        type: paymentType,
        amount: paymentData.pricing.total,
      };

      if (paymentType === 'stripe' && paymentData.paymentIntentId) {
        orderPaymentData.paymentIntentId = paymentData.paymentIntentId;
      } else if (paymentType === 'crypto') {
        if (paymentData.token) orderPaymentData.token = paymentData.token;
        if (paymentData.walletAddress) orderPaymentData.walletAddress = paymentData.walletAddress;
      }

      // Stage 2: Creating order
      setOrderProcessingStage('creating');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const orderData = {
        validatedItems: cleanedItems,
        pricing: paymentData.pricing,
        paymentData: orderPaymentData,
        address: {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          country: formData.address.country,
          postalCode: formData.address.postalCode,
          type: formData.address.type,
        },
      };

      const result: any = await createOrderMutation.mutateAsync(orderData);

      if (result.success === false) {
        throw new Error(result.message || 'Order creation failed');
      }

      // Stage 3: Finalizing
      setOrderProcessingStage('finalizing');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (result.order || result.data || result.message === 'Order created successfully') {
        const order = result.order || result.data;
        setOrderId(order._id || order.id);
        
        // Stage 4: Complete
        setOrderProcessingStage('complete');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await clearCart();
        await useCartStore.getState().loadCart();
        const { useUserStore } = await import('@/stores/useUserStore');
        await useUserStore.getState().refreshUser();
        
        // Close processing modal and redirect
        setShowOrderProcessing(false);
        router.push('/home/user/orders');
      }
    } catch (error: any) {
      setOrderProcessingStage('error');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowOrderProcessing(false);
      toast.error(error.message || "An error occurred while creating your order");
    }
  };

  const router = useRouter();

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/home/my-cart" },
    { label: "Checkout", href: null },
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    if (item.href) {
      router.push(item?.href);
    }
  };

  const paymentCategories = [
    { id: 'fiat', name: 'Fiat Currency', icon: CreditCard },
  ];

  const getProviderByCurrency = (currency: string): string => {
    const curr = currency.toLowerCase();
    
    // Map currency to payment provider
    const currencyProviderMap: { [key: string]: string } = {
      // Paystack currencies
      'ngn': 'paystack',
      'ghs': 'paystack',
      'kes': 'paystack',
      'zar': 'paystack',
      'xof': 'paystack',
      // Stripe currencies (major global currencies)
      'usd': 'stripe',
      'eur': 'stripe',
      'gbp': 'stripe',
      'cad': 'stripe',
      'aud': 'stripe',
      'nzd': 'stripe',
      'chf': 'stripe',
      'sek': 'stripe',
      'nok': 'stripe',
      'dkk': 'stripe',
      'jpy': 'stripe',
      'sgd': 'stripe',
      'hkd': 'stripe',
      'inr': 'stripe',
      'myr': 'stripe',
      'php': 'stripe',
      'thb': 'stripe',
      'brl': 'stripe',
      'mxn': 'stripe',
      'pln': 'stripe',
      'czk': 'stripe',
      'huf': 'stripe',
      'ron': 'stripe',
      'ils': 'stripe',
      'aed': 'stripe',
      'sar': 'stripe',
      // Airwallex for China
      'cny': 'airwallex',
    };
    
    return currencyProviderMap[curr] || 'stripe';
  };

  useEffect(() => {
    if (currency && paymentCategory === 'fiat') {
      // Use detected currency from backend if available, otherwise use checkout currency
      const detectedCurrency = userCurrencyData?.currency || currency;
      const provider = getProviderByCurrency(detectedCurrency.toLowerCase());
      setFiatProvider(provider);
    }
  }, [currency, paymentCategory, userCurrencyData]);

  return (
    <>
     
      <div className="min-h-screen font-roboto bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-8 md:py-8 lg:py-10 font-roboto">
          {/* Breadcrumb */}
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            {/* Billing Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-3 md:p-6">
                <h2 className="text-base md:text-lg font-bold mb-1 md:mb-2">Billing Information</h2>
                <p className="text-gray-600 mb-3 md:mb-6 text-sm md:text-base ">
                  Provide your billing information to proceed
                </p>

                <div className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="middleName">
                        Middle Name{" "}
                        <span className="text-gray-400">(Optional)</span>
                      </Label>
                      <Input
                        id="middleName"
                        placeholder="Enter your middle name"
                        value={formData.middleName}
                        onChange={(e) =>
                          handleInputChange("middleName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>

                  {/* Address Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={selectedCountry}
                        onValueChange={(countryCode) => {
                          setSelectedCountry(countryCode);
                          setSelectedState("");
                          const country = allCountries.find(c => c.isoCode === countryCode);
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, country: country?.name || "", state: "" }
                          }));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCountries.map((country) => (
                            <SelectItem key={country.isoCode} value={country.isoCode}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={selectedState}
                        onValueChange={(stateCode) => {
                          setSelectedState(stateCode);
                          const state = states.find(s => s.isoCode === stateCode);
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, state: state?.name || "" }
                          }));
                        }}
                        disabled={!selectedCountry}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose your state" />
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
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        placeholder="Enter your Postal Code"
                        value={formData.address.postalCode}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, postalCode: e.target.value }
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Street Address and City */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        placeholder="Enter your street address"
                        value={formData.address.street}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, street: e.target.value }
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Enter your city"
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value }
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Save Address Button */}
                  <Button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={addAddressMutation.isPending}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                  >
                    {addAddressMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Billing Address"
                    )}
                  </Button>

                  {/* Same as Shipping Checkbox */}
                  <div className="mt-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        title="Mark billing address as the same"
                        id="sameAsShipping"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="sameAsShipping" className="cursor-pointer">
                        Billing address is the same as shipping address
                      </Label>
                    </div>
                    {!sameAsShipping && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowShippingModal(true)}
                        className="mt-4"
                      >
                        Add Shipping Address
                      </Button>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-2">Payment Method</h3>
                  <p className="text-gray-600 mb-6">
                    Choose your preferred payment method
                  </p>

                  <RadioGroup
                    value={paymentCategory}
                    onValueChange={(value: any) => {
                      setPaymentCategory(value);
                      setPaymentMethod(value);
                      if (value === 'fiat') {
                        const provider = getProviderByCurrency(currency);
                        setFiatProvider(provider);
                      }
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {paymentCategories.map((category) => (
                        <div key={category.id}>
                          <RadioGroupItem
                            value={category.id}
                            id={category.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={category.id}
                            className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 peer-checked:border-blue-500 peer-checked:bg-blue-50"
                          >
                            <category.icon className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium text-center">
                              {category.name}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {paymentCategory === 'fiat' && fiatProvider && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        Payment provider: <span className="font-semibold capitalize">{fiatProvider}</span>
                      </p>
                    </div>
                  )}

                  {/* Bank Transfer Details */}
                  {/* {paymentMethod === "bank-transfer" && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="text-center mb-4">
                        <p className="font-medium">
                          Transfer ₦{total.toLocaleString()} to Vendor's
                          Checkout
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Bank Name
                          </Label>
                          <div className="mt-1 p-3 bg-white rounded border">
                            Vendor's Account
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Account Number
                          </Label>
                          <div className="mt-1 p-3 bg-white rounded border flex items-center justify-between">
                            <span>0202020202020</span>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Amount</Label>
                          <div className="mt-1 p-3 bg-white rounded border flex items-center justify-between">
                            <span>₦ {total.toLocaleString()}</span>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-blue-600 mt-4">
                        This account is for this transaction only and expires in
                        29:00
                      </p>
                    </div>
                  )} */}

                  {/* Card Payment Details */}
                  {/* {paymentMethod === "card" && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Card Payment</h4>
                        <Button
                          variant="link"
                          className="text-blue-600 p-0 h-auto"
                        >
                          Change
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded border">
                        <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          MC
                        </div>
                        <span>123 **** **** **** **65</span>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className=" border-0 shadow-none">
                <CardContent className="p-4 border-0 shadow-none">
                  <h3 className="font-bold text-base md:text-lg mb-4">Order Summary</h3>

                  {isValidating ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Order Items */}
                      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                        {checkout?.items?.map((item: any) => (
                          <div
                            key={`${item.productId}-${item.variantId || 'no-variant'}-${item.optionId || 'no-option'}`}
                            className="flex items-center space-x-3"
                          >
                            <Image
                              src={item.productImage || "/placeholder.svg"}
                              alt={item.productName}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight">
                                {item.productName}
                              </p>
                              <p className="text-xs text-blue-600">
                                {item.quantity} x {currency} {item.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Totals */}
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex justify-between">
                          <span>Sub Total:</span>
                          <span>{currency} {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>{currency} {shipping.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{currency} {tax.toLocaleString()}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold text-lg">
                          <span>TOTAL:</span>
                          <span>{currency} {total.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 mt-6">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleProceedToPayment}
                      disabled={isProcessing || cartItems.length === 0}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Proceed to Payment"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Success Modal */}
          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent className="sm:max-w-md">
              <div className="flex flex-col items-center text-center p-4 md:p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-2">
                  Order Placed Successfully
                </h3>
                <p className="text-gray-600 mb-6 text-sm ">
                  Your Order has been placed successfully. Click Track Order to
                  check progress
                </p>
                <div className="space-y-3 w-full">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/home/user/orders')}
                  >
                    View Orders
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                    onClick={() => router.push('/home')}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Shipping Address Modal */}
          <Dialog open={showShippingModal} onOpenChange={setShowShippingModal}>
            <DialogContent className="sm:max-w-md">
              <div className="p-4 md:p-6">
                <h3 className="text-base md:text-xl font-bold mb-4">Add Shipping Address</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shipStreet">Street Address</Label>
                    <Input
                      id="shipStreet"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipCity">City</Label>
                      <Input
                        id="shipCity"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipPostalCode">Postal Code</Label>
                      <Input
                        id="shipPostalCode"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipCountry">Country</Label>
                      <Select
                        value={shippingSelectedCountry}
                        onValueChange={(countryCode) => {
                          setShippingSelectedCountry(countryCode);
                          setShippingSelectedState("");
                          const country = allCountries.find(c => c.isoCode === countryCode);
                          setShippingAddress(prev => ({ ...prev, country: country?.name || "", state: "" }));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose country" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCountries.map((country) => (
                            <SelectItem key={country.isoCode} value={country.isoCode}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="shipState">State</Label>
                      <Select
                        value={shippingSelectedState}
                        onValueChange={(stateCode) => {
                          setShippingSelectedState(stateCode);
                          const state = shippingStates.find(s => s.isoCode === stateCode);
                          setShippingAddress(prev => ({ ...prev, state: state?.name || "" }));
                        }}
                        disabled={!shippingSelectedCountry}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose state" />
                        </SelectTrigger>
                        <SelectContent>
                          {shippingStates.map((state) => (
                            <SelectItem key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => setShowShippingModal(false)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Save Address
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowShippingModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        

           {/* Stripe Payment Modal */}
                    <Dialog open={showPaymentUI} onOpenChange={setShowPaymentUI}>
                      <DialogContent className="sm:max-w-md">
                        <div className="relative p-4 md:p-6">
                          {isProcessing && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                                <p className="text-sm text-gray-600">Creating your order...</p>
                              </div>
                            </div>
                          )}
                          <h3 className="text-sm md:text-lg font-bold mb-4">Complete Payment</h3>
                          {paymentIntentData?.clientSecret && (
                            <Elements stripe={stripePromise}>
                              <StripePaymentForm
                                clientSecret={paymentIntentData.clientSecret}
                                amount={paymentIntentData.pricing.total}
                                currency={paymentIntentData.pricing.currency}
                                onSuccess={(paymentIntentId) => {
                                  handleCreateOrder({
                                    ...paymentIntentData,
                                    type: 'fiat',
                                    paymentIntentId,
                                  });
                                }}
                                onCancel={() => {
                                  setShowPaymentUI(false);
                                  setIsProcessing(false);
                                }}
                              />
                            </Elements>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

          {/* Order Processing Modal */}
          <Dialog open={showOrderProcessing} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
              <div className="p-4 md:p-6">
                <div className="flex flex-col items-center text-center">
                  {orderProcessingStage === 'validating' && (
                    <>
                      <div className="w-14 h-14 md:w-20 md:h-20 mb-6 relative">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 md:w-8 md:h-8 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Validating Payment</h3>
                      <p className="text-sm md:text-base text-gray-600">Confirming your payment details...</p>
                    </>
                  )}

                  {orderProcessingStage === 'creating' && (
                    <>
                      <div className="w-14 h-14 md:w-20 md:h-20 mb-6 relative">
                        <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 md:w-8 md:h-8 text-blue-600 animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Creating Your Order</h3>
                      <p className="text-sm md:text-base text-gray-600">Setting up your order details...</p>
                      <div className="mt-2 md:mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-primary h-full rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                    </>
                  )}

                  {orderProcessingStage === 'finalizing' && (
                    <>
                      <div className="w-14 h-14 md:w-20 md:h-20 mb-6 relative">
                        <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-5 h-5 md:w-8 md:h-8 text-orange-600 animate-bounce" />
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Finalizing Order</h3>
                      <p className="text-sm md:text-base text-gray-600">Almost there! Completing your purchase...</p>
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-orange-600 h-full rounded-full animate-pulse" style={{width: '90%'}}></div>
                      </div>
                    </>
                  )}

                  {orderProcessingStage === 'complete' && (
                    <>
                      <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center animate-scale-in">
                        <Check className="w-5 h-5 md:w-8 md:h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-2 text-blue-600">Order Created!</h3>
                      <p className="text-sm md:text-base text-gray-600">Your order has been successfully placed</p>
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{width: '100%'}}></div>
                      </div>
                    </>
                  )}

                  {orderProcessingStage === 'error' && (
                    <>
                      <div className="w-20 h-20 mb-6 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-2 text-red-600">Order Failed</h3>
                      <p className="text-sm md:text-base text-gray-600">Something went wrong. Please try again.</p>
                    </>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
