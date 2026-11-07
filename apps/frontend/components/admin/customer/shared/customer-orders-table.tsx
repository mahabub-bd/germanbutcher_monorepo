"use client";

import { ElapsedTime } from "@/components/admin/orders/elapsed-time";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import {
    getOrderStatusColor,
    getPaymentMethodColor,
    getPaymentMethodIcon,
    getPaymentStatusLabel,
    getPaymentStatusColor,
    getShippingMethodColor,
    getShippingMethodIcon,
    getStatusIcon,
} from "@/utils/order-helper";
import Link from "next/link";

/**
 * Minimal order shape both detail pages can supply: the customer page passes
 * full Order records (with payment/shipping methods), the CRM 360 endpoint
 * returns the slimmer recentOrders payload without them.
 */
export interface CustomerOrderRow {
    id: number;
    orderNo: string;
    orderStatus: string;
    paymentStatus: string;
    totalValue: number | string;
    totalDiscount?: number | string | null;
    paidAmount?: number | string | null;
    createdAt: string;
    /** Terminal timestamps behind the Elapsed Time chip. */
    deliveredAt?: string | null;
    cancelledAt?: string | null;
    paymentMethod?: { name?: string | null } | null;
    shippingMethod?: { name?: string | null } | null;
}

interface CustomerOrdersTableProps {
    orders: CustomerOrderRow[];
    /** Adds the Payment/Shipping Method columns when the payload includes them. */
    showMethodColumns?: boolean;
    /** Overrides the empty-state copy when the list has a narrower meaning. */
    emptyMessage?: string;
}

/**
 * Orders tab shared by the admin customer detail and CRM 360 pages —
 * single-line columns, status badges with icons, tabular-nums money cells.
 */
export function CustomerOrdersTable({
    orders,
    showMethodColumns = false,
    emptyMessage = "No orders yet.",
}: CustomerOrdersTableProps) {
    if (orders.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-6 text-center">
                {emptyMessage}
            </p>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border bg-card">
            <Table
                className={`${showMethodColumns ? "min-w-280" : "min-w-240"} xl:min-w-0 report-table text-sm [&_th]:h-9 [&_th]:text-sm [&_td]:py-1.5 [&_td]:text-sm`}
            >
                <TableHeader>
                    <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Order Status</TableHead>
                        <TableHead>Payment Status</TableHead>
                        {showMethodColumns && (
                            <>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Shipping Method</TableHead>
                            </>
                        )}
                        <TableHead className="text-center">Elapsed Time</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => {
                        const paidAmount = Number(order.paidAmount ?? 0);
                        const due = Number(order.totalValue) - paidAmount;
                        return (
                            <TableRow key={order.id} className="hover:bg-muted/50">
                                <TableCell className="whitespace-nowrap">
                                    <Link
                                        href={`/admin/order/${order.orderNo}/view`}
                                        className="font-medium hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                                    >
                                        {order.orderNo}
                                    </Link>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                    {formatDateTime(order.createdAt)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <Badge
                                        variant="secondary"
                                        className={`capitalize ${getOrderStatusColor(order.orderStatus)}`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {getStatusIcon(order.orderStatus)}
                                            {order.orderStatus}
                                        </span>
                                    </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    <Badge
                                        variant="secondary"
                                        className={`capitalize ${getPaymentStatusColor(order.paymentStatus)}`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {getStatusIcon(order.paymentStatus)}
                                            {getPaymentStatusLabel(order.paymentStatus)}
                                        </span>
                                    </Badge>
                                </TableCell>
                                {showMethodColumns && (
                                    <>
                                        <TableCell className="whitespace-nowrap">
                                            <Badge
                                                variant="outline"
                                                title={order.paymentMethod?.name || undefined}
                                                className={`capitalize ${getPaymentMethodColor(order.paymentMethod?.name ?? "")}`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {getPaymentMethodIcon(order.paymentMethod?.name || "")}
                                                    {order.paymentMethod?.name || "N/A"}
                                                </span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <Badge
                                                variant="outline"
                                                title={order.shippingMethod?.name || undefined}
                                                className={`capitalize ${getShippingMethodColor(order.shippingMethod?.name ?? "")}`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    {getShippingMethodIcon(order.shippingMethod?.name || "")}
                                                    {order.shippingMethod?.name || "N/A"}
                                                </span>
                                            </Badge>
                                        </TableCell>
                                    </>
                                )}
                                <TableCell className="text-center whitespace-nowrap">
                                    <ElapsedTime
                                        createdAt={order.createdAt}
                                        deliveredAt={order.deliveredAt}
                                        cancelledAt={order.cancelledAt}
                                    />
                                </TableCell>
                                <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                                    {formatCurrencyEnglish(Number(order.totalValue))}
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap tabular-nums text-green-600 dark:text-green-400">
                                    {Number(order.totalDiscount ?? 0) > 0
                                        ? `- ${formatCurrencyEnglish(Number(order.totalDiscount))}`
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap tabular-nums">
                                    {due > 0 ? (
                                        <span className="font-medium text-destructive">
                                            {formatCurrencyEnglish(due)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Paid</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
