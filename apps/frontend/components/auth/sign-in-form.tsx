"use client";

import { MailIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import EmailLoginForm from "@/components/auth/email-login-form";
import MobileLoginForm from "@/components/auth/mobile-login-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SignInFormProps {
  logoUrl?: string;
  businessName?: string;
}

export default function SignInForm({ logoUrl, businessName }: SignInFormProps) {
  const [activeTab, setActiveTab] = useState("mobile");

  return (
    <AuthShell
      logoUrl={logoUrl}
      businessName={businessName}
      subtitle="Sign in to your account"
      footer={
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-primaryColor font-medium hover:underline dark:text-red-400"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
    </AuthShell>
  );
}
