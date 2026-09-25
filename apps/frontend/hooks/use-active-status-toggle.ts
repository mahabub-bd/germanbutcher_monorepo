"use client";

import { patchData } from "@/utils/api-utils";
import { useState } from "react";
import { toast } from "sonner";

interface UseActiveStatusToggleOptions<T> {
  /** Extract the id used in the API path (handles `id` and `Id` entity keys). */
  getId: (item: T) => number;
  /** Item display name for toasts. */
  getName: (item: T) => string;
  /** Read the item's current boolean flag. Default: `item.isActive`. */
  getStatus?: (item: T) => boolean;
  /**
   * Endpoint for one item. Return e.g. `products/${id}` to PATCH
   * `{ isActive }` explicitly, or `sales-partners/${id}/toggle-status` when
   * the server flips the flag itself (pair with `includeBody: false`).
   */
  buildEndpoint: (id: number) => string;
  /**
   * Request body for the PATCH when `includeBody` is true.
   * Default: `{ isActive: nextStatus }`.
   */
  buildBody?: (nextStatus: boolean) => Record<string, unknown>;
  /** Toast wording for the on/off states. Default: active/inactive. */
  statusLabels?: { on: string; off: string };
  /** false = dedicated toggle endpoint, no request body. Default true. */
  includeBody?: boolean;
  /** Apply a new isActive value to local list state (optimistic update). */
  setStatusLocally: (id: number, isActive: boolean) => void;
  /** Extra side effect after success, e.g. revalidate cached public data. */
  onSuccess?: () => void | Promise<void>;
  /** Noun for the error toast, e.g. "product status". */
  errorLabel?: string;
}

/**
 * Shared Active/Inactive toggle logic for admin list rows: optimistic flip,
 * PATCH call, revert + error toast on failure, and per-row in-flight
 * tracking. Pairs with the <ActiveStatusToggle> UI component.
 */
export function useActiveStatusToggle<T>(
  options: UseActiveStatusToggleOptions<T>
) {
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const toggleActive = async (item: T) => {
    const getStatus =
      options.getStatus ??
      ((item: T) => (item as { isActive: boolean }).isActive);
    const id = options.getId(item);
    setTogglingId(id);
    const currentStatus = getStatus(item);
    const nextActive = !currentStatus;
    // Optimistic flip; revert if the API call fails.
    options.setStatusLocally(id, nextActive);
    try {
      const response =
        options.includeBody === false
          ? await patchData(options.buildEndpoint(id))
          : await patchData(
              options.buildEndpoint(id),
              options.buildBody
                ? options.buildBody(nextActive)
                : { isActive: nextActive }
            );
      if (response?.statusCode !== 200 && response?.statusCode !== 201) {
        throw new Error(response?.message || "Failed to update status");
      }
      // Trust the server when it reports a different state (toggle-style
      // endpoints return the updated entity).
      const serverState = response?.data?.isActive ?? response?.data?.isPublished;
      if (typeof serverState === "boolean" && serverState !== nextActive) {
        options.setStatusLocally(id, serverState);
      }
      await options.onSuccess?.();
      const labels = options.statusLabels ?? { on: "active", off: "inactive" };
      toast.success(
        `"${options.getName(item)}" is now ${
          (typeof serverState === "boolean" ? serverState : nextActive)
            ? labels.on
            : labels.off
        }`
      );
    } catch (error) {
      // Revert the optimistic update
      options.setStatusLocally(id, currentStatus);
      console.error(
        `Error updating ${options.errorLabel ?? "status"}:`,
        error
      );
      toast.error(
        `Failed to update ${options.errorLabel ?? "status"}. Please try again.`
      );
    } finally {
      setTogglingId(null);
    }
  };

  return { togglingId, toggleActive };
}
