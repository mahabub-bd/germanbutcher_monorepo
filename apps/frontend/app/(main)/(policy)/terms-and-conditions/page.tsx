import { HeadingPrimary } from "@/components/common/heading-primary";
import {
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import React from "react";

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-4 rounded-full">
              <FileText className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <HeadingPrimary
            title="Terms and Conditions"
            subtitle="Please read these terms carefully before using our services. By using German Butcher's website and services, you agree to these terms."
          />
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Building className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Introduction</h2>
            </div>
            <p className="text-gray-700 mb-4">
              These Terms and Conditions govern your use of the{" "}
              <span className="font-semibold">German Butcher</span> website
              located at{" "}
              <span className="font-semibold">germanbutcherbd.com</span> and any
              related services provided by German Butcher.
            </p>
          </div>

          {/* Acceptance of Terms */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
            </div>
            <p className="text-gray-700">
              By accessing and using this website, you accept and agree to be
              bound by the terms and provision of this agreement. If you do not
              agree to abide by the above, please do not use this service.
            </p>
          </div>

          {/* Products and Services */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Truck className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Products and Services</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                German Butcher provides high-quality fresh meat, sausages, and
                related food products through our online platform.
              </p>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Delivery Timeline
                </h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                    <span className="font-semibold">Inside Dhaka : </span> 5
                    days from order confirmation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                    <span className="font-semibold">Outside Dhaka : </span> 10
                    days from order confirmation
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">
                Product Stock and Availability
              </h2>
            </div>
            <div className="space-y-3 text-gray-700">
              <p>
                All product stock quantities and availability status are clearly
                displayed on our website:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Product stock quantities are shown in the product description
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Out-of-stock items are clearly marked with &quot;Out of
                  Stock&quot; labels
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Stock status is indicated as &quot;Available/Unavailable&quot;
                  or &quot;In Stock/Out of Stock&quot;
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Numerical stock quantities are displayed where applicable
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <CreditCard className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Payment Terms</h2>
            </div>
            <div className="space-y-3 text-gray-700">
              <p>
                Payment must be made in full before order processing. We accept
                various payment methods including:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Credit and Debit Cards
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Mobile Banking (bKash, Nagad, Rocket)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Bank Transfer
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Cash on Delivery (where available)
                </li>
              </ul>
            </div>
          </div>

          {/* Order Agreement */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Order Agreement</h2>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 font-medium mb-3">
                By placing an order, you agree to the following:
              </p>
              <ul className="space-y-2 text-yellow-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-2"></span>
                  You have read and agreed to our Terms and Conditions
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-2"></span>
                  You have read and accepted our Privacy Policy
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-2"></span>
                  You understand our Return and Refund Policy
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-2"></span>
                  All information provided is accurate and complete
                </li>
              </ul>
            </div>
          </div>

          {/* User Responsibilities */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">User Responsibilities</h2>
            </div>
            <div className="space-y-3 text-gray-700">
              <p>As a user of our website and services, you agree to:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Provide accurate and complete information during registration
                  and ordering
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Use the website only for lawful purposes
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Not engage in any activity that could harm our website or
                  services
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-gray-700 rounded-full mt-2 mr-2"></span>
                  Respect intellectual property rights
                </li>
              </ul>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="border-b pb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Limitation of Liability</h2>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-800">
                German Butcher shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other
                intangible losses, resulting from your use of our services.
              </p>
            </div>
          </div>

          {/* Governing Law */}
          <div className="">
            <div className="flex items-center mb-4">
              <Building className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Governing Law</h2>
            </div>
            <p className="text-gray-700">
              These Terms and Conditions are governed by and construed in
              accordance with the laws of Bangladesh. Any disputes arising under
              these terms shall be subject to the exclusive jurisdiction of the
              courts of Bangladesh.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center mt-8 md:p-6 p-2 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Questions About These Terms?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            If you have any questions about these Terms and Conditions, please
            contact us.
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
            These Terms and Conditions were last updated on 27 July 2025. We
            reserve the right to update these terms at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
