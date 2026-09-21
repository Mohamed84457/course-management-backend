import z from "zod";

const updateCourseSchema = z.object({
  categoryId: z.string().optional(),
  teacherId: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  price: z.number().min(0).optional(),
  level: z
    .enum(["beginner", "intermediate", "advanced", "all_levels"])
    .optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  educationLevel: z.string().trim().optional(),
  durationHours: z.number().optional(),
  lessonsCount: z.number().optional(),
  capacity: z.number().optional(),
  isFeatured: z.boolean().optional(),
});

export default updateCourseSchema;
