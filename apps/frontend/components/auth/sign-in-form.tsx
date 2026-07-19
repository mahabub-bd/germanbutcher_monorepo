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
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4 ">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primaryColor text-white mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">German Butcher</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="mobile">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Mobile
                </TabsTrigger>
                <TabsTrigger value="email">
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
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="text-primaryColor font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="hover:text-gray-600">Terms</Link> and{" "}
          <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
        </p>
      </div>
    </div>
  );
}
