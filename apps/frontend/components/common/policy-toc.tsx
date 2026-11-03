"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ListChecks } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type PolicyTocItem = { id: string; title: string };

/** Height the sticky storefront header occupies, so the highlighted section
 *  and every smooth scroll land below it instead of behind it. */
const HEADER_OFFSET = 88;

/** Tracks which section currently sits under the header while scrolling. */
function useActiveSection(items: PolicyTocItem[]) {
  const ids = useMemo(() => items.map((item) => item.id).join("|"), [items]);
  const [active, setActive] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    const idList = ids.split("|").filter(Boolean);
    if (idList.length === 0) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const nodes = idList
        .map((id) => document.getElementById(id))
        .filter((node): node is HTMLElement => Boolean(node));
      if (nodes.length === 0) return;

      const probe = HEADER_OFFSET + window.innerHeight * 0.2;
      let current = nodes[0].id;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= probe) current = node.id;
        else break;
      }
      // Pin the last section once the page bottom is reached.
      if (
        window.innerHeight + window.scrollY >=
        document.body.scrollHeight - 8
      ) {
        current = nodes[nodes.length - 1].id;
      }
      setActive((previous) => (previous === current ? previous : current));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return active;
}

/** Scrolls to a section without the browser's instant jump. */
function scrollToSection(id: string, onScrolled?: () => void) {
  const node = document.getElementById(id);
  if (!node) return;
  const top = node.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
  window.history.replaceState(null, "", `#${id}`);
  onScrolled?.();
}

/**
 * Table of contents for the policy documents. `rail` is the sticky sidebar
 * (lg+), `panel` is the collapsible strip used on smaller screens. Both
 * highlight the section currently in view.
 */
export function PolicyToc({
  items,
  variant = "rail",
  className,
}: {
  items: PolicyTocItem[];
  variant?: "rail" | "panel";
  className?: string;
}) {
  const active = useActiveSection(items);
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const rowClass = (id: string) =>
    cn(
      "-ml-px block w-full border-l-2 py-1.5 pr-2 pl-3 text-left text-sm transition-colors",
      active === id
        ? "border-primaryColor font-semibold text-primaryColor"
        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900"
    );

  const numberedLabel = (index: number, title: string) => (
    <>
      <span className="mr-2 text-xs tabular-nums text-gray-400">
        {String(index + 1).padStart(2, "0")}
      </span>
      {title}
    </>
  );

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
          className
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ListChecks className="size-4 shrink-0 text-primaryColor" />
            On this page
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500">
            {items.length} sections
            <ChevronDown
              className={cn(
                "size-4 text-gray-400 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </span>
        </button>

        {open && (
          <nav
            aria-label="On this page"
            className="border-t border-gray-100 bg-gray-50/70 py-2"
          >
            <ol>
              {items.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      scrollToSection(item.id, () => setOpen(false))
                    }
                    className={cn(rowClass(item.id), "py-2.5")}
                  >
                    {numberedLabel(index, item.title)}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    );
  }

  return (
    <nav aria-label="On this page" className={cn(className)}>
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
        <ListChecks className="size-3.5 shrink-0 text-primaryColor" />
        On this page
      </p>
      <ol className="mt-3 border-l border-gray-200">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(item.id);
              }}
              className={rowClass(item.id)}
            >
              {numberedLabel(index, item.title)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
