import z from "zod";

const submissionAssignmentSchema = z.object({
  fileUrl: z.string().url("please provide the valid url"),
  submissionNotes: z.string().optional(),
});

export default submissionAssignmentSchema;
