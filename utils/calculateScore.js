const calculateScore = (answers, questions) => {
  let gradedAnswers = [];
  if (answers.length < 1) return [];
  for (const question of questions) {
    if (question.questionType === "short_answer") {
      gradedAnswers.push({
        questionId: question._id,
        selectedOptionId: null,
        pointsObtained: 0,
        isCorrect: false,
      });
      continue;
    }
    const studentAnswer = answers.find(
      (a) => a.questionId.toString() === question._id.toString(),
    );
    // Student didn't answer
    if (!studentAnswer) {
      gradedAnswers.push({
        questionId: question._id,
        selectedOptionId: null,
        pointsObtained: 0,
        isCorrect: false,
      });
      continue;
    }
    const correctAnswer = question.options.find((o) => o.isCorrect);
    if (!correctAnswer) continue;

    if (
      studentAnswer.selectedOptionId.toString() === correctAnswer._id.toString()
    ) {
      gradedAnswers.push({
        questionId: question._id,
        selectedOptionId: studentAnswer.selectedOptionId,
        pointsObtained: question.points,
        isCorrect: true,
      });
    } else {
      gradedAnswers.push({
        questionId: question._id,
        selectedOptionId: studentAnswer.selectedOptionId,
        pointsObtained: 0,
        isCorrect: false,
      });
    }
  }
  return gradedAnswers;
};

export { calculateScore };
