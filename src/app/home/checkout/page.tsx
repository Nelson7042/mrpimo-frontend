"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {  Copy, Check, Loader2 } from "lucide-react";
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
import { useAddAddress } from "@/hooks/useAddress";
import { useCountries } from "@/hooks/useCountries";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
import { toast } from "react-hot-toast";
import { useUserStore } from "@/stores/useUserStore";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentCategory, setPaymentCategory] = useState<"fiat" | "crypto" | "">("");
  const [fiatProvider, setFiatProvider] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
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

  const { items: cartItems, summary: cartSummary, clearCart } = useCartStore();
  const { refetch: validateCart, data: validationData, isLoading: isValidating } = useValidateCart();
  const createOrderMutation = useCreateOrder();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const addAddressMutation = useAddAddress();
  const { data: countries = [] } = useCountries();

  useEffect(() => {
    if (cartItems.length > 0) {
      validateCart();
    }
  }, []);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProceedToPayment = async () => {
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
      // Only add addresses if user has no addresses yet
      if (!user?.addresses?.length) {
        console.log('Step 1: Saving billing address...');
        await addAddressMutation.mutateAsync({
          address: formData.address,
          duplicateForShipping: sameAsShipping
        });
        console.log('Step 1: Billing address saved');

        // Save shipping address if different
        if (!sameAsShipping && shippingAddress.street) {
          console.log('Step 2: Saving shipping address...');
          await addAddressMutation.mutateAsync({
            address: shippingAddress
          });
          console.log('Step 2: Shipping address saved');
        }
      }

      const items = checkout?.items?.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        price: item.price,
      })) || [];

      let paymentData: any = {
        type: paymentCategory,
        amount: total,
      };

      if (paymentCategory === 'fiat') {
        console.log('Step 3: Creating fiat payment intent...');
        const response: any = await createPaymentIntentMutation.mutateAsync({
          items,
          paymentMethod: fiatProvider || 'stripe',
        });
        console.log('Step 3: Payment intent response:', response);
        
        if (response.success) {
          // Store payment intent data and show payment UI
          setPaymentIntentData({
            clientSecret: response.paymentData.clientSecret,
            paymentIntentId: response.paymentData.paymentIntentId,
            provider: fiatProvider,
            items,
            pricing: { subtotal, shipping, tax, total, currency },
          });
          setShowPaymentUI(true);
        }
      } else if (paymentCategory === 'crypto') {
        console.log('Step 3: Creating crypto payment intent...');
        const response: any = await createPaymentIntentMutation.mutateAsync({
          items,
          paymentMethod: 'crypto',
          tokenType: 'USDC',
        });
        console.log('Step 3: Payment intent response:', response);
        
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
      console.error("Payment setup failed:", error);
      toast.error(error.message || "Failed to setup payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateOrder = async (paymentData: any) => {
    setIsProcessing(true);
    try {
      const orderData = {
        validatedItems: paymentData.items,
        pricing: paymentData.pricing,
        paymentData: {
          type: paymentData.type,
          paymentIntentId: paymentData.paymentIntentId,
          provider: paymentData.provider,
        },
        address: formData.address,
      };

      console.log('Creating order after payment...', orderData);
      const result: any = await createOrderMutation.mutateAsync(orderData);
      console.log('Order created:', result);

      if (result.order || result.data) {
        const order = result.order || result.data;
        setOrderId(order._id || order.id);
        await clearCart();
        // Refresh user data to update order history
        const { useUserStore } = await import('@/stores/useUserStore');
        await useUserStore.getState().refreshUser();
        setShowPaymentUI(false);
        setShowSuccess(true);
      }
    } catch (error: any) {
      console.error("Order creation failed:", error);
      toast.error(error.message || "Failed to create order");
    } finally {
      setIsProcessing(false);
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
    console.log("Breadcrumb clicked:", item);
    if (item.href) {
      router.push(item?.href);
    }
  };

  const paymentCategories = [
    { id: 'fiat', name: 'Fiat Currency', icon: '💳' },
    { id: 'crypto', name: 'Cryptocurrency', icon: '₿' },
  ];

  const getProviderByCurrency = (currency: string): string => {
    const curr = currency.toLowerCase();
    if (['usd', 'eur', 'cad', 'gbp'].includes(curr)) return 'stripe';
    if (['ngn', 'zar'].includes(curr)) return 'paystack';
    if (curr === 'cny') return 'airwallex';
    return 'stripe';
  };

  useEffect(() => {
    if (currency && paymentCategory === 'fiat') {
      const provider = getProviderByCurrency(currency);
      setFiatProvider(provider);
    }
  }, [currency, paymentCategory]);

  return (
    <>
      <div className="min-h-screen font-roboto bg-gray-50 body-padding">
        <div className="max-w-7xl px-6 md:px-8  mx-auto pt-4">
          {/* Breadcrumb */}
          <Breadcrumbs
            items={manualBreadcrumbs}
            onItemClick={handleBreadcrumbClick}
            className="mb-4"
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Billing Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-2">Billing Information</h2>
                <p className="text-gray-600 mb-6">
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
                        value={formData.address.country}
                        onValueChange={(value) =>
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, country: value }
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country: any) => (
                            <SelectItem key={country._id} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="Enter your State"
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, state: e.target.value }
                          }))
                        }
                        className="mt-1"
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

                  {/* Same as Shipping Checkbox */}
                  {!user?.addresses?.length && (
                    <div className="mt-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
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
                  )}
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
                            <div className="text-2xl mb-2">{category.icon}</div>
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
                  {paymentMethod === "bank-transfer" && (
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
                  )}

                  {/* Card Payment Details */}
                  {paymentMethod === "card" && (
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
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Order Summary</h3>

                  {isValidating ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Order Items */}
                      <div className="space-y-4 mb-6">
                        {checkout?.items?.map((item: any) => (
                          <div
                            key={item.productId + (item.variantId || "")}
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
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Order Placed Successfully
                </h3>
                <p className="text-gray-600 mb-6">
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
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Add Shipping Address</h3>
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
                      <Label htmlFor="shipState">State</Label>
                      <Input
                        id="shipState"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipCountry">Country</Label>
                      <Select
                        value={shippingAddress.country}
                        onValueChange={(value) => setShippingAddress(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country: any) => (
                            <SelectItem key={country._id} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="shipPostal">Postal Code</Label>
                      <Input
                        id="shipPostal"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="mt-1"
                      />
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
              <div className="p-6">
                <h3 className="text-xl font-bold mb-6">Complete Payment</h3>
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
        </div>
      </div>
    </>
  );
}
