const sanitizeQuestions = (questions) => {
  return questions.map((q) => {
    if (q.questionType === "mcq" || q.questionType === "true_false") {
      return {
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        options: q.options.map((option) => ({
          optionText: option.optionText,
          _id: option._id,
        })),
      };
    } else {
      return {
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
      };
    }
  });
};

export { sanitizeQuestions };
