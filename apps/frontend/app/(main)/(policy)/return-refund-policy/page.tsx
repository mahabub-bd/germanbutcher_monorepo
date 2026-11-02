import {
  PolicyCallout,
  PolicyCardGrid,
  PolicyDefinitions,
  PolicyInfoCard,
  PolicyList,
  PolicySection,
  PolicySteps,
} from "@/components/common/policy-doc";
import { PolicyPageShell } from "@/components/common/policy-page-shell";
import { getBusinessSettings } from "@/utils/business-settings-server";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Headset,
  Package,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";

const sections = [
  { id: "return-window", title: "Return Window" },
  { id: "refund-timeline", title: "Refund Processing Timeline" },
  { id: "cancellation", title: "Cancellation Policy" },
  { id: "eligible-items", title: "Eligible Items for Return" },
  { id: "return-process", title: "How to Return Items" },
  { id: "important-notes", title: "Important Notes" },
];

const RefundPolicy = async () => {
  const settings = await getBusinessSettings();
  const phone = settings?.phone?.trim() || "";
  const email = settings?.email?.trim() || "";

  return (
    <PolicyPageShell
      icon={RefreshCw}
      title="Return and Refund Policy"
      subtitle="We want you to be completely satisfied with your purchase from German Butcher. Learn about our return and refund process."
      chips={[
        { icon: Clock, label: "7-day return window" },
        { icon: CreditCard, label: "Refunds in 7–10 working days" },
      ]}
      sections={sections}
      related={[
        {
          href: "/terms-and-conditions",
          label: "Terms and Conditions",
          description: "The rules for using our services",
        },
        {
          href: "/privacy-policy",
          label: "Privacy Policy",
          description: "How we collect and protect your data",
        },
        {
          href: "/how-to-order",
          label: "How to Order",
          description: "Delivery options and payment methods",
        },
      ]}
      contact={{
        title: "Need Help?",
        description:
          "Our customer service team is here to help with any questions about returns, refunds, or cancellations.",
        footnote:
          "Customer service hours: Sunday – Thursday, 9:00 AM – 6:00 PM (GMT+6)",
      }}
      settings={settings}
    >
      <PolicySection
        id="return-window"
        index={1}
        icon={Clock}
        title="Return Window"
      >
        <p>
          You have <span className="font-semibold text-gray-900">7 days</span>{" "}
          from the date of delivery to return eligible items for a full refund.
          For perishable food items, returns must be initiated within{" "}
          <span className="font-semibold text-gray-900">24 hours</span> of
          delivery.
        </p>

        <PolicyCardGrid columns={2}>
          <PolicyInfoCard
            icon={CheckCircle}
            tone="success"
            title="Non-perishable items"
            description="Return window: 7 days from delivery"
          />
          <PolicyInfoCard
            icon={AlertTriangle}
            tone="warning"
            title="Perishable items"
            description="Return window: 24 hours from delivery"
          />
        </PolicyCardGrid>
      </PolicySection>

      <PolicySection
        id="refund-timeline"
        index={2}
        icon={CreditCard}
        tone="info"
        title="Refund Processing Timeline"
      >
        <p>
          After we receive and approve your return request, refunds will be
          processed within{" "}
          <span className="font-semibold text-gray-900">
            7 to 10 working days
          </span>
          . The actual time for the refund to reflect in your account may vary
          depending on your payment method and banking institution.
        </p>

        <PolicyCallout
          tone="info"
          icon={Clock}
          title="Processing timeline by payment method"
        >
          <PolicyList
            variant="check"
            tone="info"
            items={[
              "Credit/Debit Card refunds: 7–10 working days",
              "Mobile Banking: 7–10 working days",
              "Bank Transfer: 7–10 working days",
            ]}
          />
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="cancellation"
        index={3}
        icon={XCircle}
        tone="warning"
        title="Cancellation Policy"
      >
        <PolicyCallout tone="warning" icon={XCircle} title="Order Cancellation">
          <PolicyDefinitions
            items={[
              {
                term: "Within 2 hours",
                description:
                  "You can cancel your order within 2 hours of placing it, provided it hasn't been processed for delivery.",
              },
              {
                term: "After Processing",
                description:
                  "Once your order has been processed and is out for delivery, cancellation may not be possible. In such cases, you may return the items as per our return policy.",
              },
              {
                term: "Perishable Items",
                description:
                  "Due to the nature of fresh meat and perishable products, cancellations after processing may not be accepted unless there are quality issues.",
              },
            ]}
          />
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="eligible-items"
        index={4}
        icon={Package}
        title="Eligible Items for Return"
      >
        <PolicyCardGrid columns={2}>
          <PolicyCallout
            tone="success"
            icon={CheckCircle}
            title="Returnable Items"
          >
            <PolicyList
              variant="check"
              tone="success"
              items={[
                "Unopened packaged items in original condition",
                "Defective or damaged products",
                "Wrong items delivered",
                "Non-perishable specialty items",
              ]}
            />
          </PolicyCallout>

          <PolicyCallout
            tone="danger"
            icon={XCircle}
            title="Non-Returnable Items"
          >
            <PolicyList
              variant="cross"
              tone="danger"
              items={[
                "Opened or consumed perishable items",
                "Custom-made or special order items",
                "Items without original packaging",
                "Items past the return window",
              ]}
            />
          </PolicyCallout>
        </PolicyCardGrid>
      </PolicySection>

      <PolicySection
        id="return-process"
        index={5}
        icon={RotateCcw}
        title="How to Return Items"
        description="Five steps from request to refund."
      >
        <PolicySteps
          steps={[
            {
              title: "Contact Customer Service",
              description: `Contact customer service${
                phone || email
                  ? ` at ${[phone, email].filter(Boolean).join(" or ")}`
                  : ""
              } to initiate a return request.`,
            },
            {
              title: "Get Return Authorization",
              description:
                "Our team will provide you with a return authorization number and instructions for returning the item.",
            },
            {
              title: "Package & Send",
              description:
                "Package the item in its original packaging with the return authorization number and send it back to us.",
            },
            {
              title: "Inspection & Processing",
              description:
                "Once we receive and inspect the returned item, we'll approve the return and process your refund.",
            },
            {
              title: "Receive Refund",
              description:
                "Your refund will be processed within 7–10 working days and credited to your original payment method.",
            },
          ]}
        />
      </PolicySection>

      <PolicySection
        id="important-notes"
        index={6}
        icon={AlertTriangle}
        tone="warning"
        title="Important Notes"
      >
        <PolicyCallout
          tone="warning"
          icon={Headset}
          title="Please keep in mind"
        >
          <PolicyList
            variant="warning"
            tone="warning"
            items={[
              "Shipping costs are non-refundable unless the return is due to our error or a defective product.",
              "Customers are responsible for return shipping costs unless otherwise specified.",
              "Refunds will be processed in the same currency as the original purchase.",
              "For health and safety reasons, we cannot accept returns of opened perishable items unless they are defective.",
              "Orders can be cancelled within 2 hours of placement if not yet processed for delivery.",
              "Refund processing takes 7–10 working days from the date of return approval.",
              "This policy may be updated from time to time. Please check our website for the most current version.",
            ]}
          />
        </PolicyCallout>
      </PolicySection>
    </PolicyPageShell>
  );
};

export default RefundPolicy;
