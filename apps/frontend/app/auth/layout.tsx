import Copyright from "@/components/footer/copyright";
import Footer from "@/components/footer/Footer";
import { Header } from "@/components/header";
import { getBusinessSettings } from "@/utils/business-settings-server";
import type React from "react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const businessSettings = await getBusinessSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <Header settings={businessSettings} />
      <main className="flex-1 py-5">{children}</main>
      <Footer settings={businessSettings} />
      <Copyright />
    </div>
  );
}
