const Course = require('../../models/Course');
const catAlgorithm = require('./cat-algorithm');
const { getFilteredSkillsForNextChallenge, getFilteredSkillsForFirstChallenge } = require('./skills-filter');
const _ = require('lodash');

const UNEXISTING_ITEM = null;

module.exports = { getNextChallenge };

function getNextChallenge({ knowledgeElements, challenges, targetSkills, answers } = {}) {

  const lastChallenge = _findLastChallengeIfAny(answers, challenges);
  const isUserStartingTheTest = !lastChallenge;
  const courseTubes = _findCourseTubes(targetSkills, challenges);
  const knowledgeElementsOfTargetSkills = knowledgeElements.filter((ke) => {
    return targetSkills.find((skill) => skill.id === ke.skillId);
  });

  // First challenge has specific rules
  const { nextChallenge, levelEstimated } = isUserStartingTheTest
    ? _findFirstChallenge({ challenges, knowledgeElements: knowledgeElementsOfTargetSkills, targetSkills, courseTubes })
    : _findAnyChallenge({ challenges, knowledgeElements: knowledgeElementsOfTargetSkills, targetSkills, courseTubes, lastChallenge });

  // Test is considered finished when no challenges are returned but we don't expose this detail
  return nextChallenge
    ? { hasAssessmentEnded: false, nextChallenge, levelEstimated }
    : { hasAssessmentEnded: true, nextChallenge: null, levelEstimated };
}

function _findLastChallengeIfAny(answers, challenges) {
  const lastAnswer = _.last(answers);
  if (lastAnswer) {
    return challenges.find((challenge) => challenge.id === lastAnswer.challengeId) || UNEXISTING_ITEM;
  }
}

function _findCourseTubes(skills, challenges) {
  const course = new Course();
  const listSkillsWithChallenges = _filterSkillsByChallenges(skills, challenges);
  course.competenceSkills = listSkillsWithChallenges;
  return course.computeTubes(listSkillsWithChallenges);
}

function _filterSkillsByChallenges(skills, challenges) {
  const skillsWithChallenges = skills.filter((skill) => {
    return challenges.find((challenge) => {
      return challenge.skills.find((challengeSkill) => skill.name === challengeSkill.name);
    });
  });
  return skillsWithChallenges;
}

function _findAnyChallenge({ challenges, knowledgeElements, targetSkills, courseTubes, lastChallenge }) {
  const predictedLevel = catAlgorithm.getPredictedLevel(knowledgeElements, targetSkills);
  const availableSkills = getFilteredSkillsForNextChallenge({ challenges, knowledgeElements, courseTubes, predictedLevel, lastChallenge, targetSkills });
  const maxRewardingChallenges = catAlgorithm.findMaxRewardingSkills({ availableSkills, predictedLevel, courseTubes, knowledgeElements });
  return { nextChallenge: _pickRandomChallenge(maxRewardingChallenges), levelEstimated: predictedLevel };
}

function _findFirstChallenge({ challenges, knowledgeElements, targetSkills, courseTubes }) {
  const filteredSkillsForFirstChallenge = getFilteredSkillsForFirstChallenge({ challenges, knowledgeElements, courseTubes, targetSkills });
  return { nextChallenge: _pickRandomChallenge(filteredSkillsForFirstChallenge), levelEstimated: 2 };
}

function _pickRandomChallenge(skills) {
  if (skills.length === 0) { return UNEXISTING_ITEM; }
  const chosenSkill = _.sample(skills);
  return _.sample(chosenSkill.challenges);
}
