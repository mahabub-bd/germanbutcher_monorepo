"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/contexts/cart-context";
import { fetchData } from "@/utils/api-utils";
import { clearLocalCoupon } from "@/utils/cart-storage";
import { refreshDashboard, serverRevalidate } from "@/utils/revalidatePath";
import type {
  Address,
  CartItem,
  PaymentMethod,
  ShippingMethod,
  User as UserType,
} from "@/utils/types";

import { mobileLogin, verifyOtp } from "@/actions/auth";
import { OtpVerificationModal } from "@/components/auth/otp-verification-modal";
import { AccountCreation } from "@/components/checkout/account-creation";
import { CustomerInformation } from "@/components/checkout/customer-information";
import { EmptyCartMessage } from "@/components/checkout/empty-cart-message";
import { OrderItems } from "@/components/checkout/order-items";
import { OrderSummary } from "@/components/checkout/order-summary";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { ShippingInformation } from "@/components/checkout/shipping-information";
import { ShippingMethodSelector } from "@/components/checkout/shipping-method-selector";
import { postData } from "@/utils/api-utils";

export default function CheckoutPage({ user }: { user?: UserType }) {
  const { getCartTotals, clearCart, cart, appliedCoupon } = useCartContext();
  const router = useRouter();

  const { originalSubtotal, discountedSubtotal, itemCount, productDiscounts } =
    getCartTotals();

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedShippingMethod, setSelectedShippingMethod] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.mobileNumber || "",
    address: "",
    area: "",
    city: "",
    division: "",
    createAccount: false,
  });

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingCost =
    shippingMethods.find(
      (method) => method.id.toString() === selectedShippingMethod
    )?.cost || 0;

  const couponDiscount = appliedCoupon?.discount || 0;
  const total =
    Number(discountedSubtotal) + Number(shippingCost) - Number(couponDiscount);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.mobileNumber || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const [shippingResponse, paymentResponse] = await Promise.all([
          fetchData("shipping-methods?isActive=true") as Promise<
            ShippingMethod[]
          >,
          fetchData("order-payment-methods") as Promise<PaymentMethod[]>,
        ]);

        setShippingMethods(shippingResponse as ShippingMethod[]);
        setPaymentMethods(paymentResponse as PaymentMethod[]);

        if ((shippingResponse as ShippingMethod[]).length > 0) {
          setSelectedShippingMethod(shippingResponse[0].id.toString());
        }
        if (paymentResponse.length > 0) {
          setSelectedPaymentMethod(paymentResponse[0].code);
        }
      } catch (error) {
        console.error("Error fetching methods:", error);
        toast.error("Failed to load checkout options");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMethods();
  }, []);

  const handleVerifyPhone = async (phone: string) => {
    if (!phone) {
      toast.error("Phone number is required");
      return;
    }

    const formattedNumber = phone.startsWith("+")
      ? phone
      : `+880${phone.replace(/^0+/, "")}`;

    setPhoneNumber(formattedNumber);

    try {
      await mobileLogin(formattedNumber);
      setShowOtpModal(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const handleOtpSuccess = () => {
    setIsVerified(true);
    setShowOtpModal(false);
    toast.success("Phone number verified successfully");
    serverRevalidate("/");

    serverRevalidate("/checkout");
    router.refresh();
  };

  const handleFormDataChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressSelect = (addressId: number, addressData: Address) => {
    setSelectedAddressId(addressId);
    setShowAddressForm(false);
    setFormData((prev) => ({
      ...prev,
      address: addressData.address,
      area: addressData.area,
      city: addressData.city,
      division: addressData.division,
    }));
  };

  const handleAddNewAddress = () => {
    setShowAddressForm(true);
    setSelectedAddressId(null);
    setFormData((prev) => ({
      ...prev,
      address: "",
      area: "",
      city: "",
      division: "",
    }));
  };

  const handleSubmit = async () => {
    if (formData.createAccount && !user && !isVerified) {
      toast.error("Please verify your phone number to create an account");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required customer information");
      return;
    }

    if (
      showAddressForm &&
      (!formData.address ||
        !formData.area ||
        !formData.city ||
        !formData.division)
    ) {
      toast.error("Please fill in all required shipping information");
      return;
    }

    setIsSubmitting(true);
    try {
      let addressId = selectedAddressId;

      if (showAddressForm) {
        const addressData = {
          address: formData.address,
          area: formData.area,
          division: formData.division,
          city: formData.city,
          type: "shipping",
          isDefault: true,
          userId: user?.id || null,
        };

        const addressResponse = await postData("addresses", addressData);

        if (
          !addressResponse ||
          !addressResponse.data ||
          !addressResponse.data.id
        ) {
          throw new Error("Failed to create address");
        }

        addressId = addressResponse.data.id;
        toast.success("Address created successfully");
      }

      if (!addressId) {
        toast.error("No address selected or created");
        return;
      }

      const orderData = {
        addressId: addressId,
        userId: user?.id || null,
        shippingMethodId: Number(selectedShippingMethod),
        paymentMethodId: paymentMethods.find(
          (method) => method.code === selectedPaymentMethod
        )?.id,
        items: cart.items.map((item: CartItem) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        couponId: appliedCoupon?.id || null,
      };

      const response = await postData("orders", orderData);
      clearLocalCoupon();
      await clearCart();
      serverRevalidate("/");
      serverRevalidate("/checkout");
      await refreshDashboard();
      toast.success("Order placed successfully!");
      router.push(`/order-confirmation/${response.data.id}`);
    } catch (error) {
      console.error("Order submission error:", error);
      if (error instanceof Error) {
        toast.error(
          error.message || "Failed to place order. Please try again."
        );
      } else {
        toast.error("Failed to place order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart?.items?.length) {
    return <EmptyCartMessage />;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
            Checkout
          </h1>
          <p className="mt-1 text-sm md:text-base text-muted-foreground">
            Complete your order by providing your details below
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mt-3 sm:mt-0 self-start sm:self-auto"
        >
          <Link href="/cart" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to cart
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <LoadingIndicator message="Loading checkout information..." />
      ) : (
        <div className="grid gap-6 md:gap-8 lg:grid-cols-12">
          {/* Main Form */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            <OrderItems items={cart.items} itemCount={itemCount} />
            <CustomerInformation
              formData={formData}
              onChange={handleFormDataChange}
              onVerifyPhone={handleVerifyPhone}
              isVerified={isVerified}
              user={user}
            />

            <ShippingInformation
              formData={formData}
              onChange={handleFormDataChange}
              user={user}
              onAddressSelect={handleAddressSelect}
              onAddNewClick={handleAddNewAddress}
              showAddressForm={showAddressForm}
            />

            <ShippingMethodSelector
              shippingMethods={shippingMethods}
              selectedMethod={selectedShippingMethod}
              onSelectMethod={setSelectedShippingMethod}
            />

            <PaymentMethodSelector
              paymentMethods={paymentMethods}
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={setSelectedPaymentMethod}
            />

            {!user && (
              <AccountCreation
                createAccount={formData.createAccount}
                onChange={(value) =>
                  handleFormDataChange("createAccount", value)
                }
              />
            )}

            {/* Mobile Order Summary */}
            <div className="lg:hidden">
              <OrderSummary
                originalSubtotal={originalSubtotal}
                productDiscounts={productDiscounts}
                appliedCoupon={appliedCoupon}
                shippingCost={Number(shippingCost)}
                total={total}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                selectedShippingMethod={selectedShippingMethod}
                selectedPaymentMethod={selectedPaymentMethod}
                shippingMethods={shippingMethods}
                paymentMethods={paymentMethods}
                user={user}
              />
            </div>
          </div>

          {/* Desktop Order Summary */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="sticky top-4 bg-white rounded-lg border p-6">
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold">Order Summary</h2>
              </div>

              <div className="space-y-4 mt-4">
                <OrderSummary
                  originalSubtotal={originalSubtotal}
                  productDiscounts={productDiscounts}
                  appliedCoupon={appliedCoupon}
                  shippingCost={Number(shippingCost)}
                  total={total}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  selectedShippingMethod={selectedShippingMethod}
                  selectedPaymentMethod={selectedPaymentMethod}
                  shippingMethods={shippingMethods}
                  paymentMethods={paymentMethods}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        phoneNumber={phoneNumber}
        onClose={() => setShowOtpModal(false)}
        onSuccess={handleOtpSuccess}
        onResendOtp={mobileLogin}
        onVerifyOtp={verifyOtp}
      />
    </div>
  );
}
