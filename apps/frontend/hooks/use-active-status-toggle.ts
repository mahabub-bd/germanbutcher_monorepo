"use client";

import { patchData } from "@/utils/api-utils";
import { useState } from "react";
import { toast } from "sonner";

interface UseActiveStatusToggleOptions<T> {
  /** Extract the id used in the API path (handles `id` and `Id` entity keys). */
  getId: (item: T) => number;
  /** Item display name for toasts. */
  getName: (item: T) => string;
  /**
   * Endpoint for one item. Return e.g. `products/${id}` to PATCH
   * `{ isActive }` explicitly, or `sales-partners/${id}/toggle-status` when
   * the server flips the flag itself (pair with `includeBody: false`).
   */
  buildEndpoint: (id: number) => string;
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
export function useActiveStatusToggle<T extends { isActive: boolean }>(
  options: UseActiveStatusToggleOptions<T>
) {
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const toggleActive = async (item: T) => {
    const id = options.getId(item);
    setTogglingId(id);
    const nextActive = !item.isActive;
    // Optimistic flip; revert if the API call fails.
    options.setStatusLocally(id, nextActive);
    try {
      const response =
        options.includeBody === false
          ? await patchData(options.buildEndpoint(id))
          : await patchData(options.buildEndpoint(id), {
              isActive: nextActive,
            });
      if (response?.statusCode !== 200 && response?.statusCode !== 201) {
        throw new Error(response?.message || "Failed to update status");
      }
      // Trust the server when it reports a different state (toggle-style
      // endpoints return the updated entity).
      const serverState = response?.data?.isActive;
      if (typeof serverState === "boolean" && serverState !== nextActive) {
        options.setStatusLocally(id, serverState);
      }
      await options.onSuccess?.();
      toast.success(
        `"${options.getName(item)}" is now ${
          (typeof serverState === "boolean" ? serverState : nextActive)
            ? "active"
            : "inactive"
        }`
      );
    } catch (error) {
      // Revert the optimistic update
      options.setStatusLocally(id, item.isActive);
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
