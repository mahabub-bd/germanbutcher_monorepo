import {
  PolicyCallout,
  PolicyCardGrid,
  PolicyDefinitions,
  PolicyInfoCard,
  PolicyList,
  PolicySection,
} from "@/components/common/policy-doc";
import { PolicyPageShell } from "@/components/common/policy-page-shell";
import { getBusinessSettings } from "@/utils/business-settings-server";
import {
  AlertTriangle,
  Database,
  Eye,
  FileText,
  Lock,
  Scale,
  ScrollText,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "data-collection", title: "How We Collect Information" },
  { id: "data-protection", title: "Information Protection" },
  { id: "third-party-sharing", title: "Third-Party Information Sharing" },
  { id: "information-disclosure", title: "When We Share Information" },
  { id: "data-security", title: "Data Security Measures" },
  { id: "your-rights", title: "Your Rights" },
];

const PrivacyPolicyComponent = async () => {
  const settings = await getBusinessSettings();

  return (
    <PolicyPageShell
      icon={Shield}
      title="Privacy Policy"
      subtitle="Your privacy is important to us. Learn how we collect, use, and protect your information."
      updatedOn="27 July 2025"
      chips={[
        { icon: Lock, label: "We never sell your data" },
        { icon: ShieldCheck, label: "Encrypted payments" },
      ]}
      sections={sections}
      related={[
        {
          href: "/terms-and-conditions",
          label: "Terms and Conditions",
          description: "The rules for using our services",
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
        title: "Privacy Questions?",
        description:
          "If you have any questions about this Privacy Policy or how we handle your data, please contact us.",
        footnote:
          "This Privacy Policy was last updated on 27 July 2025. We may update this policy from time to time.",
      }}
      settings={settings}
    >
      <PolicySection
        id="introduction"
        index={1}
        icon={FileText}
        title="Introduction"
      >
        <p>
          This Privacy Policy manages the manner in which{" "}
          <span className="font-semibold text-gray-900">German Butcher</span>{" "}
          collects, uses, maintains and discloses information collected from
          users of the{" "}
          <span className="font-semibold text-gray-900">
            germanbutcherbd.com
          </span>{" "}
          website or any kind of platform such as mobile applications. This
          privacy policy is applicable for the Site with all products and
          services offered by German Butcher.
        </p>
      </PolicySection>

      <PolicySection
        id="data-collection"
        index={2}
        icon={Database}
        title="How We Collect Information"
      >
        <p>
          When you use our website, we collect and store your personal
          information which is provided by you. Our goal in doing so is to
          provide you a safe, efficient, smooth shopping experience. This allows
          us to provide services and features that most likely meet your needs,
          and to customize our website to make your experience safer and easier.
        </p>

        <PolicyCallout
          tone="info"
          icon={Eye}
          title="Ways We Collect Information"
        >
          <PolicyList
            tone="info"
            items={[
              "We receive and store any information you enter on our website or give us in any other way.",
              "We use the information that you provide for responding to your requests, customizing future shopping, improving our stores, and communicating with you.",
              "We store certain types of information whenever you interact with us, including cookies and web browser information.",
              "We obtain certain types of information when your web browser accesses germanbutcherbd.com or advertisements served by us.",
            ]}
          />
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="data-protection"
        index={3}
        icon={Lock}
        tone="success"
        title="Information Protection"
      >
        <PolicyCallout tone="success" icon={ShieldCheck}>
          <p className="font-medium">
            Information about our customers is an important part of our
            business, and we are not in the business of selling it to others.
          </p>
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="third-party-sharing"
        index={4}
        icon={AlertTriangle}
        tone="danger"
        title="Third-Party Information Sharing Policy"
      >
        <PolicyCallout
          tone="danger"
          icon={AlertTriangle}
          title="Important Notice: German Butcher does not share customer information with third parties for advertising or marketing purposes."
        >
          <PolicyDefinitions
            items={[
              {
                term: "No Third-Party Advertisements",
                description:
                  "We do not allow third-party advertisements on our platform that could compromise your privacy.",
              },
              {
                term: "Customer Information Protection",
                description:
                  "Any sharing of customer information with third parties would be done only under legal obligations and with proper customer consent.",
              },
              {
                term: "Merchant Responsibility",
                description:
                  "If any unauthorized sharing of customer information occurs, it shall be the sole responsibility of the merchant and appropriate legal action will be taken.",
              },
            ]}
          />
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="information-disclosure"
        index={5}
        icon={Users}
        title="When We Share Information"
      >
        <p>
          We release account and other personal information only when we believe
          release is appropriate and legally required to:
        </p>

        <PolicyCardGrid columns={4}>
          <PolicyInfoCard
            icon={Scale}
            tone="info"
            title="Legal Compliance"
            description="Comply with the law and legal requirements"
          />
          <PolicyInfoCard
            icon={ScrollText}
            tone="warning"
            title="Terms Enforcement"
            description="Enforce our Terms of Use and other agreements"
          />
          <PolicyInfoCard
            icon={ShieldCheck}
            tone="success"
            title="Safety Protection"
            description="Protect rights, property, or safety of users"
          />
          <PolicyInfoCard
            icon={AlertTriangle}
            tone="danger"
            title="Fraud Prevention"
            description="Exchange information for fraud protection"
          />
        </PolicyCardGrid>
      </PolicySection>

      <PolicySection
        id="data-security"
        index={6}
        icon={ShieldCheck}
        tone="success"
        title="Data Security Measures"
      >
        <PolicyCallout
          tone="success"
          icon={ShieldCheck}
          title="How we keep your information safe"
        >
          <PolicyList
            variant="check"
            tone="success"
            items={[
              "We implement industry-standard security measures to protect your personal information",
              "All payment information is encrypted and processed through secure payment gateways",
              "Access to customer data is restricted to authorized personnel only",
              "Regular security audits are conducted to ensure data protection",
            ]}
          />
        </PolicyCallout>
      </PolicySection>

      <PolicySection
        id="your-rights"
        index={7}
        icon={UserCheck}
        title="Your Rights"
      >
        <PolicyCallout
          tone="info"
          icon={UserCheck}
          title="As our customer, you have the right to:"
        >
          <PolicyList
            tone="info"
            items={[
              "Access and review your personal information we have collected",
              "Request corrections to any inaccurate information",
              "Request deletion of your personal data (subject to legal requirements)",
              "Opt-out of marketing communications at any time",
            ]}
          />
        </PolicyCallout>
      </PolicySection>
    </PolicyPageShell>
  );
};

export default PrivacyPolicyComponent;
