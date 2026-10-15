"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import type { ResponseTimes } from "@/utils/types";

interface ResponseTimesChartProps {
  data: ResponseTimes;
}

export function ResponseTimesChart({ data }: ResponseTimesChartProps) {
  return (
    <Card className="h-full rounded-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Response Times</CardTitle>
        <CardDescription>Current API response performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2.5 rounded-lg bg-blue-50 p-2.5 dark:bg-blue-950/20">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Clock className="size-4 text-blue-600 dark:text-blue-400" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {data.avg}ms
              </div>
              <div className="text-[11px] text-muted-foreground">Average</div>
            </div>
          </div>
          <div className="flex items-center rounded-lg bg-green-50 p-2.5 dark:bg-green-950/20">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <ArrowDown className="size-4 text-green-600 dark:text-green-400" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                {data.min}ms
              </div>
              <div className="text-[11px] text-muted-foreground">Minimum</div>
            </div>
          </div>
          <div className="flex items-center rounded-lg bg-red-50 p-2.5 dark:bg-red-950/20">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <ArrowUp className="size-4 text-red-600 dark:text-red-400" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                {data.max}ms
              </div>
              <div className="text-[11px] text-muted-foreground">Maximum</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
