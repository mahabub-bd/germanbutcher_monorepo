"use client";

import {
  Beef,
  CookingPot,
  Drumstick,
  MailIcon,
  PhoneIcon,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import EmailLoginForm from "@/components/auth/email-login-form";
import MobileLoginForm from "@/components/auth/mobile-login-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SignInFormProps {
  logoUrl?: string;
  businessName?: string;
}

/** Faint decorative brand icons scattered on the backdrop, gently floating. */
const DECOR_ICONS = [
  { Icon: Beef, pos: "left-[5%] top-[12%]", size: "size-16", rotate: "-rotate-12", duration: "7s", delay: "0s" },
  { Icon: Drumstick, pos: "right-[7%] top-[9%]", size: "size-12", rotate: "rotate-12", duration: "8s", delay: "1s" },
  { Icon: UtensilsCrossed, pos: "left-[9%] bottom-[14%]", size: "size-14", rotate: "rotate-6", duration: "9s", delay: "0.5s" },
  { Icon: CookingPot, pos: "right-[10%] bottom-[16%]", size: "size-16", rotate: "-rotate-6", duration: "7.5s", delay: "2s" },
  { Icon: Beef, pos: "right-[36%] top-[5%]", size: "size-8", rotate: "rotate-45", duration: "6.5s", delay: "1.5s" },
  { Icon: Drumstick, pos: "left-[36%] bottom-[5%]", size: "size-8", rotate: "rotate-12", duration: "8.5s", delay: "0.8s" },
  { Icon: CookingPot, pos: "left-[22%] top-[38%]", size: "size-7", rotate: "rotate-3", duration: "9.5s", delay: "1.2s" },
  { Icon: UtensilsCrossed, pos: "right-[24%] top-[42%]", size: "size-7", rotate: "-rotate-6", duration: "7s", delay: "2.4s" },
  { Icon: Beef, pos: "left-[16%] top-[64%]", size: "size-9", rotate: "rotate-45", duration: "8s", delay: "0.3s" },
  { Icon: Drumstick, pos: "right-[16%] top-[62%]", size: "size-9", rotate: "-rotate-12", duration: "7.2s", delay: "1.8s" },
  { Icon: UtensilsCrossed, pos: "right-[45%] top-[22%]", size: "size-6", rotate: "rotate-12", duration: "6.8s", delay: "0.6s" },
  { Icon: CookingPot, pos: "left-[46%] bottom-[18%]", size: "size-6", rotate: "-rotate-3", duration: "7.8s", delay: "2.1s" },
];

export default function SignInForm({ logoUrl, businessName }: SignInFormProps) {
  const [activeTab, setActiveTab] = useState("mobile");

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-200px)] overflow-hidden p-4">
      {/* Soft brand-tinted backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(128,0,0,0.06),transparent_70%)] dark:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(128,0,0,0.15),transparent_70%)]"
      />

      {/* Decorative brand icons */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {DECOR_ICONS.map(({ Icon, pos, size, rotate, duration, delay }, i) => (
          <span
            key={i}
            className={`absolute ${pos} ${rotate} animate-float-soft`}
            style={{ animationDuration: duration, animationDelay: delay }}
          >
            <Icon className={`text-primaryColor/10 ${size}`} strokeWidth={1.2} />
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={businessName ?? "German Butcher"}
              width={64}
              height={64}
              priority
              className="w-16 h-16 shrink-0 rounded-2xl object-contain shadow-lg shadow-primaryColor/15 ring-1 ring-primaryColor/10 bg-white p-1"
            />
          ) : (
            <div className="flex shrink-0 items-center justify-center w-16 h-16 rounded-2xl bg-primaryColor text-white shadow-lg shadow-primaryColor/25 ring-1 ring-primaryColor/20">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
          )}
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              {businessName ?? "German Butcher"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5 overflow-hidden dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/20">
          <div className="p-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full h-11 mb-6 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger
                  value="mobile"
                  className="h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-primaryColor data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Mobile
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-primaryColor data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
                >
                  <MailIcon className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mobile">
                <MobileLoginForm />
              </TabsContent>

              <TabsContent value="email">
                <EmailLoginForm />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sign Up Link */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 dark:bg-gray-800/50 dark:border-gray-800">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-primaryColor font-medium hover:underline dark:text-red-400"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6">
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            className="hover:text-gray-600 dark:hover:text-gray-300"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="hover:text-gray-600 dark:hover:text-gray-300"
          >
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
