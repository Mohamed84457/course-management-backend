import mongoose from "mongoose";

const quizSubmissionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId },
        selectedOptionId: { type: mongoose.Schema.Types.ObjectId },
        answerText: { type: String },
        isCorrect: { type: Boolean, default: false },
        pointsObtained: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0, min: 0 }, // Extra bonus points awarded
    totalScore: { type: Number, default: 0 }, // score + bonusPoints
    isPassed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const quizSubmissionModel = mongoose.model(
  "QuizSubmission",
  quizSubmissionSchema,
);

export default quizSubmissionModel;
