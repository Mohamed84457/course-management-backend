import z from "zod";

const questionSchema = z.object({
  questionText: z.string(),
  questionType: z.enum(["mcq", "true_false", "short_answer"]),
  options: z
    .array(
      z.object({
        optionText: z.string(),
        isCorrect: z.boolean().optional(),
      }),
    )
    .optional(),
  points: z.number().min(0).default(1),
  explanation: z.string().optional(),
});

const updateQuizSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  durationMinutes: z.number().optional(),
  passingMarks: z.number().optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  questions: z.array(questionSchema).optional(),
  dueDate: z.string().optional(),
});

export default updateQuizSchema;
