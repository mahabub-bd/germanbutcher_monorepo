import { DeliveryPolicyTable } from "@/components/common/delivery-policy-table";
import {
  PolicyCallout,
  PolicyList,
  PolicySection,
} from "@/components/common/policy-doc";
import { PolicyPageShell } from "@/components/common/policy-page-shell";
import { getBusinessSettings } from "@/utils/business-settings-server";
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  FileText,
  Landmark,
  ScrollText,
  Shield,
  Truck,
  Users,
} from "lucide-react";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "products-services", title: "Products and Services" },
  { id: "stock-availability", title: "Product Stock and Availability" },
  { id: "payment", title: "Payment Terms" },
  { id: "order-agreement", title: "Order Agreement" },
  { id: "responsibilities", title: "User Responsibilities" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "governing-law", title: "Governing Law" },
];

const TermsAndConditions = async () => {
  const settings = await getBusinessSettings();

  return (
    <PolicyPageShell
      icon={ScrollText}
      title="Terms and Conditions"
      subtitle="Please read these terms carefully before using our services. By using German Butcher's website and services, you agree to these terms."
      updatedOn="27 July 2025"
      chips={[
        { icon: FileText, label: "Applies to germanbutcherbd.com" },
        { icon: Landmark, label: "Governed by Bangladesh law" },
      ]}
      sections={sections}
      related={[
        {
          href: "/privacy-policy",
          label: "Privacy Policy",
          description: "How we collect and protect your data",
        },
        {
          href: "/return-refund-policy",
          label: "Return & Refund",
          description: "Windows, eligibility and timelines",
        },
        {
          href: "/faqs",
          label: "FAQs",
          description: "Quick answers about ordering",
        },
      ]}
      contact={{
        title: "Questions About These Terms?",
        description:
          "If you have any questions about these Terms and Conditions, please contact us.",
        footnote:
          "These Terms and Conditions were last updated on 27 July 2025. We reserve the right to update these terms at any time.",
      }}
      settings={settings}
    >
      <PolicySection
        id="introduction"
        index={1}
        icon={Landmark}
        title="Introduction"
      >
        <p>
          These Terms and Conditions govern your use of the{" "}
          <span className="font-semibold text-gray-900">German Butcher</span>{" "}
          website located at{" "}
          <span className="font-semibold text-gray-900">
            germanbutcherbd.com
          </span>{" "}
          and any related services provided by German Butcher.
        </p>
      </PolicySection>

      <PolicySection
        id="acceptance"
        index={2}
        icon={CheckCircle}
        title="Acceptance of Terms"
      >
        <p>
          By accessing and using this website, you accept and agree to be bound
          by the terms and provision of this agreement. If you do not agree to
          abide by the above, please do not use this service.
        </p>
      </PolicySection>

      <PolicySection
        id="products-services"
        index={3}
        icon={Truck}
        title="Products and Services"
        description="What we sell and how it reaches you."
      >
        <p>
          German Butcher provides high-quality fresh meat, sausages, and related
          food products through our online platform.
        </p>

        {/* Live shipping-method charges — same table as FAQs / How to Order */}
        <DeliveryPolicyTable />
      </PolicySection>

      <PolicySection
        id="stock-availability"
        index={4}
        icon={AlertTriangle}
        tone="warning"
        title="Product Stock and Availability"
      >
        <p>
          All product stock quantities and availability status are clearly
          displayed on our website:
        </p>
        <PolicyList
          items={[
            "Product stock quantities are shown in the product description",
            "Out-of-stock items are clearly marked with “Out of Stock” labels",
            "Stock status is indicated as “Available/Unavailable” or “In Stock/Out of Stock”",
            "Numerical stock quantities are displayed where applicable",
          ]}
        />
      </PolicySection>

      <PolicySection
        id="payment"
        index={5}
        icon={CreditCard}
        title="Payment Terms"
      >
        <p>
          Payment must be made in full before order processing. We accept
          various payment methods including:
        </p>
        <PolicyList
          variant="check"
          items={[
            "Credit and Debit Cards",
            "Mobile Banking (bKash, Nagad, Rocket)",
            "Bank Transfer",
            "Cash on Delivery (where available)",
          ]}
        />
      </PolicySection>

      <PolicySection
        id="order-agreement"
        index={6}
        icon={Shield}
        title="Order Agreement"
      >
        <PolicyCallout
          tone="warning"
          icon={Shield}
          title="By placing an order, you agree to the following:"
        >
          <PolicyList
            tone="warning"
            items={[
              "You have read and agreed to our Terms and Conditions",
              "You have read and accepted our Privacy Policy",
              "You understand our Return and Refund Policy",
              "All information provided is accurate and complete",
            ]}
          />
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="responsibilities"
        index={7}
        icon={Users}
        title="User Responsibilities"
      >
        <p>As a user of our website and services, you agree to:</p>
        <PolicyList
          items={[
            "Provide accurate and complete information during registration and ordering",
            "Use the website only for lawful purposes",
            "Not engage in any activity that could harm our website or services",
            "Respect intellectual property rights",
          ]}
        />
      </PolicySection>

      <PolicySection
        id="liability"
        index={8}
        icon={AlertTriangle}
        tone="danger"
        title="Limitation of Liability"
      >
        <PolicyCallout tone="danger" icon={AlertTriangle}>
          <p>
            German Butcher shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including without
            limitation, loss of profits, data, use, goodwill, or other
            intangible losses, resulting from your use of our services.
          </p>
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="governing-law"
        index={9}
        icon={Landmark}
        title="Governing Law"
      >
        <p>
          These Terms and Conditions are governed by and construed in accordance
          with the laws of Bangladesh. Any disputes arising under these terms
          shall be subject to the exclusive jurisdiction of the courts of
          Bangladesh.
        </p>
      </PolicySection>
    </PolicyPageShell>
  );
};

export default TermsAndConditions;
