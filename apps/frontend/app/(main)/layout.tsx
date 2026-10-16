import { getUser } from "@/actions/auth";
import { MaintenancePage } from "@/components/common/maintenance-page";
import { VisitorHeartbeat } from "@/components/common/visitor-heartbeat";
import Copyright from "@/components/footer/copyright";
import Footer from "@/components/footer/Footer";
import WhatsAppMessengerWidget from "@/components/footer/live-chat";
import { Header } from "@/components/header";
import { MobileBottomHeader } from "@/components/header/mobile-bottom-header";
import { GoToTop } from "@/components/ui/go-to-top";
import { fetchPublicData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";

import type React from "react";
import RouteLoadingBar from "../../components/common/loading";

/** True when the maintenance flag is on and (if set) now is inside the
 * optional schedule window. Evaluated per request — the layout is dynamic. */
function isMaintenanceActive(settings: BusinessSettings): boolean {
  if (settings.maintenanceMode !== true) return false;
  const now = Date.now();
  if (
    settings.maintenanceStartsAt &&
    now < new Date(settings.maintenanceStartsAt).getTime()
  ) {
    return false;
  }
  if (
    settings.maintenanceEndsAt &&
    now > new Date(settings.maintenanceEndsAt).getTime()
  ) {
    return false;
  }
  return true;
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Public settings endpoint (60s ISR). Null when the API is unreachable —
  // consumers render only what is configured in Business Settings.
  const businessSettings = await fetchPublicData<BusinessSettings>(
    "business-settings"
  ).catch(() => null);

  // Storefront-wide maintenance takeover. Admin, auth and API routes live
  // outside this layout and stay reachable.
  if (businessSettings && isMaintenanceActive(businessSettings)) {
    return <MaintenancePage settings={businessSettings} />;
  }

  return (
    <div>
      <Header settings={businessSettings} />
      <VisitorHeartbeat />
      <RouteLoadingBar
        height="3px"
        position="top"
        color="linear-gradient(270deg, #000000, #f9ecc0 53.12%, #d29835)"
      />
      <main className="flex-1">{children}</main>
      <GoToTop />
      <WhatsAppMessengerWidget business={businessSettings} />
      <MobileBottomHeader user={user} />
      <Footer settings={businessSettings} />
      <Copyright />
    </div>
  );
}
