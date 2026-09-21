import z from "zod";

const gradeSubmissionSchema = z.object({
  grade: z
    .number()
    .min(0, "grade must be more than or equal 0 and less than or equal  100 ")
    .max(100, "grade must be more than or equal 0 and less than or equal  100 ")
    .optional(),
  bonusPoints: z.number().max(10).optional(),
  feedback: z.string().optional(),
  status: z.enum(["submitted", "graded", "resubmit"]).optional(),
});

export default gradeSubmissionSchema;
