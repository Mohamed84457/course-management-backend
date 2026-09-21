import z from "zod";

const assignmentSchema = z.object({
  lessonId: z.string().min(1, "lessonId required"),

  title: z.string().min(1, "title required").max(100, "invalid title"),

  description: z.string().max(500, "too many description").optional(),

  totalPoints: z
    .number()
    .int("totalPoints must be an integer")
    .min(0, "totalPoints cannot be negative")
    .max(1000, "too many total points")
    .optional(),

  attachmentUrl: z.string().optional(),

  dueDate: z.string().refine((value) => !isNaN(Date.parse(value)), {
    message: "Invalid dueDate",
  }),
  status: z.enum(["draft", "published", "closed"]).default("published"),
});

export default assignmentSchema;
