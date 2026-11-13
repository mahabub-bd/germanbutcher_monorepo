"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { PillBadge } from "@/components/common/pill-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import { fetchProtectedData, postData } from "@/utils/api-utils";
import type { AbandonedCartDetail } from "@/utils/types";
import {
  ArrowLeft,
  Clock,
  Mail,
  MessageSquareText,
  Package,
  Phone,
  ShoppingCart,
  Tag,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 2,
});

/** Human "abandoned for" label from the cart's last-activity timestamp. */
function abandonedFor(value: string): string {
  const ms = Date.now() - new Date(value).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${Math.max(hours, 1)} hours`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}

/** Details for a single abandoned cart: customer header and the exact line
 * items that were left behind. Reached from the Abandoned Carts report. */
export function AbandonedCartDetail() {
  const params = useParams();
  const router = useRouter();
  const cartId = params?.id as string;

  const [detail, setDetail] = useState<AbandonedCartDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProtectedData<AbandonedCartDetail>(
        `cart/reports/abandoned/${cartId}`
      );
      setDetail(data);
    } catch (error) {
      console.error("Error fetching abandoned cart details:", error);
      setDetail(null);
      toast.error("Could not load this abandoned cart.");
    } finally {
      setIsLoading(false);
    }
  }, [cartId]);

  useEffect(() => {
    if (cartId) {
      fetchDetail();
    }
  }, [cartId, fetchDetail]);

  const backToReport = () => router.push("/admin/crm/abandoned-carts");

  const sendReminder = async () => {
    setIsSending(true);
    try {
      const response = await postData<{ sentTo: string }>(
        `cart/reports/abandoned/${cartId}/remind`
      );
      toast.success(response.message || "Reminder email sent.");
    } catch (error) {
      console.error("Error sending reminder email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send the reminder email."
      );
    } finally {
      setIsSending(false);
    }
  };

  const sendReminderSms = async () => {
    setIsSendingSms(true);
    try {
      const response = await postData<{ sentTo: string }>(
        `cart/reports/abandoned/${cartId}/remind-sms`
      );
      toast.success(response.message || "Reminder SMS sent.");
    } catch (error) {
      console.error("Error sending reminder SMS:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not send the reminder SMS."
      );
    } finally {
      setIsSendingSms(false);
    }
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading abandoned cart..." />;
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="rounded-full bg-muted p-4">
          <ShoppingCart className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Abandoned cart not found</h2>
          <p className="text-sm text-muted-foreground">
            This cart may have been checked out, cleared, or never existed.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={backToReport}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back to report
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title={`Abandoned cart #${detail.cartId}`}
        description="Items this customer left in their cart without checking out."
        className="mb-0"
      >
        {detail.userId > 0 && (
          <Button variant="outline" size="sm" className="text-xs" asChild>
            <Link href={`/admin/customer/${detail.userId}/view`}>
              <UserIcon className="size-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">View customer</span>
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          className="text-xs"
          onClick={sendReminder}
          disabled={isSending || !detail.email}
          title={
            detail.email
              ? `Send a reminder email to ${detail.email}`
              : "This customer has no email on file"
          }
        >
          <Mail
            className={cn("size-3.5 sm:mr-1.5", isSending && "animate-pulse")}
          />
          <span className="hidden sm:inline">
            {isSending ? "Sending..." : "Send Mail"}
          </span>
        </Button>
        <Button
          size="sm"
          className="text-xs"
          onClick={sendReminderSms}
          disabled={isSendingSms || !detail.mobileNumber}
          title={
            detail.mobileNumber
              ? `Send a reminder SMS to ${detail.mobileNumber}`
              : "This customer has no mobile number on file"
          }
        >
          <MessageSquareText
            className={cn(
              "size-3.5 sm:mr-1.5",
              isSendingSms && "animate-pulse"
            )}
          />
          <span className="hidden sm:inline">
            {isSendingSms ? "Sending..." : "Send SMS"}
          </span>
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={backToReport}>
          <ArrowLeft className="size-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Back to report</span>
        </Button>
      </PageHeader>

      {/* Customer + abandonment summary */}
      <div className="mt-4 rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted text-xl font-semibold uppercase text-muted-foreground">
            {detail.userName?.charAt(0) || "?"}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold capitalize">
              {detail.userName || "Guest cart"}
            </h2>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              {detail.mobileNumber && (
                <span className="flex items-center gap-1 tabular-nums">
                  <Phone className="size-3" /> {detail.mobileNumber}
                </span>
              )}
              {detail.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" /> {detail.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> Last activity{" "}
                {formatDateTime(detail.updatedAt)}
              </span>
            </div>
          </div>
          <PillBadge tone="amber" className="ml-auto hidden shrink-0 sm:inline-flex">
            Abandoned {abandonedFor(detail.updatedAt)}
          </PillBadge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatsCard
            icon={Package}
            title="Line Items"
            value={String(detail.items.length)}
            description="Distinct products"
            bgColor="blue"
          />
          <StatsCard
            icon={ShoppingCart}
            title="Total Quantity"
            value={detail.itemCount.toLocaleString("en-US")}
            description="Units left in cart"
            bgColor="amber"
          />
          <StatsCard
            icon={Tag}
            title="Cart Value"
            value={currency.format(detail.subtotal)}
            description="At current selling prices"
            bgColor="green"
          />
        </div>
      </div>

      {/* Line items */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Package className="size-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Cart items</h3>
              <p className="text-xs text-muted-foreground">
                {detail.items.length} products · Amounts in ৳
              </p>
            </div>
          </div>
          <PillBadge className="font-medium tabular-nums">
            Subtotal {currency.format(detail.subtotal)}
          </PillBadge>
        </div>

        {detail.items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            This cart has no items.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="report-table [&_td]:px-1.5 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th]:px-1.5 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                <TableHeader className="[&_th]:font-semibold">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.map((item) => (
                    <TableRow key={item.cartItemId}>
                      <TableCell className="py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="relative size-9 shrink-0 overflow-hidden rounded-md border bg-muted">
                            <Image
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="36px"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {item.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.stock > 0
                                ? `${item.stock.toLocaleString("en-US")} in stock`
                                : "Out of stock"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {item.unitPrice.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <PillBadge className="font-medium tabular-nums">
                          {item.quantity}
                        </PillBadge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {item.lineTotal.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {detail.items.map((item) => (
                <article key={item.cartItemId} className="flex items-center gap-3 p-3.5">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {item.quantity} ×{" "}
                      {item.unitPrice.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    ৳
                    {item.lineTotal.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </article>
              ))}
            </div>

            {/* Footer subtotal */}
            <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {detail.itemCount} unit{detail.itemCount === 1 ? "" : "s"} ·{" "}
                {detail.items.length} product{detail.items.length === 1 ? "" : "s"}
              </span>
              <span className="text-sm font-semibold tabular-nums">
                Subtotal {currency.format(detail.subtotal)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
