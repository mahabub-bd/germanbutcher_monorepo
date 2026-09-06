"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchOnlineUsers } from "@/utils/analytics-utils";
import type { OnlineUsers } from "@/utils/types";
import { Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const REFRESH_MS = 30 * 1000;

export function OnlineNowCard() {
  const [data, setData] = useState<OnlineUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const onlineData = await fetchOnlineUsers();
      setData(onlineData);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          Online Now
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-2xl font-bold text-muted-foreground">--</p>
        ) : data ? (
          <>
            <p className="text-2xl font-bold">{data.total}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Users className="h-3 w-3" />
              {data.authenticated} logged in · {data.guests} guests
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-muted-foreground">--</p>
            <p className="text-xs text-muted-foreground mt-1">Failed to load</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
