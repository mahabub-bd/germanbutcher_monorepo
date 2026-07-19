"use client";

import { Button } from "@/components/ui/button";
import type { Order } from "@/utils/types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { OrderPDFDocument } from "./order-pdf-document";

interface DownloadInvoiceButtonProps {
  order: Order;
  className?: string;
}

export function DownloadInvoiceButton({
  order,
  className,
}: DownloadInvoiceButtonProps) {
  return (
    <PDFDownloadLink
      document={<OrderPDFDocument order={order} />}
      fileName={`invoice-${order.orderNo}.pdf`}
      className={className}
    >
      {({ loading }) => (
        <Button className={className} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Generating PDF..." : "Download Invoice"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
