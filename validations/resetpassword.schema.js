import { z } from "zod";

const resetPasswordSchema = z.object({
  resetToken: z
    .string({
      required_error: "Reset token is required",
    })
    .trim()
    .min(1, "Reset token is required"),

  newPassword: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/,
      "Password must contain at least one special character",
    )
    .regex(/^\S*$/, "Password must not contain spaces"),
});

export default resetPasswordSchema;
