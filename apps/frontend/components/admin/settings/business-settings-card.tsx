"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchData, formPostData, patchData } from "@/utils/api-utils";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import type { BusinessSettings } from "@/utils/types";
import {
  Building2,
  Globe,
  ImageOff,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { LoadingIndicator } from "../loading-indicator";

interface BusinessSettingsForm {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  messengerUrl: string;
  websiteUrl: string;
}

const EMPTY_FORM: BusinessSettingsForm = {
  businessName: "",
  address: "",
  phone: "",
  email: "",
  whatsappNumber: "",
  messengerUrl: "",
  websiteUrl: "",
};

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
    <div className={`flex items-start gap-3 ${className || ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-primaryColor dark:bg-red-950/40 dark:text-red-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 font-semibold text-gray-900 dark:text-gray-50 [overflow-wrap:anywhere]">
          {href && value?.trim() ? (
            <a
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-blue-600 hover:underline dark:text-blue-400"
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
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
        {url ? (
          <Image
            src={url}
            alt={label}
            width={72}
            height={72}
            unoptimized
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <ImageOff className="h-6 w-6 text-gray-300 dark:text-gray-600" />
        )}
      </div>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {badge ? ` (${badge})` : ""}
      </span>
    </div>
  );
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
      whatsappNumber: settings?.whatsappNumber ?? "",
      messengerUrl: settings?.messengerUrl ?? "",
      websiteUrl: settings?.websiteUrl ?? "",
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
        const result = await formPostData("attachment", formData);
        logoId = result.data.id;
      }

      let invoiceLogoId: string | undefined;
      if (invoiceLogoFile) {
        const formData = new FormData();
        formData.append("file", invoiceLogoFile);
        const result = await formPostData("attachment", formData);
        invoiceLogoId = result.data.id;
      }

      const response = await patchData<BusinessSettings>("business-settings", {
        ...draft,
        ...(logoId ? { logoId } : {}),
        ...(invoiceLogoId ? { invoiceLogoId } : {}),
      });
      setSettings(response.data as BusinessSettings);
      setIsEditOpen(false);
      toast.success("Business settings saved");
    } catch (error) {
      console.error("Error saving business settings:", error);
      toast.error("Failed to save business settings");
    } finally {
      setIsSaving(false);
    }
  };

  const textFields: [keyof BusinessSettingsForm, string, string][] = [
    ["businessName", "Business Name", "e.g. German Butcher"],
    ["phone", "Phone", "e.g. +8809666791991"],
    ["email", "Email", "e.g. support@germanbutcherbd.com"],
    ["whatsappNumber", "WhatsApp Number", "e.g. +8801911080825"],
    ["messengerUrl", "Messenger Page URL", "https://www.facebook.com/<page>"],
    ["websiteUrl", "Website URL", "https://www.germanbutcherbd.com"],
  ];

  return (
    <div className="md:p-6 p-2">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <LoadingIndicator message="Loading business settings..." />
        ) : (
          <div>
            {/* Card header */}
            <div className="flex flex-col-reverse gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 dark:border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  Business Information
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Used across the storefront, chat, invoices and reports.
                </p>
              </div>
              {can(MENU_URL, "canEdit") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="w-full sm:w-auto sm:shrink-0"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-8">
              {/* Logos */}
              <div className="flex justify-center gap-5 sm:justify-start">
                <LogoTile
                  url={settings?.logo?.url}
                  label="Website Logo"
                />
                <LogoTile
                  url={settings?.invoiceLogo?.url}
                  label="Invoice Logo"
                  badge="PNG"
                />
              </div>

              {/* Details */}
              <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                <InfoField
                  icon={Building2}
                  label="Business Name"
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
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Settings</DialogTitle>
            <DialogDescription>
              Shown across the storefront: header/footer logo, contact info,
              WhatsApp/Messenger chat, and order invoices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto -mx-1 px-1 py-1">
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
                    className="w-16 h-16 rounded-lg object-contain border border-gray-100 dark:border-gray-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-700" />
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
                Invoice Logo (PNG only)
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                {invoiceLogoPreview ? (
                  <Image
                    src={invoiceLogoPreview}
                    alt="Invoice logo preview"
                    width={64}
                    height={64}
                    unoptimized
                    className="w-16 h-16 rounded-lg object-contain border border-gray-100 dark:border-gray-800"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-700" />
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
            {textFields.map(([key, label, placeholder]) => (
              <div className="space-y-2" key={key}>
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

            <p className="text-xs text-muted-foreground">
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
              className="w-full bg-primaryColor hover:bg-primaryColor/90 sm:w-auto dark:bg-red-700 dark:hover:bg-red-600"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
