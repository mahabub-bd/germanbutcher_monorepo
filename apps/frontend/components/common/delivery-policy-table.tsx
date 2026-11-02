import { fetchData } from "@/utils/api-utils";
import type { ShippingMethod } from "@/utils/types";
import { CheckCircle, Clock, MapPin, Truck } from "lucide-react";

/** The delivery-charges policy block shared by every policy / info page
 *  (terms, FAQs, how-to-order). Reads the live shipping methods from the
 *  API — the same data the checkout shows — so names, charges and times
 *  always match what the admin configured. Server component: fetches on
 *  render, hides itself entirely if the API has no active methods. */
export async function DeliveryPolicyTable() {
  const methods = await fetchData<ShippingMethod[]>(
    "shipping-methods?isActive=true"
  ).catch(() => [] as ShippingMethod[]);

  if (methods.length === 0) return null;

  // Same ordering the checkout uses.
  const ordered = [...methods].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      <h3 className="flex items-center gap-2 border-b border-gray-100 bg-primaryColor/[0.04] px-4 py-3 text-sm font-semibold text-gray-900">
        <Truck className="size-4 shrink-0 text-primaryColor" />
        Delivery Charges &amp; Times
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
              <th className="px-4 py-2.5 font-semibold">Method</th>
              <th className="px-4 py-2.5 font-semibold">Charge</th>
              <th className="px-4 py-2.5 font-semibold">Delivery Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {ordered.map((method) => (
              <tr key={method.id} className="align-top">
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-gray-900">
                    {method.name}
                  </span>
                  {method.isPickup && (
                    <span className="ml-1 text-xs text-gray-500">
                      (collect from store)
                    </span>
                  )}
                  {method.description && (
                    <span className="block text-xs text-gray-500">
                      {method.description}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                  {method.isPickup ? (
                    <span className="font-semibold text-emerald-600">Free</span>
                  ) : (
                    <span className="font-semibold text-primaryColor">
                      ৳
                      {Number(method.cost).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">{method.deliveryTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-1.5 border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600 sm:text-sm">
        <li className="flex items-start gap-2">
          <Clock className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
          Delivery times are estimates and may vary during holidays or peak
          seasons.
        </li>
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
          Exact area-level charges (if any) are shown at checkout before you
          place the order.
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
          Charges are set by our team and may change; this table always shows
          the current rates.
        </li>
      </ul>
    </div>
  );
}
