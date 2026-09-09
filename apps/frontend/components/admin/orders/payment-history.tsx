"use client";

import { PaymentsTable } from "@/app/admin/order/[id]/payments/payment-table";
import { Badge } from "@/components/ui/badge";
import type { OrderPayment } from "@/utils/types";
import { CreditCard } from "lucide-react";

interface PaymentHistoryProps {
  payments: OrderPayment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (!payments.length) return null;

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary/10 p-1.5 text-primary">
            <CreditCard className="size-3.5" />
          </span>
          <h3 className="text-sm font-semibold">Payment History</h3>
        </div>
        <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
          {payments.length} {payments.length === 1 ? "payment" : "payments"}
        </Badge>
      </div>
      <div className="overflow-x-auto p-2 sm:p-3">
        <PaymentsTable payments={payments} />
      </div>
    </section>
  );
}
