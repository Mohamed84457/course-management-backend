import z from "zod";

const lessonSchema = z.object({
  organizationId: z.string().optional(),
  courseId: z
    .string({
      required_error: "course id is required",
      invalid_type_error: "course id must be a string",
    })
    .min(1, "course id cannot be empty"),

  title: z
    .string({
      required_error: "title is required",
      invalid_type_error: "title must be a string",
    })
    .min(1, "title cannot be empty")
    .max(100, "title cannot be more than 100 characters"),

  description: z
    .string()
    .max(500, "description cannot be more than 500 characters")
    .optional(),

  materialUrl: z
    .string()
    .max(500, "material url cannot be more than 500 characters")
    .optional(),
  orderIndex: z.number().optional(),
  isPublished: z
    .boolean({
      required_error: "is published is required ",
      invalid_type_error: "is published must be a boolean",
    })
    .default(true),
});

export default lessonSchema;
