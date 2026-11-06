"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";

export interface DetailTab {
    value: string;
    label: string;
    icon: LucideIcon;
    count: number;
}

/**
 * Accent colours per tab, keyed by tab value, so the customer detail page and
 * the CRM 360 page always render an identical tab bar. Unknown values fall
 * back to the neutral "activities" tone.
 */
const TAB_TONES: Record<string, { colors: string; activeColors: string }> = {
    orders: {
        colors:
            "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
        activeColors:
            "data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-400 dark:data-[state=active]:text-blue-950",
    },
    cart: {
        colors:
            "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
        activeColors:
            "data-[state=active]:bg-amber-500 data-[state=active]:text-white dark:data-[state=active]:bg-amber-400 dark:data-[state=active]:text-amber-950",
    },
    shipping: {
        colors:
            "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
        activeColors:
            "data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-emerald-950",
    },
    reviews: {
        colors:
            "bg-violet-50 text-violet-800 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70",
        activeColors:
            "data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-400 dark:data-[state=active]:text-violet-950",
    },
    messages: {
        colors:
            "bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70",
        activeColors:
            "data-[state=active]:bg-rose-600 data-[state=active]:text-white dark:data-[state=active]:bg-rose-400 dark:data-[state=active]:text-rose-950",
    },
    activities: {
        colors:
            "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900",
        activeColors:
            "data-[state=active]:bg-slate-800 data-[state=active]:text-white dark:data-[state=active]:bg-slate-200 dark:data-[state=active]:text-slate-900",
    },
    "audit-log": {
        colors:
            "bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-950/70",
        activeColors:
            "data-[state=active]:bg-cyan-600 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-400 dark:data-[state=active]:text-cyan-950",
    },
};

/**
 * Scrollable pill tab bar shared by the admin customer detail and CRM 360
 * pages: icon + label (sr-only on mobile) + count chip per tab.
 */
export function DetailTabsList({ tabs }: { tabs: DetailTab[] }) {
    return (
        <TabsList className="scrollbar-none h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2 md:w-fit [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
                const tone = TAB_TONES[tab.value] ?? TAB_TONES.activities;
                return (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={`h-auto flex-none gap-1.5 rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold shadow-none transition-colors sm:px-4 sm:py-2 sm:text-sm data-[state=active]:shadow-none ${tone.colors} ${tone.activeColors}`}
                    >
                        <tab.icon className="size-4" />
                        <span className="hidden md:inline">{tab.label}</span>
                        <span className="sr-only md:hidden">{tab.label}</span>
                        <span className="ml-0.5 rounded-full bg-white/40 px-1.5 text-[11px] font-medium tabular-nums dark:bg-black/20">
                            {tab.count}
                        </span>
                    </TabsTrigger>
                );
            })}
        </TabsList>
    );
}
