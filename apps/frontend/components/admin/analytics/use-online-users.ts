import { fetchOnlineUsers } from "@/utils/analytics-utils";
import type { OnlineUsers } from "@/utils/types";
import { useCallback, useEffect, useState } from "react";

const REFRESH_MS = 30 * 1000;

/** Polls the online-users endpoint every 30 seconds. */
export function useOnlineUsers() {
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

  return { data, isLoading };
}
