import { DeliveryPolicyTable } from "@/components/common/delivery-policy-table";
import {
  PolicyCallout,
  PolicyCardGrid,
  PolicyInfoCard,
  PolicyList,
  PolicySection,
  type PolicyIcon,
} from "@/components/common/policy-doc";
import { PolicyPageShell } from "@/components/common/policy-page-shell";
import { cn } from "@/lib/utils";
import { getBusinessSettings } from "@/utils/business-settings-server";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CreditCard,
  Headphones,
  MessageSquare,
  Phone,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";

const sections = [
  { id: "ordering-process", title: "Simple Ordering Process" },
  { id: "delivery-options", title: "Delivery Options" },
  { id: "payment-options", title: "Payment Options" },
  { id: "order-support", title: "Order Support" },
];

const orderSteps = [
  {
    icon: ShoppingCart,
    eyebrow: "Step 1",
    badge: "Start Here",
    title: "Browse Our Selection",
    description:
      "Explore our premium meats and specialty products in our online store.",
  },
  {
    icon: CreditCard,
    eyebrow: "Step 2",
    title: "Place Your Order",
    description:
      "Add items to your cart and proceed through our secure checkout.",
  },
  {
    icon: Truck,
    eyebrow: "Step 3",
    title: "Delivery or Pickup",
    description: "Choose between home delivery or store pickup at checkout.",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Step 4",
    badge: "Quality Assured",
    title: "Enjoy Quality Meats",
    description:
      "Receive your order and enjoy German Butcher's premium quality.",
  },
];

const paymentMethods = [
  {
    icon: CreditCard,
    title: "Credit/Debit Cards",
    description: "Visa, Mastercard, American Express",
  },
  {
    icon: Smartphone,
    title: "Mobile Banking",
    description: "bKash, Nagad, Rocket",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    description: "Pay when you receive your order",
  },
];

const deliveryNotes = [
  "Perishable items require immediate refrigeration upon delivery",
  "Delivery times may vary during holidays and peak seasons",
  "Someone must be present to receive the order",
];

type SupportChannel = {
  icon: PolicyIcon;
  title: string;
  description: string;
  action: string;
  href: string;
  external?: boolean;
};

const HowToOrderPage = async () => {
  const settings = await getBusinessSettings();

  // Only the channels configured in Business Settings are offered.
  const supportChannels: SupportChannel[] = [];

  if (settings?.phone) {
    supportChannels.push({
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our support team, 9 AM – 6 PM daily.",
      action: settings.phone,
      href: `tel:${settings.phone}`,
    });
  }

  const chatHref = settings?.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace("+", "")}`
    : settings?.messengerUrl;

  if (chatHref) {
    supportChannels.push({
      icon: MessageSquare,
      title: "Live Chat",
      description: "Get instant help through our online chat, 24/7 available.",
      action: "Start Chat Now",
      href: chatHref,
      external: true,
    });
  }

  return (
    <PolicyPageShell
      icon={ShoppingCart}
      eyebrow="Ordering guide"
      title="How to Order"
      subtitle="Follow these easy steps to get German Butcher's premium products delivered to your door."
      chips={[
        { icon: Truck, label: "Home delivery & store pickup" },
        { icon: CreditCard, label: "Card, mobile banking & COD" },
      ]}
      sections={sections}
      related={[
        {
          href: "/faqs",
          label: "FAQs",
          description: "Quick answers about ordering",
        },
        {
          href: "/return-refund-policy",
          label: "Return & Refund",
          description: "Windows, eligibility and timelines",
        },
        {
          href: "/contact-us",
          label: "Contact Us",
          description: "Reach our team directly",
        },
      ]}
      contact={{
        title: "Need Help Ordering?",
        description:
          "Our friendly customer service team is ready to assist you with any questions about your order.",
        footnote: "Customer service hours: 9 AM – 6 PM, daily.",
      }}
      settings={settings}
    >
      <PolicySection
        id="ordering-process"
        index={1}
        icon={ShoppingCart}
        title="Simple Ordering Process"
        description="From our selection to your door."
      >
        <PolicyCardGrid columns={4}>
          {orderSteps.map((step) => (
            <PolicyInfoCard
              key={step.title}
              icon={step.icon}
              eyebrow={step.eyebrow}
              badge={step.badge}
              title={step.title}
              description={step.description}
              tone="brand"
            />
          ))}
        </PolicyCardGrid>
      </PolicySection>

      <PolicySection
        id="delivery-options"
        index={2}
        icon={Truck}
        title="Delivery Options"
        description="Choose the delivery method that works best for you."
      >
        {/* Live shipping-method charges — same data as checkout & policy pages */}
        <DeliveryPolicyTable />

        <PolicyCallout
          tone="warning"
          icon={AlertTriangle}
          title="Important Delivery Notes"
        >
          <PolicyList variant="warning" tone="warning" items={deliveryNotes} />
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="payment-options"
        index={3}
        icon={CreditCard}
        title="Payment Options"
        description="We accept multiple secure payment methods for your convenience."
      >
        <PolicyCardGrid columns={3}>
          {paymentMethods.map((method) => (
            <PolicyInfoCard
              key={method.title}
              icon={method.icon}
              title={method.title}
              description={method.description}
              tone="brand"
            />
          ))}
        </PolicyCardGrid>

        <PolicyCallout
          tone="success"
          icon={ShieldCheck}
          title="100% Secure Payments"
        >
          <p>
            All transactions are encrypted and secure. We never store your
            payment information. Your financial data is protected by
            industry-standard security measures.
          </p>
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="order-support"
        index={4}
        icon={Headphones}
        title="Order Support"
      >
        {supportChannels.length > 0 && (
          <div
            className={cn(
              "grid gap-3 sm:gap-4",
              supportChannels.length > 1 && "sm:grid-cols-2"
            )}
          >
            {supportChannels.map((channel) => (
              <PolicyCallout
                key={channel.title}
                tone="brand"
                icon={channel.icon}
                title={channel.title}
              >
                <p>{channel.description}</p>
                <a
                  href={channel.href}
                  {...(channel.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex items-center gap-2 rounded-full border border-primaryColor/20 bg-white px-3.5 py-1.5 text-sm font-medium text-primaryColor transition-colors hover:border-primaryColor/40 hover:bg-primaryColor/[0.06]"
                >
                  {channel.action}
                  <ArrowRight className="size-3.5" />
                </a>
              </PolicyCallout>
            ))}
          </div>
        )}

        <PolicyCallout
          tone="info"
          icon={Store}
          title="Questions About Specific Products?"
        >
          <p>
            Our meat experts can help you choose the perfect cuts for your
            needs.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 rounded-lg bg-primaryColor px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondaryColor"
          >
            Contact Our Experts
            <ArrowRight className="size-4" />
          </Link>
        </PolicyCallout>
      </PolicySection>
    </PolicyPageShell>
  );
};

export default HowToOrderPage;
