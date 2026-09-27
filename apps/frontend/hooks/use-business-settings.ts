"use client";

import { useEffect, useState } from "react";

import { fetchPublicData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";

// Module-level cache shared by every consumer in the tab: the first mounted
// component triggers the request, the rest reuse it. Returns null until the
// settings arrive (or when the API is unreachable) — consumers render only
// what the admin has configured, there are no hardcoded fallbacks.
let cachedSettings: BusinessSettings | null = null;
let inflight: Promise<BusinessSettings | null> | null = null;

function loadBusinessSettings(): Promise<BusinessSettings | null> {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  inflight ??= fetchPublicData<BusinessSettings>("business-settings")
    .then((settings) => {
      cachedSettings = settings;
      return settings;
    })
    .catch(() => null);
  return inflight;
}

export function useBusinessSettings(): BusinessSettings | null {
  const [settings, setSettings] = useState<BusinessSettings | null>(
    cachedSettings
  );

  useEffect(() => {
    let active = true;
    loadBusinessSettings().then((settings) => {
      if (active) setSettings(settings);
    });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
