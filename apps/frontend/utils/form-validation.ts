import { z } from "zod";
import { BannerPosition, BannerType, DiscountType } from "./types";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    mobileNumber: z.string().min(11, "Number should be 11 digit"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Confirm Password must be at least 8 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
});

const bannerSchema = z.object({
  title: z.string().min(1, "Banner title is required"),
  description: z.string().optional(),
  targetUrl: z.string().url("Please enter a valid URL"),
  position: z.nativeEnum(BannerPosition, {
    message: "Position is required"
  }),
  type: z.nativeEnum(BannerType, {
    message: "Type is required"
  }),
  isActive: z.boolean(),
  displayOrder: z.any()
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (typeof num !== 'number' || isNaN(num)) {
        throw new Error("Display order must be a number");
      }
      return num as number;
    })
    .pipe(z.number().int().min(0, "Display order must be a positive number")),
  imageUrl: z.string().optional(),
});

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  mobileNumber: z
    .string()
    .min(10, "Please enter a valid mobile number")
    .startsWith("+880", "Mobile number must start with +880"),
  roleId: z.string().min(1, "Please select at least one role"),
  isVerified: z.boolean(),
});

const menuSchema = z.object({
  name: z.string().min(1, "Menu name is required"),
  url: z.string().min(1, "URL is required"),
  icon: z.string().optional().nullable(),
  parentId: z.number().nullable().optional(),
  order: z.number().min(0, "Order must be a positive number"),
  isMainMenu: z.boolean(),
  isActive: z.boolean(),
  isAdminMenu: z.boolean(),
});

const paymentSchema = z.object({
  amount: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseFloat(val) : val)
    .pipe(z.number().min(0.01, "Amount must be greater than 0")),
  paymentDate: z.union([z.string(), z.date()])
    .transform((val) => typeof val === 'string' ? new Date(val) : val)
    .pipe(z.date({
      message: "Payment date is required"
    })),
  paymentMethodId: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .pipe(z.number().min(1, "Payment method is required")),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const productSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    productDetails: z.string().optional(),
    sellingPrice: z.union([z.string(), z.number()])
      .transform((val) => typeof val === 'string' ? parseInt(val) : val)
      .pipe(z.number().int().min(1, "Sale price must be a whole number greater than 0")),
    purchasePrice: z.union([z.string(), z.number()])
      .transform((val) => typeof val === 'string' ? parseInt(val) : val)
      .pipe(z.number().int().min(1, "Purchase price must be a whole number greater than 0")),
    stock: z.union([z.string(), z.number()])
      .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
      .pipe(z.number().int().nonnegative("Stock cannot be negative")),
    unitId: z.union([z.string(), z.number()])
      .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
      .pipe(z.number().min(1, "Unit is required")),
    productSku: z.string().min(1, "SKU is required"),
    imageUrl: z.string().optional(),
    weight: z.union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((val) => val === null || val === undefined ? undefined : (typeof val === 'string' ? parseFloat(val) : val))
      .pipe(z.number().optional()),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    brandId: z.union([z.string(), z.number()])
      .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
      .pipe(z.number().min(1, "Brand is required")),
    galleryId: z.union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((val) => val === null || val === undefined ? undefined : (typeof val === 'string' ? parseInt(val, 10) : val))
      .pipe(z.number().optional()),
    categoryId: z.union([z.string(), z.number()])
      .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
      .pipe(z.number().min(1, "Category is required")),
    supplierId: z.union([z.string(), z.number()])
      .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
      .pipe(z.number().min(1, "Supplier is required")),
    hasDiscount: z.boolean(),
    discountType: z.nativeEnum(DiscountType).optional(),
    discountValue: z.union([z.string(), z.number(), z.null(), z.undefined()])
      .transform((val) => val === null || val === undefined ? undefined : (typeof val === 'string' ? parseFloat(val) : val))
      .pipe(z.number().optional()),
    discountStartDate: z.union([z.string(), z.date(), z.null(), z.undefined()])
      .transform((val) => val === null || val === undefined ? undefined : (typeof val === 'string' ? new Date(val) : val))
      .pipe(z.date().optional()),
    discountEndDate: z.union([z.string(), z.date(), z.null(), z.undefined()])
      .transform((val) => val === null || val === undefined ? undefined : (typeof val === 'string' ? new Date(val) : val))
      .pipe(z.date().optional()),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasDiscount) {
      if (!data.discountType) {
        ctx.addIssue({
          code: "custom",
          message: "Discount type is required",
          path: ["discountType"],
        });
      }
      if (data.discountValue === undefined || data.discountValue <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Discount value must be greater than 0",
          path: ["discountValue"],
        });
      }
      if (!data.discountStartDate) {
        ctx.addIssue({
          code: "custom",
          message: "Discount start date is required",
          path: ["discountStartDate"],
        });
      }
      if (!data.discountEndDate) {
        ctx.addIssue({
          code: "custom",
          message: "Discount end date is required",
          path: ["discountEndDate"],
        });
      }
      if (
        data.discountStartDate &&
        data.discountEndDate &&
        data.discountEndDate <= data.discountStartDate
      ) {
        ctx.addIssue({
          code: "custom",
          message: "End date must be after start date",
          path: ["discountEndDate"],
        });
      }
    }
  });

const purchaseSchema = z.object({
  supplierId: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .pipe(z.number().min(1, "Supplier is required")),
  items: z
    .array(
      z.object({
        productId: z.union([z.string(), z.number()])
          .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
          .pipe(z.number().min(1, "Product is required")),
        quantity: z.union([z.string(), z.number()])
          .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
          .pipe(z.number().min(1, "Minimum quantity is 1")),
        unitPrice: z.union([z.string(), z.number()])
          .transform((val) => typeof val === 'string' ? parseFloat(val) : val)
          .pipe(z.number().min(0.01, "Minimum price is 0.01")),
      })
    )
    .min(1, "At least one item required"),
  purchaseDate: z.union([z.string(), z.date()])
    .transform((val) => typeof val === 'string' ? new Date(val) : val)
    .pipe(z.date()),
  status: z.enum(["pending", "shipped", "delivered", "cancelled"]),
  notes: z.string().optional(),
});

const roleSchema = z.object({
  rolename: z
    .string()
    .min(2, "Role name must be at least 2 characters"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters"),
  isActive: z.boolean(),
});

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
});

const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseFloat(val) : val)
    .pipe(z.number()
      .min(0.01, "Value must be greater than 0")
      .refine((val) => val >= 0, "Value cannot be negative")),
  maxDiscountAmount: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === null || val === undefined) return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (num < 0) throw new Error("Maximum discount amount cannot be negative");
      return num;
    })
    .nullable()
    .optional(),
  minOrderAmount: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === null || val === undefined) return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (num < 0) throw new Error("Minimum order amount cannot be negative");
      return num;
    })
    .nullable()
    .optional(),
  maxUsage: z.union([z.string(), z.number(), z.undefined()])
    .transform((val) => val === undefined ? undefined : (typeof val === 'string' ? parseInt(val, 10) : val))
    .pipe(z.number().min(1, "Max usage must be at least 1").optional()),
  validFrom: z.union([z.string(), z.date()])
    .transform((val) => typeof val === 'string' ? new Date(val) : val)
    .pipe(z.date({
      message: "Start date is required"
    })),
  validUntil: z.union([z.string(), z.date()])
    .transform((val) => typeof val === 'string' ? new Date(val) : val)
    .pipe(z.date({
      message: "End date is required"
    })),
  isActive: z.boolean(),
  excludedItemIds: z.array(z.number()).optional(),
});

const discountFormSchema = z.object({
  discountType: z.nativeEnum(DiscountType, {
    message: "Please select a discount type"
  }),
  discountValue: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseFloat(val) : val)
    .refine((val) => val > 0, { message: "Discount must be greater than 0" }),
  startDate: z.union([z.string(), z.date()])
    .transform((val) => typeof val === 'string' ? new Date(val) : val),
  endDate: z.union([z.string(), z.date()])
    .transform((val) => typeof val === 'string' ? new Date(val) : val),
  productIds: z.array(z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
  ).min(1, "Please select at least one product"),
});

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
  }),
  shippingAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
  }),
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        price: z.number().min(0, "Price must be at least 0"),
      })
    )
    .min(1, "At least one item is required"),
  notes: z.string().optional(),
});

const addressSchema = z.object({
  address: z.string().min(1, "Address is required").trim(),
  area: z.string().min(1, "Area is required").trim(),
  division: z.string().min(1, "Division is required"),
  city: z.string().min(1, "City is required").trim(),
  type: z.enum(["shipping", "billing"], {
    message: "Please select an address type"
  }),
  isDefault: z.boolean(),
});

const testimonialSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  role: z
    .string()
    .min(2, "Role must be at least 2 characters")
    .max(100, "Role must be less than 100 characters"),
  text: z
    .string()
    .min(10, "Testimonial text must be at least 10 characters")
    .max(2000, "Testimonial text must be less than 2000 characters"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  isPublish: z.boolean(),
  imageUrl: z.string().url("Image URL must be a valid URL")
    .optional()
    .or(z.literal("")),
});

const deliveryManSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  mobileNumber: z
    .string()
    .min(10, "Please enter a valid mobile number")
    .startsWith("+880", "Mobile number must start with +880"),
  isActive: z.boolean(),
});

export {
  addressSchema,
  bannerSchema,
  brandSchema,
  couponSchema,
  deliveryManSchema,
  discountFormSchema,
  loginSchema,
  menuSchema,
  orderSchema,
  paymentSchema,
  productSchema,
  purchaseSchema,
  registerSchema,
  roleSchema,
  supplierSchema,
  testimonialSchema,
  userSchema
};
