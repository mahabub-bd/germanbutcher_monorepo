"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LowStockReport } from "./low-stock-report";
import { OutOfStockReport } from "./OutOfStockReport";

export function StockReportTabs() {
  return (
    <Card className="w-full">
      <Tabs defaultValue="low-stock" className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold">Stock Reports</CardTitle>
              <CardDescription>View inventory stock status</CardDescription>
            </div>
            <TabsList>
              <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
              <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent>
          <TabsContent value="low-stock" className="mt-0">
            <LowStockReport />
          </TabsContent>

          <TabsContent value="out-of-stock" className="mt-0">
            <OutOfStockReport />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
