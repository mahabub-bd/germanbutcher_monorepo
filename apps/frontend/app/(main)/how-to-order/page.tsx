import { HeadingPrimary } from "@/components/common/heading-primary";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import React from "react";

// Types
interface OrderStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

interface DeliveryOption {
  title: string;
  details: string[];
  icon: React.ReactNode;
  recommended?: boolean;
}

interface PaymentMethod {
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface ContactMethod {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
  available: string;
}

// Data
const orderSteps: OrderStep[] = [
  {
    icon: <ShoppingCart className="w-8 h-8 text-red-600" />,
    title: "Browse Our Selection",
    description:
      "Explore our premium meats and specialty products in our online store.",
    badge: "Start Here",
  },
  {
    icon: <CreditCard className="w-8 h-8 text-red-600" />,
    title: "Place Your Order",
    description:
      "Add items to your cart and proceed through our secure checkout.",
  },
  {
    icon: <Truck className="w-8 h-8 text-red-600" />,
    title: "Delivery or Pickup",
    description: "Choose between home delivery or store pickup at checkout.",
  },
  {
    icon: <Shield className="w-8 h-8 text-red-600" />,
    title: "Enjoy Quality Meats",
    description:
      "Receive your order and enjoy German Butcher's premium quality.",
    badge: "Quality Assured",
  },
];

const deliveryOptions: DeliveryOption[] = [
  {
    title: "Home Delivery",
    icon: <Truck className="w-6 h-6 text-red-600" />,
    details: [
      "Dhaka Metro: Next-day delivery",
      "Outside Dhaka: 2-3 business days",
      "Delivery fee based on location",
      "Temperature-controlled transport",
    ],
    recommended: true,
  },
  {
    title: "Store Pickup",
    icon: <MapPin className="w-6 h-6 text-red-600" />,
    details: [
      "Available at all German Butcher locations",
      "Ready in 2 hours after ordering",
      "No pickup fees",
      "Fresh preparation on-site",
    ],
  },
];

const paymentMethods: PaymentMethod[] = [
  {
    name: "Credit/Debit Cards",
    icon: <CreditCard className="w-8 h-8 text-blue-600" />,
    description: "Visa, Mastercard, American Express",
  },
  {
    name: "Mobile Banking",
    icon: <Phone className="w-8 h-8 text-green-600" />,
    description: "bKash, Nagad, Rocket",
  },
  {
    name: "Cash on Delivery",
    icon: <Truck className="w-8 h-8 text-orange-600" />,
    description: "Pay when you receive your order",
  },
];

const contactMethods: ContactMethod[] = [
  {
    icon: <Phone className="w-8 h-8 text-red-600" />,
    title: "Call Us",
    description: "Speak directly with our support team",
    action: "+8809666791991",
    href: "tel:+8809666791991",
    available: "9 AM - 6 PM, Daily",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-red-600" />,
    title: "Live Chat",
    description: "Get instant help through our online chat",
    action: "Start Chat Now",
    href: "#",
    available: "24/7 Available",
  },
];

// Components
const OrderStepCard: React.FC<{ step: OrderStep }> = ({ step }) => (
  <div className="relative bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ">
      {step.icon}
    </div>

    <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>
    <p className="text-gray-600 leading-relaxed">{step.description}</p>
  </div>
);

const DeliveryOptionCard: React.FC<{ option: DeliveryOption }> = ({
  option,
}) => (
  <div
    className={`relative border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
      option.recommended
        ? "border-red-200 bg-red-50 hover:border-red-300"
        : "border-gray-200 bg-white hover:border-gray-300"
    }`}
  >
    {option.recommended && (
      <div className="absolute -top-3 right-4">
        <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center">
          <Star className="w-3 h-3 mr-1" />
          Recommended
        </span>
      </div>
    )}

    <div className="flex items-center mb-4">
      {option.icon}
      <h3 className="text-xl font-semibold ml-3 text-gray-900">
        {option.title}
      </h3>
    </div>

    <ul className="space-y-3">
      {option.details.map((detail, i) => (
        <li key={i} className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">{detail}</span>
        </li>
      ))}
    </ul>
  </div>
);

const PaymentMethodCard: React.FC<{ method: PaymentMethod }> = ({ method }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 text-center group">
    <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
      {method.icon}
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{method.name}</h3>
    <p className="text-sm text-gray-600">{method.description}</p>
  </div>
);

const ContactMethodCard: React.FC<{ method: ContactMethod }> = ({ method }) => (
  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300">
    <div className="flex justify-center mb-4">{method.icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">{method.title}</h3>
    <p className="text-gray-600 mb-3">{method.description}</p>
    <div className="flex items-center justify-center mb-3">
      <Clock className="w-4 h-4 text-gray-400 mr-2" />
      <span className="text-sm text-gray-500">{method.available}</span>
    </div>
    <a
      href={method.href}
      className="inline-block text-red-600 font-medium hover:text-red-800 transition-colors duration-200 hover:underline"
    >
      {method.action}
    </a>
  </div>
);

const HowToOrderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ordering Steps */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <HeadingPrimary
            title="Simple Ordering Process"
            subtitle=" Follow these easy steps to get German Butcher's premium
            products delivered to your door"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {orderSteps.map((step, index) => (
            <OrderStepCard key={index} step={step} />
          ))}
        </div>
      </div>

      {/* Delivery Options */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Delivery Options
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the delivery method that works best for you
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {deliveryOptions.map((option, index) => (
              <DeliveryOptionCard key={index} option={option} />
            ))}
          </div>

          <div className="bg-yellow-50 p-8 rounded-xl border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold mb-4 text-yellow-800 flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              Important Delivery Notes
            </h3>
            <ul className="space-y-3 text-yellow-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Perishable items require immediate refrigeration upon delivery
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Delivery times may vary during holidays and peak seasons
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                Someone must be present to receive the order
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Payment Options
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We accept multiple secure payment methods for your convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {paymentMethods.map((method, index) => (
              <PaymentMethodCard key={index} method={method} />
            ))}
          </div>

          <div className="bg-green-50 p-8 rounded-xl border-l-4 border-green-400 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600 mr-3" />
              100% Secure Payments
            </h3>
            <p className="text-center text-green-700 leading-relaxed">
              All transactions are encrypted and secure. We never store your
              payment information. Your financial data is protected by
              industry-standard security measures.
            </p>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Need Help Ordering?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Our friendly customer service team is ready to assist you with any
            questions about your order
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <ContactMethodCard key={index} method={method} />
            ))}
          </div>

          <div className="mt-12 p-6 bg-primaryColor/10 rounded-xl border border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Questions About Specific Products?
            </h3>
            <p className=" mb-4">
              Our meat experts can help you choose the perfect cuts for your
              needs
            </p>
            <Link
              href="/contact-us"
              className="bg-primaryColor text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
            >
              Contact Our Experts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToOrderPage;
