"use client";

import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";

import { OrderPDFDocument } from "@/components/admin/orders/order-pdf-document";
import type { BusinessSettings, Order } from "@/utils/types";

/**
 * Generate and download the branded invoice PDF for an order. Shared by the
 * customer order list rows and the order detail page so both render the same
 * document with business-settings branding.
 */
export async function downloadOrderInvoice(
  order: Order,
  settings: BusinessSettings | null
): Promise<void> {
  try {
    const blob = await pdf(
      <OrderPDFDocument order={order} settings={settings} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `German-Butcher-Invoice-${order.orderNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    toast.error("Failed to generate invoice", {
      description: "Please try again later.",
    });
  }
}
