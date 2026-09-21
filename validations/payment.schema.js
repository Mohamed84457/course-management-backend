import { z } from "zod";

const createPaymentSchema = z.object({
  studentId: z
    .string({
      required_error: "studentId is required",
    })
    .min(1, "studentId is required"),

  courseId: z
    .string({
      required_error: "courseId is required",
    })
    .min(1, "courseId is required"),

  amount: z
    .number({
      required_error: "amount is required",
    })
    .min(0, "amount must be 0 or greater"),

  month: z
    .string({
      required_error: "month is required",
    })
    .min(1, "month is required"),

  paymentMethod: z
    .enum(["cash", "vodafone_cash", "bank_transfer", "card", "other"])
    .optional()
    .default("cash"),

  paymentStatus: z
    .enum(["completed", "pending", "refunded"])
    .optional()
    .default("completed"),

  notes: z.string().optional(),
});

const updatePaymentSchema = z.object({
  amount: z.number().min(0).optional(),
  month: z.string().min(1).optional(),
  paymentMethod: z
    .enum(["cash", "vodafone_cash", "bank_transfer", "card", "other"])
    .optional(),
  paymentStatus: z.enum(["completed", "pending", "refunded"]).optional(),
  notes: z.string().optional(),
});

export { createPaymentSchema, updatePaymentSchema };
