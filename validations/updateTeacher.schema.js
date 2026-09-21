import { z } from "zod";

const updateTeacherSchema = z.object({
  // teacher data
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.number().optional(),
  bio: z.string().optional(),
  salary: z.number().optional(),
});

export { updateTeacherSchema };
