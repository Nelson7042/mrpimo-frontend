"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {  Copy, Check, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BreadcrumbItem, Breadcrumbs } from "@/components/BreadCrumbs";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useCreateOrder, useCreatePaymentIntent, useValidateCart, useCalculateShipping } from "@/hooks/useCheckout";
import { useBuyNowShippingEstimate } from "@/hooks/useBuyNowShippingEstimate";
import { useBuyNowCheckout } from "@/hooks/useBuyNowCheckout";
import { useDeliveryOptions } from "@/hooks/useDeliveryOptions";
import DeliveryOptions, { DeliveryOptionItem } from "@/components/checkout/DeliveryOptions";
import { useAddAddress, useAddresses, useUpdateAddress } from "@/hooks/useAddress";
import { useCountries } from "@/hooks/useCountries";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { useInvalidateWalletBalance } from "@/hooks/useWallet";
import { Country, State } from "country-state-city";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getCountryFromCurrency } from "@/utils/currency";
import { getProviderByCurrency } from "@/utils/paymentProvider";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
import { toast } from "react-hot-toast";
import { useUserStore } from "@/stores/useUserStore";
import { API_BASE_URL } from "@/utils/config";

export default function CheckoutPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentCategory, setPaymentCategory] = useState<"fiat" | "crypto" | "">("");
  const [fiatProvider, setFiatProvider] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddShippingModal, setShowAddShippingModal] = useState(false);
  const [newShippingAddress, setNewShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [newAddressCountry, setNewAddressCountry] = useState("");
  const [newAddressState, setNewAddressState] = useState("");
  const { user } = useUserStore();
  const billingAddress = user?.addresses?.find(addr => addr.type === "billing");
  const { data: userCurrencyData } = useUserCurrency();

  // --- Buy Now Mode Detection ---
  const [buyNowData, setBuyNowData] = useState<any>(null);
  // Track whether we've finished reading sessionStorage so the auth check
  // doesn't fire before buyNowData is resolved (race condition fix).
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isBuyNowMode = !!buyNowData;

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("buyNowData");
      if (stored) {
        setBuyNowData(JSON.parse(stored));
      }
    } catch {
      // Not in buy-now mode
    } finally {
      setSessionLoaded(true);
    }
  }, []);

  // Buy Now hooks
  const buyNowShippingMutation = useBuyNowShippingEstimate();
  const buyNowCheckout = useBuyNowCheckout();
  const invalidateWalletBalance = useInvalidateWalletBalance();

  // Check if user is authorized to access checkout.
  // Only runs after sessionStorage has been read so buyNowData is accurate.
  useEffect(() => {
    if (!sessionLoaded) return;

    const checkAuthorization = () => {
      // In buy-now mode, check buyNowCheckoutAuthorized instead
      const authKey = buyNowData ? 'buyNowCheckoutAuthorized' : 'checkoutAuthorized';
      const authorized = sessionStorage.getItem(authKey);
      const timestamp = sessionStorage.getItem('checkoutTimestamp');
      
      if (!authorized || !timestamp) {
        toast.error(buyNowData
          ? "Please initiate Buy Now from the product page"
          : "Please validate your cart before proceeding to checkout");
        router.replace(buyNowData ? "/home" : "/home/my-cart");
        return;
      }
      
      // Check if authorization is still valid (expires after 30 minutes)
      const authTime = parseInt(timestamp, 10);
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (now - authTime > thirtyMinutes) {
        sessionStorage.removeItem(authKey);
        sessionStorage.removeItem('checkoutTimestamp');
        toast.error(buyNowData
          ? "Your checkout session has expired. Please try again."
          : "Your checkout session has expired. Please validate your cart again.");
        router.replace(buyNowData ? "/home" : "/home/my-cart");
        return;
      }
      
      setIsAuthorized(true);
    };
    
    checkAuthorization();
  }, [router, buyNowData, sessionLoaded]);
  
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

  // Populate form data when user or billing address loads
  useEffect(() => {
    if (user || billingAddress) {
      setFormData(prev => ({
        firstName: user?.profile?.firstName || prev.firstName,
        middleName: prev.middleName,
        lastName: user?.profile?.lastName || prev.lastName,
        email: user?.email || prev.email,
        address: {
          type: "billing" as const,
          street: billingAddress?.street || prev.address.street,
          city: billingAddress?.city || prev.address.city,
          state: billingAddress?.state || prev.address.state,
          country: billingAddress?.country || prev.address.country,
          postalCode: billingAddress?.postalCode || prev.address.postalCode,
          isDefault: true,
        },
      }));
    }
  }, [user, billingAddress]);

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
  const calculateShippingMutation = useCalculateShipping();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const { data: addressData } = useAddresses();
  const { data: countries = [] } = useCountries();
  const allCountries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];

  // Populate country and state dropdowns when billing address exists
  useEffect(() => {
    if (billingAddress) {
      const countryObj = allCountries.find(c => c.name === billingAddress.country);
      if (countryObj) {
        setSelectedCountry(countryObj.isoCode);
        const countryStates = State.getStatesOfCountry(countryObj.isoCode);
        const stateObj = countryStates.find(s => s.name === billingAddress.state);
        if (stateObj) {
          setSelectedState(stateObj.isoCode);
        }
      }
    }
  }, [billingAddress]);

  // Get user's shipping addresses
  const allShippingAddresses = (addressData?.addresses || user?.addresses || []).filter(
    (addr: any) => addr.type === "shipping"
  );
  const userShippingAddress = allShippingAddresses.find((addr: any) => addr.isDefault) || allShippingAddresses[0];
  const hasShippingAddress = !!userShippingAddress;

  // Handle setting a shipping address as default from checkout
  const handleSetDefaultShipping = (address: any) => {
    updateAddressMutation.mutate({ ...address, isDefault: true });
  };

  useEffect(() => {
    if (!isBuyNowMode && cartItems.length > 0) {
      validateCart();
    }
  }, [cartItems.length, isBuyNowMode, userShippingAddress?._id]);

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

        // Create billing address from shipping address
        const billingAddressData = {
          type: "billing" as const,
          street: shippingAddr.street,
          city: shippingAddr.city,
          state: shippingAddr.state,
          country: shippingAddr.country,
          postalCode: shippingAddr.postalCode,
          isDefault: true,
        };

        // Check if billing address already exists
        const existingBillingAddr = addresses.find(addr => addr.type === "billing");
        if (!existingBillingAddr && !addAddressMutation.isPending) {
          addAddressMutation.mutate({
            address: billingAddressData,
            duplicateForShipping: false
          }, {
            onError: () => {
              // Silently ignore "already exists" errors — billing address is already set
            }
          });
        }
      }
    }
  }, [sameAsShipping, addressData, user?.addresses]);

  const checkout = isBuyNowMode ? null : validationData?.checkout;
  const subtotal = isBuyNowMode ? (buyNowData?.pricing?.subtotal || 0) : (checkout?.pricing?.subtotal || 0);
  const baseShipping = isBuyNowMode ? (buyNowData?.pricing?.shipping || 0) : (checkout?.pricing?.shipping || 0);
  const tax = isBuyNowMode ? (buyNowData?.pricing?.tax || 0) : (checkout?.pricing?.tax || 0);
  const currency = isBuyNowMode ? (buyNowData?.pricing?.currency || "USD") : (checkout?.pricing?.currency || "USD");
  const currencySymbol = isBuyNowMode ? (buyNowData?.pricing?.currencySymbol || currency) : currency;
  const deliveryOptions = isBuyNowMode ? null : checkout?.deliveryOptions;

  // Compute hasExactLocation for both modes
  const hasExactLocation = isBuyNowMode
    ? !!(userShippingAddress?.coordinates?.latitude && userShippingAddress?.coordinates?.longitude)
    : !!deliveryOptions?.hasExactLocation;

  // Delivery method state - must be declared before useEffects that reference it
  const [deliveryMethod, setDeliveryMethod] = useState<string>("");
  
  // Carrier-aware delivery options state (cart mode)
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOptionItem | null>(null);
  const [carrierDeliveryOptions, setCarrierDeliveryOptions] = useState<DeliveryOptionItem[]>([]);
  const [deliveryOptionsError, setDeliveryOptionsError] = useState<string | null>(null);
  const deliveryOptionsMutation = useDeliveryOptions();
  
  // Use calculated shipping if available, otherwise use base shipping
  const [calculatedShipping, setCalculatedShipping] = useState<number | null>(null);
  const [shippingEstimatedDays, setShippingEstimatedDays] = useState<string>('5-7 business days');
  const [shippingWarnings, setShippingWarnings] = useState<string[]>([]);
  const [shippingIsFallback, setShippingIsFallback] = useState(false);
  const shipping = calculatedShipping !== null ? calculatedShipping : baseShipping;

  // Tax info from backend (updated after payment intent response)
  const [taxName, setTaxName] = useState<string>("Tax");
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isTaxInclusive, setIsTaxInclusive] = useState<boolean>(false);
  const [calculatedTax, setCalculatedTax] = useState<number | null>(null);
  const effectiveTax = calculatedTax !== null ? calculatedTax : tax;
  const total = isTaxInclusive ? subtotal + shipping : subtotal + effectiveTax + shipping;

  // Set default delivery method based on user's location capabilities
  useEffect(() => {
    if (!deliveryMethod) {
      if (isBuyNowMode) {
        // In buy-now mode, default to pickup since we don't have deliveryOptions from cart validation
        const hasExactLocation = userShippingAddress?.coordinates?.latitude && userShippingAddress?.coordinates?.longitude;
        setDeliveryMethod(hasExactLocation ? 'standard' : 'pickup');
      } else if (deliveryOptions) {
        // Cart mode: use delivery options from cart validation
        setDeliveryMethod(deliveryOptions.hasExactLocation ? 'standard' : 'pickup');
      }
    }
  }, [deliveryOptions, deliveryMethod, isBuyNowMode, userShippingAddress]);

  // Fetch carrier-aware delivery options when in cart mode and shipping address is available
  useEffect(() => {
    if (isBuyNowMode || !userShippingAddress || !checkout?.items?.length) return;

    // Build origin from first item's vendor location (use platform default if not available)
    // The backend delivery-options endpoint handles origin resolution internally
    const destination = {
      country: userShippingAddress.country || "",
      state: userShippingAddress.state || "",
      city: userShippingAddress.city || "",
      latitude: userShippingAddress.coordinates?.latitude || null,
      longitude: userShippingAddress.coordinates?.longitude || null,
    };

    const items = checkout.items.map((item: any) => ({
      weight: item.weight || 1,
      quantity: item.quantity,
      description: item.productName || "",
    }));

    setDeliveryOptionsError(null);
    deliveryOptionsMutation.mutate(
      {
        origin: {
          country: userShippingAddress.country || "",
          state: userShippingAddress.state || "",
          city: userShippingAddress.city || "",
        },
        destination,
        items,
      },
      {
        onSuccess: (data) => {
          if (data.success && data.deliveryOptions?.length) {
            setCarrierDeliveryOptions(data.deliveryOptions);
            // Auto-select first option with valid pricing, or station_pickup as fallback
            const defaultOption = data.deliveryOptions.find(
              (opt) => opt.price && (data.hasCoordinates ? opt.id === "home_standard" : opt.id === "station_pickup")
            ) || data.deliveryOptions.find((opt) => opt.price) || data.deliveryOptions[0];
            if (defaultOption) {
              setSelectedDeliveryOption(defaultOption);
              setDeliveryMethod(defaultOption.id === "station_pickup" ? "pickup" : defaultOption.id === "home_express" ? "express" : "standard");
              if (defaultOption.price) {
                setCalculatedShipping(defaultOption.price.amount);
              }
            }
          } else {
            setDeliveryOptionsError(data.message || "No delivery options available");
          }
        },
        onError: (error: Error) => {
          setDeliveryOptionsError(error.message || "Failed to load delivery options");
        },
      }
    );
  }, [isBuyNowMode, userShippingAddress?._id, checkout?.items?.length]);

  // Calculate shipping when delivery method or default address changes
  useEffect(() => {
    if (isBuyNowMode && deliveryMethod && buyNowData) {
      // Buy Now mode: use buy-now shipping estimate
      setShippingWarnings([]);
      setShippingIsFallback(false);
      buyNowShippingMutation.mutate(
        {
          productId: buyNowData.productId,
          variantId: buyNowData.variantId,
          optionId: buyNowData.optionId,
          quantity: buyNowData.quantity,
          addressId: userShippingAddress?._id,
          deliveryMethod,
        },
        {
          onSuccess: (data) => {
            if (data.success && data.estimate) {
              setCalculatedShipping(data.estimate.shippingCost);
              setShippingEstimatedDays(data.estimate.estimatedDays || '5-7 business days');
              setShippingWarnings(data.estimate.warnings || []);
              setShippingIsFallback((data.estimate.estimationType as string) === 'fallback');
            }
          },
        }
      );
    } else if (!isBuyNowMode && deliveryMethod && cartItems.length > 0) {
      // Cart mode: use cart shipping calculation
      calculateShippingMutation.mutate(deliveryMethod, {
        onSuccess: (data) => {
          if (data.success && data.shipping) {
            setCalculatedShipping(data.shipping.cost);
            setShippingEstimatedDays(data.shipping.estimatedDays || '5-7 business days');
          }
        }
      });
    }
  }, [deliveryMethod, isBuyNowMode, userShippingAddress?._id]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentIntentData, setPaymentIntentData] = useState<any>(null);
  const [showPaymentUI, setShowPaymentUI] = useState(false);
  const [orderProcessingStage, setOrderProcessingStage] = useState<'idle' | 'validating' | 'creating' | 'finalizing' | 'complete' | 'error'>('idle');
  const [showOrderProcessing, setShowOrderProcessing] = useState(false);

  // Sync buy-now checkout stage with order processing modal
  useEffect(() => {
    if (isBuyNowMode && buyNowCheckout.stage !== 'idle') {
      setOrderProcessingStage(buyNowCheckout.stage);
      setShowOrderProcessing(true);
      if (buyNowCheckout.stage === 'complete') {
        // Cleanup and redirect after completion
        sessionStorage.removeItem('buyNowData');
        sessionStorage.removeItem('buyNowCheckoutAuthorized');
        sessionStorage.removeItem('checkoutTimestamp');
        setTimeout(() => {
          setShowOrderProcessing(false);
          router.push('/home/user/orders');
        }, 1500);
      }
      if (buyNowCheckout.stage === 'error') {
        setTimeout(() => {
          setShowOrderProcessing(false);
          buyNowCheckout.resetStage();
        }, 2000);
      }
    }
  }, [isBuyNowMode, buyNowCheckout.stage, router]);

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
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
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

    if (!deliveryMethod) {
      toast.error("Please select a delivery method");
      return;
    }

    // Cart mode: validate carrier-aware delivery option selection and pricing
    if (!isBuyNowMode) {
      if (!selectedDeliveryOption) {
        toast.error("Please select a delivery option");
        return;
      }
      if (!selectedDeliveryOption.price) {
        toast.error("Shipping cost could not be calculated. Please select a different delivery option.");
        return;
      }
      if (deliveryOptionsError) {
        toast.error("Shipping cost cannot be calculated. Please try again.");
        return;
      }
    }

    // Cart mode: check cart items; Buy Now mode: check buyNowData
    if (isBuyNowMode) {
      if (!buyNowData) {
        toast.error("Buy Now data is missing");
        return;
      }
    } else {
      if (cartItems.length === 0) {
        toast.error("Your cart is empty");
        return;
      }
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

      if (isBuyNowMode) {
        // --- Buy Now Payment Flow ---
        const shippingAddr = addresses.find(addr => addr.type === 'shipping');

        if (paymentCategory === 'fiat') {
          let piResponse;
          
          if (buyNowData.isOfferCheckout && buyNowData.offerId) {
            // Offer checkout — use offer-specific endpoint with locked price
            piResponse = await buyNowCheckout.initiateOfferCheckout({
              offerId: buyNowData.offerId,
              paymentMethod: fiatProvider || 'stripe',
              addressId: shippingAddr?._id,
              deliveryMethod,
            });
          } else {
            // Regular buy-now checkout
            piResponse = await buyNowCheckout.initiateCheckout({
              productId: buyNowData.productId,
              variantId: buyNowData.variantId,
              optionId: buyNowData.optionId,
              quantity: buyNowData.quantity,
              paymentMethod: fiatProvider || 'stripe',
              addressId: shippingAddr?._id,
              deliveryMethod,
            });
          }

          if (!piResponse) {
            setIsProcessing(false);
            return;
          }

          // Update tax info from backend response
          if (piResponse.checkout?.pricing) {
            const p = piResponse.checkout.pricing;
            if (p.taxName) setTaxName(p.taxName);
            if (p.taxRate !== undefined) setTaxRate(p.taxRate);
            if (p.isTaxInclusive !== undefined) setIsTaxInclusive(p.isTaxInclusive);
            if (p.tax !== undefined) setCalculatedTax(p.tax);
            if (p.shipping !== undefined) setCalculatedShipping(p.shipping);
          }

          if (fiatProvider === 'paystack') {
            // Paystack redirect flow
            await buyNowCheckout.initializePaystackPayment(piResponse);
          } else {
            // Stripe flow - show Stripe modal
            if (piResponse.paymentData?.clientSecret) {
              setPaymentIntentData({
                clientSecret: piResponse.paymentData.clientSecret,
                paymentIntentId: piResponse.paymentData.paymentIntentId,
                provider: fiatProvider,
                items: piResponse.checkout.items,
                pricing: piResponse.checkout.pricing,
                orderId: piResponse.orderId,
                isBuyNow: true,
              });
              setShowPaymentUI(true);
            }
          }
        }
      } else {
        // --- Cart Payment Flow (existing) ---
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
          
          // Get shipping and billing addresses
          const shippingAddr = addresses.find(addr => addr.type === 'shipping');
          const billingAddr = sameAsShipping ? shippingAddr : addresses.find(addr => addr.type === 'billing');
          
          const response = await fetchWithAuth(`
            ${API_BASE_URL}/checkout/paystack/initialize`,
            {
              method: "POST",
              body: JSON.stringify({
                items: items.map((item: any) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  optionId: item.optionId,
                  quantity: item.quantity,
                })),
                pricing: { subtotal, shipping, tax, total, currency },
                deliveryMethod, // Pass user's selected delivery method
                deliveryOption: selectedDeliveryOption ? {
                  optionId: selectedDeliveryOption.id,
                  label: selectedDeliveryOption.label,
                  carrierParams: selectedDeliveryOption.carrierParams,
                } : undefined,
                address: {
                  street: shippingAddr?.street,
                  city: shippingAddr?.city,
                  state: shippingAddr?.state,
                  country: shippingAddr?.country,
                  postalCode: shippingAddr?.postalCode,
                  type: 'shipping',
                },
              }),
            }
          );

          const data = await response.json();

          if (data.success && (data.data?.authorization_url || data.authorization_url) && data.orderId) {
            // Backend already sets callback_url - use authorization_url directly
            // Do NOT append callback_url again to avoid duplication
            const authorizationUrl = data.data?.authorization_url || data.authorization_url;
            
            // Redirect to Paystack checkout page
            window.location.href = authorizationUrl;
          } else {
            toast.error(data.message || "Failed to initialize Paystack payment");
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
      
      const orderData: any = {
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

      // Include selected delivery option with carrierParams for order creation
      if (selectedDeliveryOption) {
        orderData.deliveryOption = {
          optionId: selectedDeliveryOption.id,
          label: selectedDeliveryOption.label,
          carrierParams: selectedDeliveryOption.carrierParams,
        };
      }

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
        invalidateWalletBalance();
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Clear checkout authorization
        sessionStorage.removeItem('checkoutAuthorized');
        sessionStorage.removeItem('checkoutTimestamp');
        
        // Buy Now mode cleanup
        if (isBuyNowMode) {
          sessionStorage.removeItem('buyNowData');
          sessionStorage.removeItem('buyNowCheckoutAuthorized');
        } else {
          await clearCart();
          await useCartStore.getState().loadCart();
        }
        
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

  // Auto-detect payment method and provider on page load
  useEffect(() => {
    const detectedCurrency = userCurrencyData?.currency || currency;
    if (detectedCurrency) {
      setPaymentCategory('fiat');
      setPaymentMethod('fiat');
      const provider = getProviderByCurrency(detectedCurrency.toLowerCase());
      setFiatProvider(provider);
    }
  }, [currency, userCurrencyData]);

  // Show loading while checking authorization
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Verifying checkout access...</p>
        </div>
      </div>
    );
  }

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
                      <SearchableSelect
                        options={allCountries.map((country) => ({
                          value: country.isoCode,
                          label: country.name,
                        }))}
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
                        placeholder="Choose your country"
                        searchPlaceholder="Search country..."
                        className="mt-1"
                        emptyMessage="No countries found"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <SearchableSelect
                        options={states.map((state) => ({
                          value: state.isoCode,
                          label: state.name,
                        }))}
                        value={selectedState}
                        onValueChange={(stateCode) => {
                          setSelectedState(stateCode);
                          const state = states.find(s => s.isoCode === stateCode);
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, state: state?.name || "" }
                          }));
                        }}
                        placeholder="Choose your state/province"
                        searchPlaceholder="Search state/province..."
                        disabled={!selectedCountry}
                        className="mt-1"
                        emptyMessage="No states found"
                      />
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

                  {/* Same as Shipping Checkbox - Only show if user has shipping address */}
                  {hasShippingAddress && (
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
                    </div>
                  )}
                </div>

                {/* Shipping Address Selection */}
                {hasShippingAddress && (
                  <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Shipping Address
                    </h3>
                    <div className="space-y-2">
                      {allShippingAddresses.map((addr: any) => (
                        <div
                          key={addr._id}
                          className={`flex items-start justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                            addr.isDefault
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (!addr.isDefault) handleSetDefaultShipping(addr);
                          }}
                        >
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <input
                              type="radio"
                              name="shippingAddress"
                              checked={addr.isDefault}
                              onChange={() => {
                                if (!addr.isDefault) handleSetDefaultShipping(addr);
                              }}
                              className="mt-1 w-3.5 h-3.5 text-blue-600"
                              aria-label={`Select shipping address: ${addr.street}, ${addr.city}`}
                            />
                            <div className="text-xs text-gray-700 space-y-0.5">
                              <p className="font-medium">{addr.street}</p>
                              <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                              <p>{addr.country}</p>
                            </div>
                          </div>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {updateAddressMutation.isPending && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Updating default address...
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddShippingModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-block"
                    >
                      + Add new shipping address
                    </button>
                  </div>
                )}

                {/* No-address warning - only shown in buy-now mode */}
                {isBuyNowMode && !hasShippingAddress && (
                  <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                    <h3 className="text-sm font-semibold mb-1 text-yellow-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                      Shipping Address Required
                    </h3>
                    <p className="text-xs text-yellow-700 mb-1.5">
                      You need a shipping address before you can complete this purchase.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddShippingModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Add a shipping address →
                    </button>
                  </div>
                )}

                {/* Delivery Method Selection - Before Payment */}
                <div className="mt-6">
                  {isBuyNowMode ? (
                    // Buy Now mode: simple delivery method selection (no carrier-aware pricing)
                    <>
                      <h3 className="text-sm font-semibold mb-1">Delivery Method</h3>
                      <p className="text-xs text-gray-600 mb-3">
                        Choose how you want to receive your order
                      </p>

                      <RadioGroup
                        value={deliveryMethod}
                        onValueChange={setDeliveryMethod}
                        className="space-y-2"
                      >
                        {/* Pickup Option - Always available */}
                        <div className={`flex items-start space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${deliveryMethod === 'pickup' ? 'border-blue-500 bg-blue-50' : ''}`}>
                          <RadioGroupItem value="pickup" id="pickup" className="mt-0.5" />
                          <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                            <p className="text-sm font-medium">Station Pickup</p>
                            <p className="text-xs text-gray-500">Pick up at nearest GIG station (5-7 business days)</p>
                          </Label>
                        </div>

                        {/* Standard Delivery - Only if user has exact location */}
                        <div className={`flex items-start space-x-2 p-3 border rounded-lg ${
                          hasExactLocation 
                            ? `hover:bg-gray-50 cursor-pointer ${deliveryMethod === 'standard' ? 'border-blue-500 bg-blue-50' : ''}`
                            : 'opacity-50 cursor-not-allowed bg-gray-50'
                        }`}>
                          <RadioGroupItem 
                            value="standard" 
                            id="standard" 
                            className="mt-0.5"
                            disabled={!hasExactLocation}
                          />
                          <Label htmlFor="standard" className="flex-1 cursor-pointer">
                            <p className="text-sm font-medium">Standard Delivery</p>
                            <p className="text-xs text-gray-500">
                              {hasExactLocation 
                                ? 'Delivered to your address (5-7 business days)'
                                : 'Add exact location to enable home delivery'}
                            </p>
                          </Label>
                        </div>

                        {/* Express Delivery - Only if user has exact location */}
                        <div className={`flex items-start space-x-2 p-3 border rounded-lg ${
                          hasExactLocation 
                            ? `hover:bg-gray-50 cursor-pointer ${deliveryMethod === 'express' ? 'border-blue-500 bg-blue-50' : ''}`
                            : 'opacity-50 cursor-not-allowed bg-gray-50'
                        }`}>
                          <RadioGroupItem 
                            value="express" 
                            id="express" 
                            className="mt-0.5"
                            disabled={!hasExactLocation}
                          />
                          <Label htmlFor="express" className="flex-1 cursor-pointer">
                            <p className="text-sm font-medium">Express Delivery</p>
                            <p className="text-xs text-gray-500">
                              {hasExactLocation 
                                ? 'Fast delivery (2-3 business days)'
                                : 'Add exact location to enable express delivery'}
                            </p>
                          </Label>
                        </div>
                      </RadioGroup>

                      {!hasExactLocation && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800">
                            💡 Add your exact location in{' '}
                            <button
                              type="button"
                              onClick={() => setShowAddShippingModal(true)}
                              className="text-blue-600 underline"
                            >
                              shipping settings
                            </button>
                            {' '}to unlock home delivery options.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Cart mode: carrier-aware delivery options with real pricing
                    <>
                      {deliveryOptionsError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                          <p className="text-xs text-red-700">{deliveryOptionsError}</p>
                        </div>
                      )}
                      <DeliveryOptions
                        options={carrierDeliveryOptions}
                        hasExactLocation={hasExactLocation}
                        selectedOptionId={selectedDeliveryOption?.id || ""}
                        onSelect={(option) => {
                          setSelectedDeliveryOption(option);
                          // Map option id to legacy deliveryMethod for backward compatibility
                          const methodMap: Record<string, string> = {
                            home_standard: "standard",
                            home_express: "express",
                            station_pickup: "pickup",
                          };
                          setDeliveryMethod(methodMap[option.id] || option.id);
                          // Update shipping cost from the selected option's price
                          if (option.price) {
                            setCalculatedShipping(option.price.amount);
                          }
                        }}
                        subtotal={subtotal}
                        currency={currency}
                        isLoading={deliveryOptionsMutation.isPending}
                        noCoordinatesMessage={
                          !hasExactLocation
                            ? "Only station pickup is available. Add your exact location to unlock home delivery options."
                            : undefined
                        }
                      />
                    </>
                  )}
                </div>

                {/* Payment Method - Auto-detected */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-1">Payment Method</h3>
                  {fiatProvider ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-gray-700">
                        Paying with <span className="font-semibold capitalize">{fiatProvider}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <p className="text-sm text-gray-500">Detecting payment provider...</p>
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
              <Card className="border border-gray-100 shadow-none bg-white">
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-4 text-gray-800">Order Summary</h3>

                  {isValidating ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      {/* Order Items */}
                      <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto">
                        {isBuyNowMode && buyNowData ? (
                          // Buy Now mode: single product
                          <div className="flex items-center space-x-2.5">
                            <Image
                              src={buyNowData.product?.images?.[0] || "/placeholder.svg"}
                              alt={buyNowData.product?.name || "Product"}
                              width={36}
                              height={36}
                              className="rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-tight text-gray-800 line-clamp-1">
                                {buyNowData.product?.name}
                              </p>
                              {buyNowData.variant && (
                                <p className="text-[10px] text-gray-500">
                                  {buyNowData.variant.name}: {buyNowData.variant.value}
                                </p>
                              )}
                              <p className="text-[10px] text-blue-600">
                                {buyNowData.quantity} x {currencySymbol} {buyNowData.variant?.price?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          // Cart mode: multiple items
                          checkout?.items?.map((item: any) => (
                          <div
                            key={`${item.productId}-${item.variantId || 'no-variant'}-${item.optionId || 'no-option'}`}
                            className="flex items-center space-x-2.5"
                          >
                            <Image
                              src={item.productImage || "/placeholder.svg"}
                              alt={item.productName}
                              width={36}
                              height={36}
                              className="rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-tight text-gray-800 line-clamp-1">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-blue-600">
                                {item.quantity} x {currency} {item.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          ))
                        )}
                      </div>

                      {/* Order Totals */}
                      <div className="space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Sub Total</span>
                          <span className="font-medium text-gray-800">{currency} {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Shipping</span>
                          {(calculateShippingMutation.isPending || buyNowShippingMutation.isPending) ? (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                          ) : (
                            <span className="font-medium text-gray-800">
                              {currency} {shipping.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {isBuyNowMode && (shippingWarnings.length > 0 || shippingIsFallback) && (
                          <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-800 space-y-0.5">
                            {shippingIsFallback && (
                              <p className="font-medium">⚠ Estimated shipping (GIGL unavailable)</p>
                            )}
                            {shippingWarnings.map((w, i) => (
                              <p key={i}>{w}</p>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>
                            {taxRate > 0 
                              ? `${taxName} (${taxRate}%)${isTaxInclusive ? ' incl.' : ''}`
                              : "Tax"
                            }
                          </span>
                          <span className="font-medium text-gray-800">
                            {calculatedTax !== null 
                              ? (effectiveTax > 0 
                                ? `${isTaxInclusive ? 'Incl. ' : ''}${currency} ${effectiveTax.toLocaleString()}`
                                : `${currency} 0`)
                              : "Calculated at payment"
                            }
                          </span>
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex justify-between font-medium text-sm text-gray-900 pt-1">
                          <span>TOTAL</span>
                          <span>{currency} {total.toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2.5 mt-5">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-9"
                      onClick={handleProceedToPayment}
                      disabled={isProcessing || buyNowCheckout.isProcessing || deliveryOptionsMutation.isPending || (isBuyNowMode ? (!buyNowData || !hasShippingAddress) : (cartItems.length === 0 || !selectedDeliveryOption || !selectedDeliveryOption.price))}
                    >
                      {(isProcessing || buyNowCheckout.isProcessing) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Proceed to Payment"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-secondary text-black border-orange-200 hover:bg-orange-200 text-xs h-9"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Add Shipping Address Modal */}
          <Dialog open={showAddShippingModal} onOpenChange={setShowAddShippingModal}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Add Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newStreet" className="text-sm">Street Address</Label>
                    <Input
                      id="newStreet"
                      placeholder="Enter street address"
                      value={newShippingAddress.street}
                      onChange={(e) => setNewShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newCountry" className="text-sm">Country</Label>
                    <SearchableSelect
                      options={allCountries.map(c => ({ value: c.isoCode, label: c.name }))}
                      value={newAddressCountry}
                      onValueChange={(val) => {
                        setNewAddressCountry(val);
                        setNewAddressState("");
                        const country = allCountries.find(c => c.isoCode === val);
                        setNewShippingAddress(prev => ({ ...prev, country: country?.name || "", state: "" }));
                      }}
                      placeholder="Select country"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newState" className="text-sm">State / Region</Label>
                    <SearchableSelect
                      options={
                        newAddressCountry
                          ? State.getStatesOfCountry(newAddressCountry).map(s => ({ value: s.name, label: s.name }))
                          : []
                      }
                      value={newAddressState}
                      onValueChange={(val) => {
                        setNewAddressState(val);
                        setNewShippingAddress(prev => ({ ...prev, state: val }));
                      }}
                      placeholder="Select state"
                      className="mt-1"
                      disabled={!newAddressCountry}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newCity" className="text-sm">City</Label>
                    <Input
                      id="newCity"
                      placeholder="Enter city"
                      value={newShippingAddress.city}
                      onChange={(e) => setNewShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPostalCode" className="text-sm">Postal Code</Label>
                    <Input
                      id="newPostalCode"
                      placeholder="Enter postal code"
                      value={newShippingAddress.postalCode}
                      onChange={(e) => setNewShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowAddShippingModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={addAddressMutation.isPending || !newShippingAddress.street || !newShippingAddress.city || !newShippingAddress.state || !newShippingAddress.country || !newShippingAddress.postalCode}
                      onClick={async () => {
                        try {
                          await addAddressMutation.mutateAsync({
                            address: {
                              type: "shipping",
                              street: newShippingAddress.street,
                              city: newShippingAddress.city,
                              state: newShippingAddress.state,
                              country: newShippingAddress.country,
                              postalCode: newShippingAddress.postalCode,
                              isDefault: !hasShippingAddress, // Make default if first address
                            },
                            duplicateForShipping: false,
                          });
                          setShowAddShippingModal(false);
                          setNewShippingAddress({ street: "", city: "", state: "", country: "", postalCode: "" });
                          setNewAddressCountry("");
                          setNewAddressState("");
                        } catch (error) {
                          // Error toast is handled by the mutation hook
                        }
                      }}
                    >
                      {addAddressMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save Address"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                                  if (paymentIntentData.isBuyNow) {
                                    // Buy Now mode: order already created by payment intent
                                    // Show processing stages and redirect
                                    setShowPaymentUI(false);
                                    setShowOrderProcessing(true);
                                    setOrderProcessingStage('finalizing');
                                    invalidateWalletBalance();
                                    setTimeout(() => {
                                      setOrderProcessingStage('complete');
                                      // Cleanup buy-now session data
                                      sessionStorage.removeItem('buyNowData');
                                      sessionStorage.removeItem('buyNowCheckoutAuthorized');
                                      sessionStorage.removeItem('checkoutTimestamp');
                                      setTimeout(() => {
                                        setShowOrderProcessing(false);
                                        router.push('/home/user/orders');
                                      }, 1500);
                                    }, 1000);
                                  } else {
                                    handleCreateOrder({
                                      ...paymentIntentData,
                                      type: 'fiat',
                                      paymentIntentId,
                                    });
                                  }
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
