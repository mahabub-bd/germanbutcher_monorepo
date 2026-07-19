"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ResponseTimes } from "@/utils/types";

interface ResponseTimesChartProps {
  data: ResponseTimes;
}

export function ResponseTimesChart({ data }: ResponseTimesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Response Times</CardTitle>
        <CardDescription>Current API response performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.avg}ms
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Average</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.min}ms
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Minimum</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.max}ms
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Maximum</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
