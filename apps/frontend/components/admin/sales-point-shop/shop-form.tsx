"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fetchDataPagination, patchData, postData } from "@/utils/api-utils";

import { bangladeshData, Division, divisions } from "@/constants";
import type { SalesPoint, Shop } from "@/utils/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Section } from "../helper";

const shopSchema = z.object({
  salesPointId: z.number().min(1, "Please select a sales point"),
  shopName: z.string().min(1, "Shop name is required"),
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  address: z.string().min(1, "Address is required"),
  isActive: z.boolean(),
});

type ShopFormValues = z.infer<typeof shopSchema>;

interface ShopFormProps {
  mode: "create" | "edit";
  shop?: Shop;
}

export function ShopForm({ mode, shop }: ShopFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([]);
  const [isLoadingSalesPoints, setIsLoadingSalesPoints] = useState(true);
  const router = useRouter();

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      salesPointId: shop?.salesPointId || 0,
      shopName: shop?.shopName || "",
      division: shop?.division || "",
      district: shop?.district || "",
      address: shop?.address || "",
      isActive: shop?.isActive ?? true,
    },
  });

  const fetchSalesPoints = async () => {
    try {
      setIsLoadingSalesPoints(true);
      const response = await fetchDataPagination<{ data: SalesPoint[] }>(
        "sales-points?limit=100"
      );
      setSalesPoints(response.data || []);
    } catch (error) {
      console.error("Error fetching sales points:", error);
      toast.error("Failed to load sales points");
    } finally {
      setIsLoadingSalesPoints(false);
    }
  };

  useEffect(() => {
    fetchSalesPoints();
  }, []);

  const handleSubmit = async (data: ShopFormValues) => {
    setIsSubmitting(true);
    try {
      const shopData = {
        salesPointId: data.salesPointId,
        shopName: data.shopName,
        division: data.division,
        district: data.district,
        address: data.address,
      };

      const endpoint =
        mode === "create"
          ? "sales-point-shops"
          : `sales-point-shops/${shop?.id}`;
      const method = mode === "create" ? postData : patchData;
      const response = await method(endpoint, shopData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Shop created successfully"
            : "Shop updated successfully";
        toast.success(successMessage);
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting shop form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-6 space-y-6">
          {/* Basic Information Section */}
          <Section title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sales Point - Full Width on both columns */}
              <div>
                <FormField
                  control={form.control}
                  name="salesPointId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Point</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? field.value.toString() : ""}
                        disabled={isLoadingSalesPoints}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a sales point" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {salesPoints.map((salesPoint) => (
                            <SelectItem
                              key={salesPoint.id}
                              value={salesPoint.id.toString()}
                            >
                              <div className="flex items-center gap-3">
                                {salesPoint.logoAttachment?.url && (
                                  <Image
                                    src={salesPoint.logoAttachment.url}
                                    alt={`${salesPoint.name} logo`}
                                    width={500}
                                    height={500}
                                    className="w-6 h-6 object-contain rounded"
                                  />
                                )}
                                <span>{salesPoint.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Shop Name - Full Width on both columns */}
              <div className="">
                <FormField
                  control={form.control}
                  name="shopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outlet Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter outlet name"
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Section>

          {/* Location Information Section */}
          <Section title="Location Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Division - Left Column */}
              <FormField
                control={form.control}
                name="division"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset district when division changes
                        form.setValue("district", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {divisions.map((division) => (
                          <SelectItem key={division} value={division}>
                            {division}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* District - Right Column */}
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch("division")}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("division") &&
                          bangladeshData[
                            form.watch("division") as Division
                          ]?.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address - Full Width on both columns */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter complete address"
                          className="min-h-[100px] w-full resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Section>

          {/* Status Section */}
          <Section title="Status">
            <div className="max-w-md">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <SwitchCard
                    label="Active Status"
                    description="Shop will be visible to customers"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </Section>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 bg-gray-50 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "create" ? "Create Shop" : "Update Shop"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const SwitchCard = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-4 bg-white hover:bg-gray-50 transition-colors">
    <div className="space-y-0.5">
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);
