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

const quizSchema = z.object({
  lessonId: z.string(),
  title: z.string().max(200),
  description: z.string().optional(),
  totalMarks: z.number().default(0),
  passingMarks: z.number().default(0),
  durationMinutes: z.number().default(null),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  questions: z.array(questionSchema),
  dueDate: z.string().optional(),
});

export default quizSchema;
