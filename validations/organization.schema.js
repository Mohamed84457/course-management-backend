import z from "zod";

const organizationSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.string().email("invalid email"),
  phone: z
    .string()
    .min(1, "phone is required")
    .regex(/^\+?[0-9]{10,15}$/, "invalid phone number"),
  address: z.string().min(1, "address required"),
  logo: z.string().optional().nullable(),
  website: z.string().url("invalid website url").optional().nullable(),
  isActive: z.boolean().optional().default(true),
  settings: z
    .object({
      currency: z.string().default("EGP"),
      timezone: z.string().default("Africa/Cairo"),
      language: z.string().default("en"),
    })
    .optional()
    .default({}),
});

export { organizationSchema };
