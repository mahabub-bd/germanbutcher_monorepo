import { HeadingPrimary } from "@/components/common/heading-primary";
import {
  AlertTriangle,
  Database,
  Eye,
  FileText,
  Lock,
  Shield,
  Users,
} from "lucide-react";
import React from "react";

const PrivacyPolicyComponent: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-4 rounded-full">
              <Shield className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <HeadingPrimary
            title="Privacy Policy"
            subtitle="Your privacy is important to us. Learn how we collect, use, and protect your information."
          />
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Introduction</h2>
            </div>
            <p className="text-gray-700">
              This Privacy Policy manages the manner in which{" "}
              <span className="font-semibold">German Butcher</span> collects,
              uses, maintains and discloses information collected from users of
              the <span className="font-semibold">germanbutcherbd.com</span>{" "}
              website or any kind of platform such as mobile applications. This
              privacy policy is applicable for the Site with all products and
              services offered by German Butcher.
            </p>
          </div>

          {/* Information Collection */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Database className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">
                How We Collect Information
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              When you use our website, we collect and store your personal
              information which is provided by you. Our goal in doing so is to
              provide you a safe, efficient, smooth shopping experience. This
              allows us to provide services and features that most likely meet
              your needs, and to customize our website to make your experience
              safer and easier.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-gray-700" />
                Ways We Collect Information
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  We receive and store any information you enter on our website
                  or give us in any other way.
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  We use the information that you provide for responding to your
                  requests, customizing future shopping, improving our stores,
                  and communicating with you.
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  We store certain types of information whenever you interact
                  with us, including cookies and web browser information.
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  We obtain certain types of information when your web browser
                  accesses germanbutcherbd.com or advertisements served by us.
                </li>
              </ul>
            </div>
          </div>

          {/* Information Protection */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Lock className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Information Protection</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-gray-700 font-medium">
                Information about our customers is an important part of our
                business, and we are not in the business of selling it to
                others.
              </p>
            </div>
          </div>

          {/* Third-Party Information Sharing */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-red-800">
                Third-Party Information Sharing Policy
              </h2>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-800 font-medium mb-3">
                <strong>Important Notice:</strong> German Butcher does not share
                customer information with third parties for advertising or
                marketing purposes.
              </p>
              <div className="space-y-2 text-red-700">
                <p>
                  <span className="font-semibold">
                    No Third-Party Advertisements:
                  </span>{" "}
                  We do not allow third-party advertisements on our platform
                  that could compromise your privacy.
                </p>
                <p>
                  <span className="font-semibold">
                    Customer Information Protection:
                  </span>{" "}
                  Any sharing of customer information with third parties would
                  be done only under legal obligations and with proper customer
                  consent.
                </p>
                <p>
                  <span className="font-semibold">
                    Merchant Responsibility:
                  </span>{" "}
                  If any unauthorized sharing of customer information occurs, it
                  shall be the sole responsibility of the merchant and
                  appropriate legal action will be taken.
                </p>
              </div>
            </div>
          </div>

          {/* Information Disclosure */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">
                When We Share Information
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              We release account and other personal information only when we
              believe release is appropriate and legally required to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Legal Compliance",
                  description: "Comply with the law and legal requirements",
                  iconColor: "text-blue-500",
                  bgColor: "bg-blue-50",
                  borderColor: "border-blue-200",
                },
                {
                  title: "Terms Enforcement",
                  description: "Enforce our Terms of Use and other agreements",
                  iconColor: "text-orange-500",
                  bgColor: "bg-orange-50",
                  borderColor: "border-orange-200",
                },
                {
                  title: "Safety Protection",
                  description: "Protect rights, property, or safety of users",
                  iconColor: "text-green-500",
                  bgColor: "bg-green-50",
                  borderColor: "border-green-200",
                },
                {
                  title: "Fraud Prevention",
                  description: "Exchange information for fraud protection",
                  iconColor: "text-red-500",
                  bgColor: "bg-red-50",
                  borderColor: "border-red-200",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`${item.bgColor} p-4 rounded-lg border ${item.borderColor}`}
                >
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Security */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Data Security Measures</h2>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <ul className="space-y-2 text-green-800">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-2 mr-2"></span>
                  We implement industry-standard security measures to protect
                  your personal information
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-2 mr-2"></span>
                  All payment information is encrypted and processed through
                  secure payment gateways
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-2 mr-2"></span>
                  Access to customer data is restricted to authorized personnel
                  only
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-green-600 rounded-full mt-2 mr-2"></span>
                  Regular security audits are conducted to ensure data
                  protection
                </li>
              </ul>
            </div>
          </div>

          {/* Customer Rights */}
          <div className="">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Your Rights</h2>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-800 mb-3 font-medium">
                As our customer, you have the right to:
              </p>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></span>
                  Access and review your personal information we have collected
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></span>
                  Request corrections to any inaccurate information
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></span>
                  Request deletion of your personal data (subject to legal
                  requirements)
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2"></span>
                  Opt-out of marketing communications at any time
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center mt-8 md:p-6 p-2 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Privacy Questions?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            If you have any questions about this Privacy Policy or how we handle
            your data, please contact us.
          </p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:justify-center sm:space-x-6 sm:space-y-0">
            <a
              href="tel:+8809666791991"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
            >
              📞 +8809666791991
            </a>
            <a
              href="mailto:support@germanbutcherbd.com"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base break-all"
            >
              ✉️ support@germanbutcherbd.com
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            This Privacy Policy was last updated on 27 July 2025. We may update
            this policy from time to time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyComponent;
