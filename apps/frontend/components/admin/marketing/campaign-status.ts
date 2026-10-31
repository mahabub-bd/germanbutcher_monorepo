import type { PillTone } from "@/components/common/pill-badge";

/**
 * Shared lifecycle rules for the marketing campaigns (BOGO, flash sale, free
 * delivery). Keeping them in one place means the badge, the filter and the
 * stat tiles always agree on what "expiring soon" means.
 */

export type CampaignStatus =
  | "active"
  | "scheduled"
  | "expiring"
  | "inactive"
  | "expired";

/** The fields every campaign type shares — dates may be absent (= no limit). */
export interface DatedCampaign {
  isActive: boolean;
  validFrom?: string | Date | null;
  validUntil?: string | Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_WINDOW_MS = 7 * DAY_MS;

const time = (value: string | Date): number => new Date(value).getTime();

/** Past its valid-until date; campaigns without an end date never expire. */
export function isCampaignExpired(
  campaign: DatedCampaign,
  now: number = Date.now()
): boolean {
  if (!campaign.validUntil) return false;
  return time(campaign.validUntil) < now;
}

/** Ends within the next 7 days but has not ended yet. */
export function isCampaignExpiringSoon(
  campaign: DatedCampaign,
  now: number = Date.now()
): boolean {
  if (!campaign.validUntil) return false;
  const until = time(campaign.validUntil);
  return until >= now && until <= now + EXPIRING_WINDOW_MS;
}

/** Starts in the future; campaigns without a start date start immediately. */
export function isCampaignScheduled(
  campaign: DatedCampaign,
  now: number = Date.now()
): boolean {
  if (!campaign.validFrom) return false;
  return time(campaign.validFrom) > now;
}

export function campaignStatus(
  campaign: DatedCampaign,
  now: number = Date.now()
): CampaignStatus {
  if (isCampaignExpired(campaign, now)) return "expired";
  if (isCampaignExpiringSoon(campaign, now)) return "expiring";
  if (isCampaignScheduled(campaign, now)) return "scheduled";
  if (!campaign.isActive) return "inactive";
  return "active";
}

export const CAMPAIGN_STATUS_META: Record<
  CampaignStatus,
  { label: string; tone: PillTone }
> = {
  active: { label: "Active", tone: "emerald" },
  scheduled: { label: "Scheduled", tone: "blue" },
  expiring: { label: "Expiring soon", tone: "amber" },
  inactive: { label: "Inactive", tone: "neutral" },
  expired: { label: "Expired", tone: "red" },
};

/** Status filter options, in the order they appear in the dropdown. */
export const CAMPAIGN_STATUS_OPTIONS: {
  value: CampaignStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expiring", label: "Expiring soon" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
];

/** "2 products + 1 category", "Whole store" when nothing is targeted. */
export function scopeLabel(
  productCount: number,
  categoryCount: number,
  emptyLabel = "Whole store"
): string {
  if (productCount === 0 && categoryCount === 0) return emptyLabel;
  const parts: string[] = [];
  if (productCount > 0)
    parts.push(`${productCount} product${productCount === 1 ? "" : "s"}`);
  if (categoryCount > 0)
    parts.push(`${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`);
  return parts.join(" + ");
}

/** Usage progress as a 0–100 percentage; unlimited campaigns report 0. */
export function usagePercent(used: number, max: number): number {
  if (!max || max <= 0) return 0;
  return Math.min(100, (used / max) * 100);
}
