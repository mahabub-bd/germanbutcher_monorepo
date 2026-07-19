import Copyright from "@/components/footer/copyright";
import Footer from "@/components/footer/Footer";
import { Header } from "@/components/header";
import type React from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-5">{children}</main>
      <Footer />
      <Copyright />
    </div>
  );
}
