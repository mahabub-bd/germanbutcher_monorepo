import { BreadcrumbBar } from "@/components/common/breadcrumb-bar";
import {
  PolicyChip,
  PolicyContactCard,
  PolicyRelatedLinks,
  type PolicyIcon,
} from "@/components/common/policy-doc";
import { PolicyToc, type PolicyTocItem } from "@/components/common/policy-toc";
import type { BusinessSettings } from "@/utils/types";
import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

export type PolicyRelatedItem = {
  href: string;
  label: string;
  description?: string;
};

/**
 * Shared shell for the storefront policy / information documents (Terms,
 * Privacy, Return & Refund, How to Order): breadcrumb, tinted hero, sticky
 * table of contents, a full-width document body and the closing contact
 * card. Pages only supply their sections, so every document keeps one
 * visual language.
 */
export function PolicyPageShell({
  icon: Icon,
  title,
  subtitle,
  eyebrow = "Legal & policies",
  updatedOn,
  chips = [],
  sections,
  related = [],
  contact,
  settings,
  children,
}: {
  icon: PolicyIcon;
  title: string;
  subtitle: ReactNode;
  eyebrow?: string;
  updatedOn?: string;
  chips?: { icon?: PolicyIcon; label: string }[];
  sections: PolicyTocItem[];
  related?: PolicyRelatedItem[];
  contact: { title: string; description: ReactNode; footnote?: ReactNode };
  settings?: BusinessSettings | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 md:px-0">
        <BreadcrumbBar items={[{ label: title }]} />
      </div>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-gray-200/70 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-primaryColor/[0.07] via-primaryColor/[0.02] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primaryColor/[0.08] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-secondaryColor/[0.07] blur-3xl"
        />

        <div className="container relative mx-auto px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-grid size-14 place-items-center rounded-2xl bg-primaryColor text-white shadow-lg shadow-primaryColor/25">
              <Icon className="size-7" />
            </span>
            <p className="mt-4 text-[11px] font-semibold tracking-[0.18em] text-primaryColor/70 uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-1 font-castor text-3xl leading-tight tracking-tight text-primaryColor sm:text-4xl md:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base md:text-lg">
              {subtitle}
            </p>

            {(updatedOn || chips.length > 0) && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {updatedOn && (
                  <PolicyChip icon={CalendarDays}>
                    Updated {updatedOn}
                  </PolicyChip>
                )}
                <PolicyChip>{sections.length} sections</PolicyChip>
                {chips.map((chip) => (
                  <PolicyChip key={chip.label} icon={chip.icon}>
                    {chip.label}
                  </PolicyChip>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body — fills the storefront container; the TOC rail is the only column split. */}
      <div className="container mx-auto px-4 py-8 sm:px-6 md:py-12">
        <div className="grid w-full gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
              <PolicyToc items={sections} />
              {updatedOn && (
                <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
                  Last updated {updatedOn}.
                </p>
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-4 sm:space-y-5">
            <PolicyToc items={sections} variant="panel" className="lg:hidden" />
            {children}
            <PolicyRelatedLinks items={related} />
            <PolicyContactCard
              title={contact.title}
              description={contact.description}
              footnote={contact.footnote}
              settings={settings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
