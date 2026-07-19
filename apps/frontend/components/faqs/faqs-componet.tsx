"use client";

import { faqData } from "@/constants";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  HelpCircle,
  Shield,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { HeadingPrimary } from "../common/heading-primary";

const categories = [
  { name: "All", icon: HelpCircle },
  { name: "Products & Quality", icon: Shield },
  { name: "Orders & Shopping", icon: ShoppingCart },
  { name: "Delivery & Shipping", icon: Truck },
  { name: "Payment & Pricing", icon: CreditCard },
  { name: "Returns & Support", icon: Users },
];

const FAQPageComponent: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = faqData.filter((faq) => {
    const matchesCategory =
      selectedCategory === "All" || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <HelpCircle className="w-8 h-8 text-gray-700" />
            </div>
          </div>
          <HeadingPrimary
            title=" Frequently Asked Questions"
            subtitle="  Find answers to common questions about German Butcher products,
            orders, delivery, and more."
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
            <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm ${
                    selectedCategory === category.name
                      ? "bg-primaryColor text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-3 h-3 mr-1.5" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No FAQs Found
              </h3>
              <p className="text-gray-600 text-sm">
                Try adjusting your search or category filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="p-4">
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full text-left flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {faq.question}
                      </h3>
                      <span className="text-xs text-gray-500 mt-1 inline-block">
                        {faq.category}
                      </span>
                    </div>
                    <div className="ml-4">
                      {openItems.includes(faq.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </button>
                  {openItems.includes(faq.id) && (
                    <div className="mt-3 text-gray-700 text-sm">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQPageComponent;
