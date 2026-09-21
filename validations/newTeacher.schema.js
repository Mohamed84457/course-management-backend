import z from "zod";

const newteacherSchema = z.object({
  name: z
    .string()
    .min(3, "name must be at least 3 characters long")
    .max(100, "name cannot be more than 100 characters long"),
  email: z
    .string({
      required_error: "Email is required",
    })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z
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

  role: z.array(z.string()).default(["teacher"]),
  organizationId: z.string().nullable().optional(),
  isactive: z.boolean().default(true),
  gender: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
  isEmailVerified: z.boolean().default(false),
  lastLogin: z.date().optional(),
  // teacher data
  specialization: z.string(),
  qualification: z.string(),
  experience: z.number().default(0),
  bio: z.string().optional(),
  salary: z.number().min(2, "reuired salary"),
});

export default newteacherSchema;
