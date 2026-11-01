import {
  ShippingMethod,
  ShippingMethodFlag,
} from './entities/shipping-method.entity';

/**
 * Single source of truth for a shipping method's checkout flags. Derived from
 * the persisted boolean columns and the serviceAreas selection, so list,
 * detail and any other consumer stay consistent. Order is fixed for stable UI.
 */
export function buildShippingMethodFlags(
  method: Pick<
    ShippingMethod,
    | 'isPickup'
    | 'requiresOnlinePayment'
    | 'isExcludedFromFreeDelivery'
    | 'serviceAreas'
  >,
): ShippingMethodFlag[] {
  const flags: ShippingMethodFlag[] = [];

  if (method.isPickup) {
    flags.push({ key: 'pickup', label: 'Pickup' });
  }
  if (method.requiresOnlinePayment) {
    flags.push({ key: 'online_payment', label: 'Online pay' });
  }
  if (method.isExcludedFromFreeDelivery) {
    flags.push({ key: 'no_free_delivery', label: 'No free delivery' });
  }

  const hasAreaLimit =
    !!method.serviceAreas &&
    ((method.serviceAreas.cities?.length ?? 0) > 0 ||
      (method.serviceAreas.areas?.length ?? 0) > 0);
  if (hasAreaLimit) {
    flags.push({ key: 'area_limited', label: 'Area-limited' });
  }

  return flags;
}
