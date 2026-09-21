import { z } from "zod";

const promotionToTeacher = z.object({
  // teacher data
  specialization: z.string(),
  qualification: z.string(),
  experience: z.number().default(0),
  bio: z.string().optional(),
  salary: z.number().min(2, "reuired salary"),
});

export { promotionToTeacher };
