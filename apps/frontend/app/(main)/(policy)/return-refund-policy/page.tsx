import { HeadingPrimary } from "@/components/common/heading-primary";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Shield,
  XCircle,
} from "lucide-react";
import React from "react";

const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-2">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <RefreshCw className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <HeadingPrimary
            title="Return and Refund Policy"
            subtitle="We want you to be completely satisfied with your purchase from German Butcher. Learn about our return and refund process."
          />
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Return Window */}
          <div className="rounded-lg md:p-6 p-2">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Return Window</h2>
            </div>
            <p className="text-gray-700 mb-4">
              You have <span className="font-semibold">7 days</span> from the
              date of delivery to return eligible items for a full refund. For
              perishable food items, returns must be initiated within{" "}
              <span className="font-semibold">24 hours</span> of delivery.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm">Non-perishable items: 7 days</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                <span className="text-sm">Perishable items: 24 hours</span>
              </div>
            </div>
          </div>

          {/* Refund Processing Timeline */}
          <div className="rounded-lg md:p-6 p-2 bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-4">
              <CreditCard className="w-5 h-5 text-blue-700 mr-3" />
              <h2 className="text-xl font-semibold text-blue-900">
                Refund Processing Timeline
              </h2>
            </div>
            <p className="text-blue-800 mb-4">
              After we receive and approve your return request, refunds will be
              processed within{" "}
              <span className="font-bold">7 to 10 working days</span>. The
              actual time for the refund to reflect in your account may vary
              depending on your payment method and banking institution.
            </p>
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Processing Timeline by Payment Method:
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Credit/Debit Card refunds: 7-10 working days
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Mobile Banking: 7-10 working days
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                  Bank Transfer: 7-10 working days
                </li>
              </ul>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="rounded-lg md:p-6 p-2 bg-orange-50 border border-orange-200">
            <div className="flex items-center mb-4">
              <XCircle className="w-5 h-5 text-orange-700 mr-3" />
              <h2 className="text-xl font-semibold text-orange-900">
                Cancellation Policy
              </h2>
            </div>
            <div className="space-y-3 text-orange-800">
              <p>
                <span className="font-semibold">Order Cancellation:</span> You
                can cancel your order within{" "}
                <span className="font-bold">2 hours</span> of placing it,
                provided it hasn&quot;t been processed for delivery.
              </p>
              <p>
                <span className="font-semibold">After Processing:</span> Once
                your order has been processed and is out for delivery,
                cancellation may not be possible. In such cases, you may return
                the items as per our return policy.
              </p>
              <p>
                <span className="font-semibold">Perishable Items:</span> Due to
                the nature of fresh meat and perishable products, cancellations
                after processing may not be accepted unless there are quality
                issues.
              </p>
            </div>
          </div>

          {/* Eligible Items */}
          <div className="rounded-lg md:p-6 p-2">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">
                Eligible Items for Return
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Returnable Items
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></span>
                    Unopened packaged items in original condition
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></span>
                    Defective or damaged products
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></span>
                    Wrong items delivered
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-2"></span>
                    Non-perishable specialty items
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Non-Returnable Items
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2"></span>
                    Opened or consumed perishable items
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2"></span>
                    Custom-made or special order items
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2"></span>
                    Items without original packaging
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2"></span>
                    Items past the return window
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Return Process */}
          <div className="rounded-lg md:p-6 p-2">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">How to Return Items</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Contact Customer Service",
                  description:
                    "Call us at +8809666791991 or email support@germanbutcherbd.com to initiate a return request.",
                },
                {
                  step: "2",
                  title: "Get Return Authorization",
                  description:
                    "Our team will provide you with a return authorization number and instructions for returning the item.",
                },
                {
                  step: "3",
                  title: "Package & Send",
                  description:
                    "Package the item in its original packaging with the return authorization number and send it back to us.",
                },
                {
                  step: "4",
                  title: "Inspection & Processing",
                  description:
                    "Once we receive and inspect the returned item, we'll approve the return and process your refund.",
                },
                {
                  step: "5",
                  title: "Receive Refund",
                  description:
                    "Your refund will be processed within 7-10 working days and credited to your original payment method.",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-4">
                  <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="rounded-lg md:p-6 p-2">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold">Important Notes</h2>
            </div>

            <div className="">
              <ul className="space-y-3 text-sm text-gray-700">
                {[
                  "Shipping costs are non-refundable unless the return is due to our error or a defective product.",
                  "Customers are responsible for return shipping costs unless otherwise specified.",
                  "Refunds will be processed in the same currency as the original purchase.",
                  "For health and safety reasons, we cannot accept returns of opened perishable items unless they are defective.",
                  "Orders can be cancelled within 2 hours of placement if not yet processed for delivery.",
                  "Refund processing takes 7-10 working days from the date of return approval.",
                  "This policy may be updated from time to time. Please check our website for the most current version.",
                ].map((note, index) => (
                  <li key={index} className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center mt-8 md:p-6 p-2 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need Help?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Our customer service team is here to help with any questions about
            returns, refunds, or cancellations.
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
            Customer service hours: Sunday - Thursday, 9:00 AM - 6:00 PM (GMT+6)
          </p>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
