"use client";

import { Award, Clock, Shield, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { FeatureList, type FeatureItem } from "./feature-list";
import { fetchData } from "@/utils/api-utils";
import type { DeliverySettings } from "@/utils/types";

export function ProductFeatures() {
  // Free delivery line mirrors the configured threshold (admin-managed).
  // Label + desc stay consistent: "Free Delivery" only when it actually is.
  const [freeDelivery, setFreeDelivery] = useState({
    label: "Free Delivery",
    desc: "On orders over ৳1500",
  });

  useEffect(() => {
    fetchData("delivery-settings")
      .then((response) => {
        const settings = response as DeliverySettings;
        if (!settings) return;
        if (settings.freeDeliveryEnabled) {
          const threshold = Number(settings.freeDeliveryThreshold);
          if (threshold > 0) {
            setFreeDelivery({
              label: "Free Delivery",
              desc: `On orders over ৳${threshold.toLocaleString()}`,
            });
          }
        } else {
          setFreeDelivery({
            label: "Delivery",
            desc: "Charges apply at checkout",
          });
        }
      })
      .catch((error) =>
        console.error("Error fetching delivery settings:", error)
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
