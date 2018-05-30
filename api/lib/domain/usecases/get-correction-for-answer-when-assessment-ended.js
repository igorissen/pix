const { NotCompletedAssessmentError } = require('../errors');

module.exports = function({
  assessmentRepository,
  answerRepository,
  correctionRepository,
  answerId
} = {}) {
  let answer;
  return answerRepository.get(answerId)
    .then((answerFromRepo) => {
      answer = answerFromRepo;
    })
    .then(() => assessmentRepository.get(answer.assessmentId))
    .then(_validateCorrectionIsAccessible)
    .then(() => correctionRepository.getByChallengeId(answer.challengeId));
};

function _validateCorrectionIsAccessible(assessment) {
  if (!assessment.isCompleted() && !assessment.isSmartPlacementAssessment()) {
    throw new NotCompletedAssessmentError();
  }
}
