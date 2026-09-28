"use client";

import { Award, Clock, Shield, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { FeatureList, type FeatureItem } from "./feature-list";
import { fetchData } from "@/utils/api-utils";
import type { FreeDeliveryCampaign } from "@/utils/types";

export function ProductFeatures() {
  // Free delivery line derived from active campaigns: the lowest minimum
  // among "always-on" campaigns (no schedule/product/customer restrictions)
  // applies to any order, so it is what this product-level badge advertises.
  const [freeDelivery, setFreeDelivery] = useState({
    label: "Delivery",
    desc: "Charges apply at checkout",
  });

  useEffect(() => {
    fetchData<FreeDeliveryCampaign[]>("free-delivery-campaigns/active")
      .then((campaigns) => {
        if (!campaigns?.length) return;
        const alwaysOn = campaigns.filter(
          (c) =>
            !c.newCustomersOnly &&
            !c.products?.length &&
            !c.categories?.length &&
            !c.daysOfWeek?.length &&
            !c.startTime &&
            !c.endTime
        );
        if (!alwaysOn.length) return;
        const minimum = Math.min(
          ...alwaysOn.map((c) => Number(c.minOrderAmount || 0))
        );
        if (minimum > 0) {
          setFreeDelivery({
            label: "Free Delivery",
            desc: `On orders over ৳${minimum.toLocaleString()}`,
          });
        } else {
          setFreeDelivery({
            label: "Free Delivery",
            desc: "On all orders",
          });
        }
      })
      .catch((error) =>
        console.error("Error fetching free delivery campaigns:", error)
      );
  }, []);

  const FEATURES: FeatureItem[] = [
    {
      icon: Truck,
      label: freeDelivery.label,
      desc: freeDelivery.desc,
      chip: "bg-blue-50 text-blue-600",
    },
    {
      icon: Shield,
      label: "Quality Assured",
      desc: "100% fresh guarantee",
      chip: "bg-green-50 text-green-600",
    },
    {
      icon: Clock,
      label: "Fresh Daily",
      desc: "Delivered within 24hrs",
      chip: "bg-orange-50 text-orange-600",
    },
    {
      icon: Award,
      label: "Premium Quality",
      desc: "Certified suppliers",
      chip: "bg-purple-50 text-purple-600",
    },
  ];

  return <FeatureList items={FEATURES} variant="strip" />;
}
