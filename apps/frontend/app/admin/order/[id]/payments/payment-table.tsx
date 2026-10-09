"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { OrderPayment } from "@/utils/types";
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Wallet,
  XCircle,
} from "lucide-react";

interface PaymentsTableProps {
  payments: OrderPayment[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  // Icon per payment method name; falls back to a generic wallet.
  const getMethodIcon = (methodName: string) => {
    const name = methodName.toLowerCase();
    if (name.includes("cash") || name.includes("cod"))
      return <Banknote className="h-4 w-4 text-muted-foreground" />;
    if (name.includes("card") || name.includes("ssl") || name.includes("online"))
      return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    if (name.includes("bkash") || name.includes("nagad") || name.includes("wallet"))
      return <Wallet className="h-4 w-4 text-muted-foreground" />;
    return <Banknote className="h-4 w-4 text-muted-foreground" />;
  };

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
        <span className="flex items-center gap-2">
          {getMethodIcon(payment.paymentMethod?.name || "")}
          {payment.paymentMethod?.name || "N/A"}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {payment.sslPaymentId || "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {payment.notes || "-"}
      </TableCell>
      <TableCell>{payment.createdBy?.name || "System"}</TableCell>
      <TableCell>
        <StatusBadge status="completed" />
      </TableCell>
    </TableRow>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const statusVariant: Record<string, { bg: string; text: string }> = {
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
      },
      failed: {
        bg: "bg-red-100",
        text: "text-red-800",
      },
      default: {
        bg: "bg-gray-100",
        text: "text-gray-800",
      },
    };

    const variant = statusVariant[status] || statusVariant.default;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
          variant.bg,
          variant.text
        )}
      >
        {status === "completed" ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : status === "pending" ? (
          <Clock className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        {status}
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
          <TableHead>Note</TableHead>
          <TableHead>Updated By</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments?.length > 0 ? (
          payments.map(renderPaymentRow)
        ) : (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              No payments found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
