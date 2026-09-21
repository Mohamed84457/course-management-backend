import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  questionType: {
    type: String,
    enum: ["mcq", "true_false", "short_answer"],
    default: "mcq",
  },
  options: [
    {
      optionText: { type: String, required: true, trim: true },
      isCorrect: { type: Boolean, default: false },
    },
  ],
  points: {
    type: Number,
    default: 1,
    min: 0,
  },
  explanation: {
    type: String,
    trim: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    questions: [questionSchema],
    totalMarks: {
      type: Number,
      default: 0,
    },
    passingMarks: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: null, // null = no time limit
    },
    dueDate: {
      type: Date,
      default: null, //no expire date
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
  },
  { timestamps: true },
);

// Auto-calculate totalMarks from question points before saving
quizSchema.pre("save", function () {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce(
      (sum, q) => sum + (q.points || 0),
      0,
    );
  } else {
    this.totalMarks = 0;
  }
});

const quizModel = mongoose.model("Quiz", quizSchema);

export default quizModel;
