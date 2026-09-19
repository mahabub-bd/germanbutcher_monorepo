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
import { Switch } from "@/components/ui/switch";
import { fetchData, patchData } from "@/utils/api-utils";
import { formatCurrencyEnglish } from "@/lib/utils";
import type { DeliverySettings } from "@/utils/types";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LoadingIndicator } from "../loading-indicator";

const DEFAULT_SETTINGS: DeliverySettings = {
  freeDeliveryEnabled: false,
  freeDeliveryThreshold: 0,
};

export function FreeDeliverySettingsCard() {
  const [settings, setSettings] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  // Draft holds in-progress changes inside the edit modal
  const [draft, setDraft] = useState<DeliverySettings>(DEFAULT_SETTINGS);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData("delivery-settings")
      .then((response) => {
        setSettings(response as DeliverySettings);
      })
      .catch((error) => {
        console.error("Error fetching delivery settings:", error);
        toast.error("Failed to load delivery settings");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleEdit = () => {
    setDraft(settings);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await patchData<DeliverySettings>("delivery-settings", {
        freeDeliveryEnabled: draft.freeDeliveryEnabled,
        freeDeliveryThreshold: Number(draft.freeDeliveryThreshold),
      });
      const updated = response.data as DeliverySettings;
      setSettings(updated);
      setIsEditOpen(false);
      toast.success("Free delivery settings saved");
    } catch (error) {
      console.error("Error saving delivery settings:", error);
      toast.error("Failed to save free delivery settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="md:p-6 p-2">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <LoadingIndicator message="Loading free delivery settings..." />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      settings.freeDeliveryEnabled
                        ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {settings.freeDeliveryEnabled ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Minimum order amount
                </dt>
                <dd className="mt-1 font-semibold text-gray-900 dark:text-gray-50">
                  {settings.freeDeliveryEnabled
                    ? formatCurrencyEnglish(Number(settings.freeDeliveryThreshold))
                    : "—"}
                </dd>
              </div>
            </dl>

            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Free Delivery</DialogTitle>
            <DialogDescription>
              Waive the delivery fee for orders above a minimum amount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="free-delivery-switch" className="font-medium">
                Enable Free Delivery
              </Label>
              <Switch
                id="free-delivery-switch"
                checked={draft.freeDeliveryEnabled}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({
                    ...prev,
                    freeDeliveryEnabled: checked,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="free-delivery-threshold">
                Minimum order amount (৳)
              </Label>
              <Input
                id="free-delivery-threshold"
                type="number"
                min="0"
                step="0.01"
                value={draft.freeDeliveryThreshold ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    freeDeliveryThreshold: e.target.value,
                  }))
                }
                placeholder="e.g. 2000"
                disabled={!draft.freeDeliveryEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Orders whose payable amount (after discounts) reaches this
                value get free delivery on every shipping method.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              aria-busy={isSaving}
              className="bg-primaryColor hover:bg-primaryColor/90 dark:bg-red-700 dark:hover:bg-red-600"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
