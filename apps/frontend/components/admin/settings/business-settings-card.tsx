"use client";
import { revalidatePublic } from "@/actions/revalidate";
import StatsCard from "@/components/admin/dashboard/stats-card";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { PillBadge } from "@/components/common/pill-badge";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchData, formPostData, patchData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";
import {
  Bell,
  Building2,
  Globe,
  ImageIcon,
  ImageOff,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Phone,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LoadingIndicator } from "../loading-indicator";
import { SwitchCard } from "../helper";

interface BusinessSettingsForm {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  adminNotificationEmail: string;
  whatsappNumber: string;
  messengerUrl: string;
  websiteUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceStartsAt: string; // datetime-local string or ""
  maintenanceEndsAt: string; // datetime-local string or ""
  // CRM segment rules — kept as strings for the inputs; parsed on save.
  vipMinSpent: string;
  vipMinOrders: string;
  atRiskDays: string;
  newDays: string;
}


const EMPTY_FORM: BusinessSettingsForm = {
  businessName: "",
  address: "",
  phone: "",
  email: "",
  adminNotificationEmail: "",
  whatsappNumber: "",
  messengerUrl: "",
  websiteUrl: "",
  maintenanceMode: false,
  maintenanceMessage: "",
  maintenanceStartsAt: "",
  maintenanceEndsAt: "",
  vipMinSpent: "",
  vipMinOrders: "",
  atRiskDays: "",
  newDays: "",
};

/** ISO datetime → value for <input type="datetime-local"> (browser-local). */
function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Merge a picked date and/or time into the draft's datetime-local string —
 * updating one part preserves the other (falls back to today / 00:00). */
function combineDateTime(
  datePart: Date | undefined,
  timePart: string | undefined,
  current: string
): string {
  const base = current ? new Date(current) : new Date();
  if (Number.isNaN(base.getTime())) base.setTime(Date.now());
  const d = datePart ? new Date(datePart) : base;
  const [h, m] = (timePart ?? `${base.getHours()}:${base.getMinutes()}`)
    .split(":")
    .map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return toLocalInputValue(d.toISOString());
}

/** Icon + label + value cell used in the details grid. */
function InfoField({
  icon: Icon,
  label,
  value,
  href,
  external,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  href?: string;
  external?: boolean;
  className?: string;
}) {
  const content = value?.trim() ? value : "—";
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[13px] font-medium text-foreground/60">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium wrap-anywhere">
          {value?.includes(",") && !href ? (
            // Comma-separated values (e.g. admin notification emails) render
            // as individual pills instead of one long wrapped string.
            <span className="flex flex-wrap gap-1.5">
              {value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
                .map((item) => (
                  <PillBadge key={item} tone="neutral">
                    {item}
                  </PillBadge>
                ))}
            </span>
          ) : href && value?.trim() ? (
            <a
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-primaryColor underline-offset-2 hover:underline"
            >
              {content}
            </a>
          ) : (
            content
          )}
        </dd>
      </div>
    </div>
  );
}

/** Framed logo preview with a caption, or a dashed placeholder when unset. */
function LogoTile({
  url,
  label,
  badge,
}: {
  url?: string;
  label: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">
        {url ? (
          <Image
            src={url}
            alt={label}
            width={72}
            height={72}
            unoptimized
            className="size-full object-contain p-1.5"
          />
        ) : (
          <ImageOff className="size-5 text-muted-foreground" />
        )}
      </div>
      <span className="text-[13px] font-medium text-foreground/70">
        {label}
        {badge ? ` · ${badge}` : ""}
      </span>
    </div>
  );
}

/** Human-readable maintenance window, or a dash when the store is live. */
function maintenanceWindowLabel(settings: BusinessSettings | null): string {
  if (!settings?.maintenanceMode) return "—";
  const { maintenanceStartsAt: from, maintenanceEndsAt: to } = settings;
  if (from && to) return `${formatDateTime(from)} → ${formatDateTime(to)}`;
  if (to) return `Ends ${formatDateTime(to)}`;
  if (from) return `Starts ${formatDateTime(from)}`;
  return "Until switched off";
}

export function BusinessSettingsCard() {
  const MENU_URL = "/admin/settings/business-info";
  const { can } = usePermissions();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [draft, setDraft] = useState<BusinessSettingsForm>(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [invoiceLogoFile, setInvoiceLogoFile] = useState<File | null>(null);
  const [invoiceLogoPreview, setInvoiceLogoPreview] = useState<string>("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData<BusinessSettings>("business-settings")
      .then((response) => setSettings(response))
      .catch((error) => {
        console.error("Error fetching business settings:", error);
        toast.error("Failed to load business settings");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleEdit = () => {
    setDraft({
      businessName: settings?.businessName ?? "",
      address: settings?.address ?? "",
      phone: settings?.phone ?? "",
      email: settings?.email ?? "",
      adminNotificationEmail: settings?.adminNotificationEmail ?? "",
      whatsappNumber: settings?.whatsappNumber ?? "",
      messengerUrl: settings?.messengerUrl ?? "",
      websiteUrl: settings?.websiteUrl ?? "",
      maintenanceMode: settings?.maintenanceMode ?? false,
      maintenanceMessage: settings?.maintenanceMessage ?? "",
      maintenanceStartsAt: toLocalInputValue(settings?.maintenanceStartsAt),
      maintenanceEndsAt: toLocalInputValue(settings?.maintenanceEndsAt),
      vipMinSpent:
        settings?.vipMinSpent === null || settings?.vipMinSpent === undefined
          ? ""
          : String(settings.vipMinSpent),
      vipMinOrders:
        settings?.vipMinOrders === null || settings?.vipMinOrders === undefined
          ? ""
          : String(settings.vipMinOrders),
      atRiskDays:
        settings?.atRiskDays === null || settings?.atRiskDays === undefined
          ? ""
          : String(settings.atRiskDays),
      newDays:
        settings?.newDays === null || settings?.newDays === undefined
          ? ""
          : String(settings.newDays),
    });
    setLogoFile(null);
    setLogoPreview(settings?.logo?.url || "");
    setInvoiceLogoFile(null);
    setInvoiceLogoPreview(settings?.invoiceLogo?.url || "");
    setIsEditOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setLogoFile(selectedFile);
    setLogoPreview(URL.createObjectURL(selectedFile));
  };

  const handleLogoReset = () => {
    setLogoFile(null);
    setLogoPreview(settings?.logo?.url || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInvoiceLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "image/png") {
      toast.error("Invoice logo must be a PNG image");
      e.target.value = "";
      return;
    }
    setInvoiceLogoFile(selectedFile);
    setInvoiceLogoPreview(URL.createObjectURL(selectedFile));
  };

  const handleInvoiceLogoReset = () => {
    setInvoiceLogoFile(null);
    setInvoiceLogoPreview(settings?.invoiceLogo?.url || "");
    if (invoiceFileInputRef.current) invoiceFileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upload newly picked logos first, then persist the settings.
      let logoId: string | undefined;
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const result = await formPostData<{ id: string }>("attachment", formData);
        logoId = result.data!.id;
      }

      let invoiceLogoId: string | undefined;
      if (invoiceLogoFile) {
        const formData = new FormData();
        formData.append("file", invoiceLogoFile);
        const result = await formPostData<{ id: string }>("attachment", formData);
        invoiceLogoId = result.data!.id;
      }

      const toIntOrNull = (value: string): number | null => {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      };
      const response = await patchData<BusinessSettings>("business-settings", {
        ...draft,
        maintenanceMessage: draft.maintenanceMessage.trim() || null,
        maintenanceStartsAt: draft.maintenanceStartsAt
          ? new Date(draft.maintenanceStartsAt).toISOString()
          : null,
        maintenanceEndsAt: draft.maintenanceEndsAt
          ? new Date(draft.maintenanceEndsAt).toISOString()
          : null,
        vipMinSpent: toIntOrNull(draft.vipMinSpent),
        vipMinOrders: toIntOrNull(draft.vipMinOrders),
        atRiskDays: toIntOrNull(draft.atRiskDays),
        newDays: toIntOrNull(draft.newDays),
        ...(logoId ? { logoId } : {}),
        ...(invoiceLogoId ? { invoiceLogoId } : {}),
      });
      setSettings(response.data as BusinessSettings);
      setIsEditOpen(false);
      // Settings feed the root layout's OG metadata — bust its 60s cache.
      await revalidatePublic();
      toast.success("Business settings saved");
    } catch (error) {
      console.error("Error saving business settings:", error);
      toast.error("Failed to save business settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Only string-valued keys — maintenance fields get their own controls below
  type StringFieldKey = {
    [K in keyof BusinessSettingsForm]: BusinessSettingsForm[K] extends string
      ? K
      : never;
  }[keyof BusinessSettingsForm];
  const textFields: [StringFieldKey, string, string][] = [
    ["businessName", "Business Name", "e.g. German Butcher"],
    ["phone", "Phone", "e.g. +8809666791991"],
    ["email", "Email", "e.g. support@germanbutcherbd.com"],
    [
      "adminNotificationEmail",
      "Admin Notification Emails",
      "Comma-separated, e.g. admin1@example.com, admin2@example.com",
    ],
    ["whatsappNumber", "WhatsApp Number", "e.g. +8801911080825"],
    ["messengerUrl", "Messenger Page URL", "https://www.facebook.com/<page>"],
    ["websiteUrl", "Website URL", "https://www.germanbutcherbd.com"],
  ];

  const contactChannels = [
    settings?.phone,
    settings?.email,
    settings?.whatsappNumber,
    settings?.messengerUrl,
    settings?.websiteUrl,
  ].filter((value) => Boolean(value?.trim())).length;

  const notificationEmails = (settings?.adminNotificationEmail ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;

  const logoCount = [settings?.logo?.url, settings?.invoiceLogo?.url].filter(
    (value) => Boolean(value)
  ).length;

  const isMaintenance = settings?.maintenanceMode ?? false;

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center rounded-2xl border bg-card py-16">
          <LoadingIndicator message="Loading business settings..." />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatsCard
              icon={Phone}
              title="Contact channels"
              value={contactChannels}
              count="5"
              description="Phone, email, chat and site"
              bgColor="blue"
            />
            <StatsCard
              icon={Bell}
              title="Notification emails"
              value={notificationEmails.toLocaleString("en-US")}
              description="Admins alerted on new orders"
              bgColor="indigo"
            />
            <StatsCard
              icon={ImageIcon}
              title="Logos"
              value={logoCount}
              count="2"
              description="Storefront and invoice"
              bgColor="purple"
            />
            <StatsCard
              icon={Wrench}
              title="Maintenance"
              value={isMaintenance ? "On" : "Off"}
              description={
                isMaintenance
                  ? maintenanceWindowLabel(settings)
                  : "Storefront is live"
              }
              bgColor={isMaintenance ? "red" : "green"}
            />
          </div>

          {/* Business details */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Business information
                  </h2>
                  <p className="mt-0.5 text-[13px] text-foreground/70">
                    Used across the storefront, chat, invoices and reports.
                  </p>
                </div>
              </div>
              {can(MENU_URL, "canEdit") && (
                <Button
                  size="sm"
                  onClick={handleEdit}
                  className="w-full sm:w-auto sm:shrink-0"
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-6 p-4 sm:p-5">
              {/* Logos */}
              <section>
                <h3 className="text-[13px] font-medium text-foreground/60">
                  Brand logos
                </h3>
                <div className="mt-3 flex gap-5">
                  <LogoTile url={settings?.logo?.url} label="Website logo" />
                  <LogoTile
                    url={settings?.invoiceLogo?.url}
                    label="Invoice logo"
                    badge="PNG"
                  />
                </div>
              </section>

              <hr className="border-t" />

              {/* Contact & channels */}
              <section>
                <h3 className="text-[13px] font-medium text-foreground/60">
                  Contact &amp; channels
                </h3>
                <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                  <InfoField
                    icon={Building2}
                    label="Business name"
                    value={settings?.businessName}
                  />
                  <InfoField
                    icon={Phone}
                    label="Phone"
                    value={settings?.phone}
                    href={settings?.phone ? `tel:${settings.phone}` : undefined}
                  />
                  <InfoField
                    icon={Mail}
                    label="Email"
                    value={settings?.email}
                    href={
                      settings?.email ? `mailto:${settings.email}` : undefined
                    }
                  />
                  <InfoField
                    icon={MessageCircle}
                    label="WhatsApp"
                    value={settings?.whatsappNumber}
                    href={
                      settings?.whatsappNumber
                        ? `https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, "")}`
                        : undefined
                    }
                    external
                  />
                  <InfoField
                    icon={MessagesSquare}
                    label="Messenger"
                    value={settings?.messengerUrl}
                    href={settings?.messengerUrl || undefined}
                    external
                  />
                  <InfoField
                    icon={Globe}
                    label="Website"
                    value={settings?.websiteUrl}
                    href={settings?.websiteUrl || undefined}
                    external
                  />
                  <InfoField
                    icon={Bell}
                    label="Admin notification emails"
                    value={settings?.adminNotificationEmail}
                    className="sm:col-span-2 xl:col-span-3"
                  />
                  <InfoField
                    icon={MapPin}
                    label="Address"
                    value={settings?.address}
                    href={
                      settings?.address
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
                        : undefined
                    }
                    external
                    className="sm:col-span-2 xl:col-span-3"
                  />
                </dl>
              </section>
            </div>
          </div>

          {/* Maintenance mode */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
                  <Wrench className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Maintenance mode
                  </h2>
                  <p className="mt-0.5 text-[13px] text-foreground/70">
                    Takes the storefront offline; the admin stays reachable.
                  </p>
                </div>
              </div>
              <PillBadge
                tone={isMaintenance ? "red" : "emerald"}
                className="w-fit shrink-0"
              >
                {isMaintenance ? "Storefront offline" : "Storefront live"}
              </PillBadge>
            </div>

            <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2 sm:p-5">
              <div>
                <dt className="text-[13px] font-medium text-foreground/60">
                  Window
                </dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {maintenanceWindowLabel(settings)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-foreground/60">
                  Message
                </dt>
                <dd className="mt-0.5 text-sm">
                  {settings?.maintenanceMessage?.trim() ||
                    (isMaintenance
                      ? "Using the default “back soon” message."
                      : "—")}
                </dd>
              </div>
            </dl>
          </div>
        </>
      )}

      {/* Edit modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit business settings</DialogTitle>
            <DialogDescription>
              Shown across the storefront: header and footer logo, contact info,
              WhatsApp/Messenger chat, and order invoices.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-1 space-y-4 px-1 py-1">
            {/* Logo upload */}
            <div className="space-y-2">
              <Label htmlFor="business-logo">Logo</Label>
              <div className="flex flex-wrap items-center gap-3">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={64}
                    height={64}
                    unoptimized
                    className="size-16 rounded-lg border object-contain"
                  />
                ) : (
                  <div className="size-16 rounded-lg border border-dashed border-muted-foreground/30" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Input
                    id="business-logo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full max-w-full text-xs"
                    onChange={handleLogoChange}
                  />
                  {logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-fit px-2 text-xs text-muted-foreground"
                      onClick={handleLogoReset}
                    >
                      Keep existing logo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice logo upload (PNG only — used on PDF invoices/reports) */}
            <div className="space-y-2">
              <Label htmlFor="business-invoice-logo">
                Invoice logo (PNG only)
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                {invoiceLogoPreview ? (
                  <Image
                    src={invoiceLogoPreview}
                    alt="Invoice logo preview"
                    width={64}
                    height={64}
                    unoptimized
                    className="size-16 rounded-lg border object-contain"
                  />
                ) : (
                  <div className="size-16 rounded-lg border border-dashed border-muted-foreground/30" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Input
                    id="business-invoice-logo"
                    ref={invoiceFileInputRef}
                    type="file"
                    accept="image/png"
                    className="w-full max-w-full text-xs"
                    onChange={handleInvoiceLogoChange}
                  />
                  {invoiceLogoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-fit px-2 text-xs text-muted-foreground"
                      onClick={handleInvoiceLogoReset}
                    >
                      Keep existing invoice logo
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Used on downloaded PDF invoices and reports. Must be PNG —
                    PDF generation does not support WebP.
                  </p>
                </div>
              </div>
            </div>

            {/* Text fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              {textFields.map(([key, label, placeholder]) => (
                <div
                  className={cn(
                    "space-y-2",
                    key === "adminNotificationEmail" && "sm:col-span-2"
                  )}
                  key={key}
                >
                  <Label htmlFor={`business-${key}`}>{label}</Label>
                  <Input
                    id={`business-${key}`}
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            {/* CRM segment rules */}
            <div className="space-y-2 rounded-xl border bg-muted/30 p-3.5">
              <p className="text-sm font-semibold">CRM segment rules</p>
              <p className="text-xs text-muted-foreground">
                Control when customers become VIP, At Risk, or New. Leave a
                field empty to use the built-in default. Segments apply
                immediately everywhere — no restart needed.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-vipMinSpent">
                    VIP — Minimum Total Spent (৳)
                  </Label>
                  <Input
                    id="business-vipMinSpent"
                    type="number"
                    min={1}
                    value={draft.vipMinSpent}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        vipMinSpent: e.target.value,
                      }))
                    }
                    placeholder="Default: 20000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-vipMinOrders">
                    VIP — Minimum Orders
                  </Label>
                  <Input
                    id="business-vipMinOrders"
                    type="number"
                    min={1}
                    value={draft.vipMinOrders}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        vipMinOrders: e.target.value,
                      }))
                    }
                    placeholder="Default: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-atRiskDays">
                    At Risk — Days Without Order
                  </Label>
                  <Input
                    id="business-atRiskDays"
                    type="number"
                    min={1}
                    value={draft.atRiskDays}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        atRiskDays: e.target.value,
                      }))
                    }
                    placeholder="Default: 90"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-newDays">
                    New — Days Since Signup
                  </Label>
                  <Input
                    id="business-newDays"
                    type="number"
                    min={1}
                    value={draft.newDays}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, newDays: e.target.value }))
                    }
                    placeholder="Default: 30"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance mode */}
            <div className="space-y-3">
              <SwitchCard
                label="Maintenance Mode"
                description={
                  'Takes the storefront offline with a "back soon" page. Admin stays accessible.'
                }
                checked={draft.maintenanceMode}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({
                    ...prev,
                    maintenanceMode: checked,
                  }))
                }
              />

              {draft.maintenanceMode && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="business-maintenance-message">
                      Message
                    </Label>
                    <Textarea
                      id="business-maintenance-message"
                      rows={2}
                      value={draft.maintenanceMessage}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          maintenanceMessage: e.target.value,
                        }))
                      }
                      placeholder="We are upgrading the store — back soon!"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Starts at (optional)</Label>
                      <div className="flex gap-2">
                        <DatePicker
                          value={
                            draft.maintenanceStartsAt
                              ? new Date(draft.maintenanceStartsAt)
                              : undefined
                          }
                          onChange={(date) =>
                            setDraft((prev) => ({
                              ...prev,
                              maintenanceStartsAt: combineDateTime(
                                date,
                                undefined,
                                prev.maintenanceStartsAt
                              ),
                            }))
                          }
                          placeholder="Pick a date"
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={
                            draft.maintenanceStartsAt
                              ? draft.maintenanceStartsAt.slice(11, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              maintenanceStartsAt: combineDateTime(
                                undefined,
                                e.target.value,
                                prev.maintenanceStartsAt
                              ),
                            }))
                          }
                          className="w-30"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Ends at (optional)</Label>
                      <div className="flex gap-2">
                        <DatePicker
                          value={
                            draft.maintenanceEndsAt
                              ? new Date(draft.maintenanceEndsAt)
                              : undefined
                          }
                          onChange={(date) =>
                            setDraft((prev) => ({
                              ...prev,
                              maintenanceEndsAt: combineDateTime(
                                date,
                                undefined,
                                prev.maintenanceEndsAt
                              ),
                            }))
                          }
                          minDate={
                            draft.maintenanceStartsAt
                              ? new Date(draft.maintenanceStartsAt)
                              : undefined
                          }
                          placeholder="Pick a date"
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={
                            draft.maintenanceEndsAt
                              ? draft.maintenanceEndsAt.slice(11, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              maintenanceEndsAt: combineDateTime(
                                undefined,
                                e.target.value,
                                prev.maintenanceEndsAt
                              ),
                            }))
                          }
                          className="w-30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address (multi-line) */}
            <div className="space-y-2">
              <Label htmlFor="business-address">Address</Label>
              <Textarea
                id="business-address"
                rows={2}
                value={draft.address}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="House 56/B, Road 132, Gulshan 1, Dhaka"
              />
            </div>

            <p className="text-[13px] text-foreground/70">
              Public pages pick up changes within ~60 seconds (cache).
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
