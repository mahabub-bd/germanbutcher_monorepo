import { HeadingPrimary } from "@/components/common/heading-primary";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
};

export function Section({ children, className }: SectionProps) {
  return <section className={cn("py-5 md:py-10", className)}>{children}</section>;
}

type SectionTitleProps = {
  title: string;
  className?: string;
};

export function SectionTitle({ title, className }: SectionTitleProps) {
  return <HeadingPrimary title={title} className={cn("mb-10", className)} />;
}
