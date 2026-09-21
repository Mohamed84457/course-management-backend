import z from "zod";

const quizSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionId: z.string().optional(),
      answerText: z.string().optional(),
    }),
  ),
});

export default quizSubmissionSchema;
