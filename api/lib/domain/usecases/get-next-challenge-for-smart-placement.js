const { AssessmentEndedError } = require('../errors');
const SmartRandom = require('../services/smart-random/SmartRandom');
const _ = require('lodash');

module.exports = getNextChallengeForSmartPlacement;

function getNextChallengeInSmartRandom({ answers, challenges, targetProfile, knowledgeElements }) {
  const smartRandom = new SmartRandom({ answers, challenges, targetProfile, knowledgeElements });
  const nextChallenge = smartRandom.getNextChallenge();
  return _.get(nextChallenge, 'id', null);
}

function getSmartPlacementKnowledgeElements({ userId, assessmentsRepository, smartPlacementKnowledgeElementRepository }) {
  return assessmentsRepository.findSmartPlacementAssessmentsByUserId(userId)
    .then((assessments) => _.map(assessments, 'id'))
    .then((assessmentIds) => smartPlacementKnowledgeElementRepository.findByAssessmentIds(assessmentIds))
    .then((knowledgeElementsLists) => _.flatten(knowledgeElementsLists))
    .then((knowledgeElements) => removeIdenticalKnowledgeElements(knowledgeElements));
}

// It's possible that a knowledge element has already been covered by one or many previous smart placement. 
// We must only keep the most recent.
function removeIdenticalKnowledgeElements(knowledgeElements) {
  return _.reduce(knowledgeElements, (uniqueKnowledgeElements, currentKnowledgeElement) => {
    
    return thereExistsAMoreRecentIdenticalKnowledgeElement(uniqueKnowledgeElements, currentKnowledgeElement) 
      ? replaceKnowledgeElement(uniqueKnowledgeElements, currentKnowledgeElement)
      : uniqueKnowledgeElements.concat(currentKnowledgeElement);
  }, []);
}

function thereExistsAMoreRecentIdenticalKnowledgeElement(knowledgeElements, currentKnowledgeElement) {
  return _.find(knowledgeElements, (duplicatedKnowledgeElement) => {
    const isIdentical = duplicatedKnowledgeElement.id === currentKnowledgeElement.id;
    const isMoreRecent = duplicatedKnowledgeElement.createdAt > currentKnowledgeElement.createdAt;

    return isIdentical && isMoreRecent;
  });
}

function replaceKnowledgeElement(uniqueKnowledgeElements, currentKnowledgeElement) {
  return _.differenceBy(uniqueKnowledgeElements, [currentKnowledgeElement], 'skillId').concat(currentKnowledgeElement);
}

function getNextChallengeForSmartPlacement({ assessment, answerRepository, challengeRepository, assessmentsRepository, smartPlacementKnowledgeElementRepository, targetProfileRepository } = {}) {
  let answers, targetProfile, knowledgeElements;
  const targetProfileId = assessment.campaignParticipation.getTargetProfileId();
  const userId = assessment.userId;

  return Promise.all([
    answerRepository.findByAssessment(assessment.id),
    targetProfileRepository.get(targetProfileId),
    getSmartPlacementKnowledgeElements({ userId, assessmentsRepository, smartPlacementKnowledgeElementRepository })]

  ).then(([answersOfAssessments, targetProfileFound, knowledgeElementsOfAssessments]) => {
    answers = answersOfAssessments;
    targetProfile = targetProfileFound;
    knowledgeElements = knowledgeElementsOfAssessments;

    return challengeRepository.findBySkills(targetProfile.skills);
  })
    .then((challenges) => getNextChallengeInSmartRandom({ answers, challenges, targetProfile, knowledgeElements }))
    .then((nextChallenge) => {
      if (nextChallenge) {
        return nextChallenge;
      }
      throw new AssessmentEndedError();
    })
    .then(challengeRepository.get);
}
