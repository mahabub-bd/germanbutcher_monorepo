"use client";

import { useProductFreeDeliveryLine } from "@/hooks/use-product-free-delivery";
import type { Product } from "@/utils/types";
import { Award, Clock, Shield, Truck } from "lucide-react";
import { FeatureList, type FeatureItem } from "./feature-list";

interface ProductFeaturesProps {
  product?: Product;
}

export function ProductFeatures({ product }: ProductFeaturesProps) {
  // Delivery line reflects campaigns targeting this exact product/category
  // first, then always-on campaigns, then the default.
  const freeDelivery = useProductFreeDeliveryLine(product);

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
      desc: "Delivered within 48hrs",
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
