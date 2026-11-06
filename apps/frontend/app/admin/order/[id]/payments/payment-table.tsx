"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { getPaymentMethodColor, getPaymentMethodIcon } from "@/utils/order-helper";
import { OrderPayment } from "@/utils/types";
import { CheckCircle2, RefreshCw } from "lucide-react";

interface PaymentsTableProps {
  payments: OrderPayment[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const renderPaymentRow = (payment: OrderPayment) => (
    <TableRow key={payment.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
      <TableCell className="font-medium">
        {formatCurrencyEnglish(Number.parseFloat(payment.amount))}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDateTime(payment.paymentDate)}
      </TableCell>
      <TableCell>
        {/* Same badge as the orders list rows for visual consistency. */}
        <Badge
          variant="outline"
          title={payment.paymentMethod?.name || undefined}
          className={`capitalize max-w-32 lg:max-w-none truncate ${getPaymentMethodColor(payment.paymentMethod?.name)}`}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {getPaymentMethodIcon(payment.paymentMethod?.name || "")}
            <span className="truncate">
              {payment.paymentMethod?.name || "N/A"}
            </span>
          </span>
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {payment.sslPaymentId || "-"}
      </TableCell>
      <TableCell>{payment.createdBy?.name || "System"}</TableCell>
      <TableCell>
        {/* Payments carry no status column — a row exists because money
            moved, so the badge reflects its type: Paid vs Refund. */}
        <StatusBadge isRefund={payment.paymentType?.toUpperCase() === "REFUND"} />
      </TableCell>
    </TableRow>
  );

  const StatusBadge = ({ isRefund }: { isRefund: boolean }) => {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
          isRefund
            ? "bg-orange-100 text-orange-800"
            : "bg-green-100 text-green-800"
        )}
      >
        {isRefund ? (
          <RefreshCw className="h-3 w-3" />
        ) : (
          <CheckCircle2 className="h-3 w-3" />
        )}
        {isRefund ? "Refund" : "Paid"}
      </span>
    );
  };

  return (
    <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
      <TableHeader>
        <TableRow>
          <TableHead>Payment #</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Updated By</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments?.length > 0 ? (
          payments.map(renderPaymentRow)
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              No payments found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
