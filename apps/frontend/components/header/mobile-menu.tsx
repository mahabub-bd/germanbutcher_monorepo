"use client";

import { LayoutGrid, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GermanbutcherLogo } from "@/public/images";
import { User } from "@/utils/types";
import MobileAuth from "../auth/mobile-auth";
import { CategoryLinks } from "./category-links";
import { NavLinks } from "./nav-links";

type TabType = "navigation" | "categories";

export function MobileMenu({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("categories");

  const handleClose = () => setIsOpen(false);
  const currentYear = new Date().getFullYear();

  const tabs = [
    { id: "navigation" as TabType, label: "Menu", count: 5, icon: Menu },
    {
      id: "categories" as TabType,
      label: "Categories",
      count: null,
      icon: LayoutGrid,
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-xl p-0 hover:bg-black/10 bg-black/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5 text-white" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" showClose={false} className="w-[375px] p-0">
        {/* Hidden title for accessibility */}
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="border-b border-primaryColor/20 bg-gradient-to-br from-primaryColor/15 via-white to-secondaryColor/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="group flex items-center gap-3 rounded-xl pr-2 transition-opacity hover:opacity-80"
                aria-label="Go to homepage"
                onClick={handleClose}
              >
                <span className="flex size-14 items-center justify-center rounded-2xl border border-white bg-white p-1.5 shadow-sm">
                  <Image
                    src={
                      GermanbutcherLogo ||
                      "/placeholder.svg?height=32&width=32&query=German Butcher logo"
                    }
                    alt="German Butcher logo"
                    width={44}
                    height={44}
                    className="max-h-full max-w-full object-contain"
                  />
                </span>
                <span className="text-left leading-tight">
                  <span className="block font-castor text-xl text-primaryColor">
                    German Butcher
                  </span>
                  <span className="block pt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Quality meats
                  </span>
                </span>
              </Link>

              <SheetClose
                className="group flex size-10 shrink-0 items-center justify-center rounded-xl border border-primaryColor/20 bg-white/80 text-primaryColor shadow-sm transition-all hover:scale-105 hover:bg-primaryColor hover:text-white focus:outline-none focus:ring-2 focus:ring-primaryColor/30"
                aria-label="Close navigation menu"
              >
                <X className="size-5 transition-transform duration-200 group-hover:rotate-90" />
                <span className="sr-only">Close navigation menu</span>
              </SheetClose>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-100 bg-white px-4 py-3">
            <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-primaryColor shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="size-4" />
                  <span className="truncate">{tab.label}</span>
                  {tab.count && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                        activeTab === tab.id
                          ? "bg-primaryColor/10 text-primaryColor"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              {activeTab === "categories" && (
                <CategoryLinks onCategoryClick={handleClose} />
              )}

              {activeTab === "navigation" && (
                <div className="space-y-2">
                  <NavLinks isMobile={true} onClick={handleClose} />
                </div>
              )}
            </div>
          </div>

          {/* Auth Section in Footer */}
          <div className=" p-4">
            <MobileAuth user={user} onClose={handleClose} />
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t-2 border-[#deb149] bg-gradient-to-r from-black/95 via-gray-900/95 to-black/95">
            <div className="text-center">
              <p className="text-xs text-gray-100 ">
                © {currentYear} German Butcher. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
