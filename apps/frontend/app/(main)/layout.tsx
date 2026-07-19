import { getUser } from "@/actions/auth";
import Copyright from "@/components/footer/copyright";
import Footer from "@/components/footer/Footer";
import WhatsAppMessengerWidget from "@/components/footer/live-chat";
import { Header } from "@/components/header";
import { MobileBottomHeader } from "@/components/header/mobile-bottom-header";
import { GoToTop } from "@/components/ui/go-to-top";

import type React from "react";
import RouteLoadingBar from "../../components/common/loading";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <div>
      <Header />
      <RouteLoadingBar
        height="3px"
        position="top"
        color="linear-gradient(270deg, #000000, #f9ecc0 53.12%, #d29835)"
      />
      <main className="flex-1">{children}</main>
      <GoToTop />
      <WhatsAppMessengerWidget />
      <MobileBottomHeader user={user} />
      <Footer />
      <Copyright />
    </div>
  );
}
