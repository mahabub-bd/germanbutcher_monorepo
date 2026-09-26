import type { Control } from "react-hook-form";
import type { z } from "zod";

import { productSchema } from "@/utils/form-validation";

export type ProductFormValues = z.output<typeof productSchema>;

export interface SectionControlProps {
  control: Control<ProductFormValues>;
}
