"use client";

import { MailIcon, PhoneIcon, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import EmailLoginForm from "@/components/auth/email-login-form";
import MobileLoginForm from "@/components/auth/mobile-login-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignInForm() {
  const [activeTab, setActiveTab] = useState("mobile");

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      {/* Soft brand-tinted backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(128,0,0,0.06),transparent_70%)] dark:bg-[radial-gradient(60%_50%_at_50%_0%,rgba(128,0,0,0.15),transparent_70%)]"
      />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex shrink-0 items-center justify-center w-16 h-16 rounded-2xl bg-primaryColor text-white shadow-lg shadow-primaryColor/25 ring-1 ring-primaryColor/20">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              German Butcher
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
